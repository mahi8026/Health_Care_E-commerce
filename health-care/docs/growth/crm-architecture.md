# CRM & Lead Pipeline Architecture — Phase 4.2

**Status:** Phase 4.2 implementation (foundation).
**Business contract:** `docs/growth/crm-field-contract.md` (authoritative field vocabulary).
**Depends on:** Phase 4.1 funnel/attribution (`funnelTracking.js`, `attribution.js`, `utm-convention.md`).

## 1. Architecture

The CRM is a **pipeline layer**, not a second CRM application and never a second
quotation system.

| Concern | System of record | CRM's relationship |
|---|---|---|
| Customers / accounts | `backend/src/models/User.js` | optional reference (`customer`) |
| Quotations (RFQ) | `backend/src/models/Quote.js` (`POST /api/quotes`) | **reference only** (`related_quotes[].quote_number`) |
| Orders | `backend/src/models/Order.js` | none (untouched) |
| Behaviour / analytics | GA4 + `backend/src/models/MarketingEvent.js` | none — funnel activity never becomes a lead automatically |
| Leads / pipeline | **`backend/src/models/Lead.js`** (Phase 4.2) | authoritative |

Components:

- `backend/src/models/Lead.js` — schema, enums, pure helpers (source derivation, UTM sanitisation, note sanitisation, transition table, duplicate-lead keys).
- `backend/src/controllers/crmController.js` — list/get/create/update/assign/notes/link-quote/metrics.
- `backend/src/routes/crmRoutes.js` — mounted at `/api/crm` in `backend/src/server.js`.
- `src/app/admin/leads/page.jsx` + `src/components/admin/LeadsManagement.jsx` — admin surface.

Storage is a new, additive Mongoose collection (`leads`). Indexes are declared
on the schema and are created lazily by Mongoose; **no migration, seed or
destructive script is run against any database by this phase.**

## 2. Lead lifecycle

`new → verified → contacted → qualified → rfq → quoted → won`
plus `lost → dormant → contacted` (re-open) and `→ lost` from any active state.

- Implemented as an explicit `TRANSITIONS` map in `models/Lead.js`; the server
  rejects illegal jumps with `400` and returns the currently allowed set.
- Same-state writes are no-ops; `won` is terminal.
- Terminology is **verbatim** from `crm-field-contract.md` (`lead_status`).
  Mapping from the proposed pipeline wording: NEW→`new`, CONTACTED→`contacted`,
  QUALIFIED→`qualified`, RFQ→`rfq`, QUOTED→`quoted`, WON→`won`, LOST→`lost`,
  NURTURE→`dormant`, NEGOTIATION→`rfq_status = negotiating` (quote-side state).
- `rfq_status` (`none|requested|quoted|negotiating|won|lost`) and
  `customer_status` (`prospect|first_order|repeat|standing_order`) use the same
  contract enums — no competing status system.

## 3. Field mapping

Business contract field → stored field (snake_case preserved from the contract;
the rest of the backend keeps camelCase):

| Contract | Stored |
|---|---|
| organization / organization_type / district / division / city | identical |
| contact_name / contact_role / phone / official_email | `contact_name`, `contact_role`, `phone`, `email` |
| website / facebook_url / linkedin_url | identical |
| likely_product_category | identical |
| source, medium, campaign, content, landing_page | identical (first-touch) |
| first_touch_at / last_touch_at / first_contact_at | identical |
| status / lead_quality / assigned_to / notes | identical |
| created_at / updated_at | Mongoose `timestamps` with those exact names |

`lead_id` follows `LD-YYYY-NNNN` with a collision-safe generator mirroring the
`quoteNumber` approach. Contract-only business notes: `lead_source` and other
enums are validated against the contract enums; anything outside the schema is
dropped (Mongoose `strict`), so `utm_term`/`gclid` can never be persisted.

## 4. Attribution mapping

Phase 4.1 captures the first-touch tuple in `sessionStorage.mediport_utm` (four
allowlisted keys only). When a lead is created the payload is passed as
`attribution` and re-sanitised server-side (`sanitizeAttribution`) — `utm_term`,
`gclid`, `phone`, etc. are discarded, values are trimmed and capped at 64 chars.

`lead_source` derivation (`deriveLeadSource`) follows the contract rule:

- `utm_source=google & utm_medium=cpc` → `google_ads`
- `utm_source=facebook|instagram` → `meta`
- any other `utm_source` → `referral`
- `utm_medium` without source → `outbound`
- explicit WhatsApp context → `whatsapp_direct`
- repeat customer → `existing_customer`
- nothing → `organic`

CRM data is **never** sent to GA4 or Meta; attribution flows one way (web → CRM).

## 5. RFQ → lead association (Section F boundary)

The quotation stays the source of truth. Association is **reference-only**:

1. Admin calls `POST /api/crm/:id/quote` with a `quote_number`.
2. The controller performs a **read-only** `Quote.findOne({ quoteNumber })`.
3. On success it stores `{ quote, quote_number, linked_at }` on the lead, sets
   `rfq_status: requested`, and advances `status → rfq` **only if that
   transition is legal** for the current state.
4. No write to `Quote`, no pricing/payment-terms/validation change, no quote
   duplication (asserted in tests).

**Integration boundary deliberately not crossed:** `quoteController.createQuote`
could persist attribution/link the originating lead automatically, but that
touches protected quote logic (validation, pricing, payment terms, response).
Automatic RFQ→lead creation is therefore deferred and requires explicit
approval of a single fire-and-forget call after `Quote.create()` succeeds.

**Resolved (Phase 4.2-D0):** the eligibility contract is now authoritative in
`crm-field-contract.md` § *Automatic RFQ → Lead association contract* — the
fire-and-forget call after `Quote.create()` is approved **subject to those
rules** (admin-approved B2B gate, lookup by `customer` only, link-only for
eligible users, and automatic Lead creation only from a complete business
profile: approved business phone + explicitly supplied division + exact-match
organization type). With today's repository state automatic creation always
skips; implementation belongs to Phase 4.2-D.
## 6. Admin permissions

Every `/api/crm` route runs `protect → authorize('admin') → adminApiLimiter`
(the same stack as `/api/admin`).

- No public or unauthenticated CRM route exists (`GET /api/crm` and
  `POST /api/crm` both require an admin JWT).
- Lead records (business phone/email/organization) are never returned by any
  public endpoint, never rendered in public pages and never exported to GA4/Meta.
- Validation and sanitisation are server-side: required fields, contract enums,
  phone/email/URL shapes, note sanitisation (HTML tags, control chars, 2000 char
  cap, 100 notes max), query filters validated against enums before use.
- The admin UI reuses the existing `/admin` surface, `AdminShell` layout and the
  `Mediport_token` bearer convention; no new auth path was introduced.

## 7. Data retention assumptions

- Leads are retained indefinitely in this phase (no auto-purge implemented).
- Notes are capped at 100 per lead and 2000 characters each.
- Attribution fields are first-touch and immutable-by-default (last-touch is
  timestamped, not overwritten).
- Analytics events remain in GA4/`MarketingEvent` and are not duplicated into CRM.
- If retention/erasure requirements are introduced, they are a CRM-layer concern
  only (Quote/User/Order records are unaffected).

## 8. Future CRM integration boundaries

1. **Automatic RFQ → lead creation** — single guarded call after
   `quoteController.createQuote` succeeds; eligibility contract resolved in
   Phase 4.2-D0 (see `crm-field-contract.md` § *Automatic RFQ → Lead
   association contract*); implementation belongs to Phase 4.2-D.
2. **WhatsApp identifiable enquiry → lead** — only when a visitor actually
   supplies contact details (form/consent); a `whatsapp_click` alone must never
   mint a lead.
3. **Duplicate-lead merging** — `buildDuplicateCandidateQuery` /
   `isPotentialDuplicate` (org + phone + email keys) are available for an
   explicit merge workflow; no automatic merge in this phase.
4. **Dashboard metrics expansion** — quote-to-order and revenue metrics stay in
   the quote/order systems; CRM reports counts only.
5. **Third-party CRM sync** (spreadsheet/Notion export) — read-only export of
   the contract fields; CRM must not become a second source for quotations.

## 9. Verification

Tests (synthetic data only, no real database):

- `backend/src/models/__tests__/Lead.test.js` — schema validation, enum
  rejection, transitions, UTM allowlist, note sanitisation, quote-reference shape.
- `backend/src/controllers/__tests__/crmController.test.js` — creation, invalid
  rejection, transitions, assignment, notes, attribution, RFQ association,
  metrics.
- `backend/src/routes/__tests__/crmRoutes.test.js` — real
  `protect`/`authorize` chain: 401 anonymous, 403 non-admin, 200 admin,
  no public path reaches a controller.
- `src/__tests__/phase42CrmLeads.test.js` — admin list/filter/detail/transition
 /link-quote contract and 403 handling.

Regression: existing Phase 4.1 funnel tests, quote/pricing tests and the full
suites must stay green — Phase 4.2 does not modify them.

