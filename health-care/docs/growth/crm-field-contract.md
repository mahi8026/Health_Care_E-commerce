# CRM Field Contract — Phase 4.1 (Workstream A)

**Status:** authoritative schema for the Phase 4.0 lead pipeline.
**Phase 4.2 implementation:** fields, lead lifecycle, attribution mapping, the RFQ association boundary and admin permissions are implemented against this contract — see `crm-architecture.md`. The spreadsheet/Notion CRM remains the pipeline-of-record for reporting; the admin "CRM Leads" surface is an operational view of the same fields and does not replace it. Quotations are never stored here.

**Implementation vehicle:** spreadsheet/Notion CRM (per approved strategy — no CRM application is built; this document IS the contract). The website's existing quote system (`POST /api/quotes`, account/admin quote pages) remains the system of record for quotations; CRM records reference quotes, they do not replace them.

## Fields (every lead record)

| Field | Type | Required | Notes |
|---|---|---|---|
| organization | string | yes | Facility/business name |
| city | string | yes | |
| district | string | yes | Drives geo-wave segmentation |
| org_type | enum (below) | yes | |
| website | url | no | Public business site only |
| facebook_url | url | no | Public business page only |
| linkedin_url | url | no | Public page only |
| phone | string | yes | **Published business number only** — never personal data |
| official_email | string | no | Published business email only |
| contact_person | string | no | Publicly identified role-holder only |
| contact_role | string | no | e.g. Lab Manager, Owner |
| likely_product_category | string | yes | Mediport catalog category name |
| lead_source | enum (below) | yes | Must match the `lead_source`/UTM of first touch |
| lead_status | enum (below) | yes | |
| last_contact | date | yes | |
| next_action | string | yes | No status advance without a next action |
| next_action_date | date | yes | |
| rfq_status | enum (below) | yes | |
| customer_status | enum (below) | yes | |
| notes | string | no | No sensitive personal information |

## Enums

**org_type:** `hospital` | `clinic` | `diagnostic_centre` | `laboratory` | `pharmacy` | `institution` | `healthcare_professional` | `other`

**lead_source:** `organic` | `google_ads` | `meta` | `whatsapp_direct` | `outbound` | `referral` | `event` | `existing_customer`
> First-touch UTM maps in: `utm_source=google & utm_medium=cpc` → `google_ads`; `utm_source=facebook|instagram` → `meta`; no UTM + non-paid referrer → `organic`; direct WhatsApp without web session → `whatsapp_direct`.

**lead_status:** `new` → `verified` → `contacted` → `qualified` → `rfq` → `quoted` → `won` | `lost` | `dormant`

**rfq_status:** `none` | `requested` | `quoted` | `negotiating` | `won` | `lost`

**customer_status:** `prospect` | `first_order` | `repeat` | `standing_order`

## Rules

1. Only publicly available business information is collected. No private/personal data.
2. `lead_source` is mandatory and single-valued (first touch wins; later touches go to `notes` or campaign history).
3. Web-origin leads carry the UTM tuple from `mediport_utm` (see `utm-convention.md`) so `lead_source` can be derived, not guessed.
4. Quotes/orders are never duplicated in the CRM — CRM references the quote number from the existing quote system.

## Automatic RFQ → Lead association contract (Phase 4.2-D0)

**Status:** authoritative. This section resolves the four ambiguities that
blocked Phase 4.2-D. The rules are deterministic — Phase 4.2-D implements them
verbatim and makes no further business decisions.

### 1. Eligibility gate — canonical rule

A user is *CRM-association eligible* if and only if:

```
user.b2bAccount === true && user.b2bApprovalStatus === 'approved'
```

**Decision outcome: `REQUIRES_BUSINESS_PROFILE_COMPLETION`.** Passing the gate
makes a user *associable* (a quote reference may be linked to their existing
Lead); it never by itself authorises creating a Lead — creation additionally
requires the complete profile of §2/§4/§5.

Evidence for this gate:

- It is the repository's own existing B2B-privilege gate
  (`b2bController.js`: `!user.b2bAccount || user.b2bApprovalStatus !== 'approved'`)
  and is mirrored by B2B pricing eligibility (`pricingService.js`).
- `b2bApprovalStatus` is written **only** by `approveB2BUser`/`rejectB2BUser`,
  behind `protect, authorize('admin')` (`routes/b2bRoutes.js`). It is never
  client-writable.

Signals explicitly **rejected** as eligibility criteria (all evaluated, none
sufficient alone):

| Signal | Source | User-controlled | Admin-approved | Eligible criterion? |
|---|---|---|---|---|
| `accountType === 'B2B'` | client field at register (`authController.register`) | **yes** (registration toggle) | also set by admin on approve | **no** |
| `role === 'b2b_customer'` | derived from client `accountType` at register | **yes** | no | **no** |
| `b2bAccount === true` | set from client `accountType` at register | **yes** | also set on approve/reject | **no** (required, not sufficient) |
| `companyName` present | registration/profile free text (min 3 chars in the B2B form) | **yes** | no | **no** — but authoritative for `organization` once the gate passes |
| `b2bApprovalStatus === 'approved'` | `b2bController` only | **no** | **yes** | **yes** — core of the gate |

Users failing the gate are **`NOT_ELIGIBLE`**: the RFQ flow performs no CRM
read and no CRM write for them.

### 2. Business phone requirement

- `Lead.phone` = **published business number only** (existing rule, unchanged).
- **`User.phone` must NEVER be copied into `Lead.phone`.** It is the
  account/OTP phone (personal data); contract rule 1 forbids it. The same
  prohibition applies to `bkashPhone`.
- The repository contains **no per-user business-phone field**. An exhaustive
  search for `companyPhone|businessPhone|officePhone|institutionPhone|contactPhone|organizationPhone`
  returns only `Settings.contactPhone` and `whatsappService.businessPhone` —
  both MediportBD's own public numbers, not customer data. The B2B registration
  form, account profile form and admin B2B list expose no business-phone input.
- Therefore: **automatic Lead creation additionally requires an approved
  business phone, which does not exist in the repository today — automatic Lead
  creation is consequently inert until a future phase introduces that field.**
  It must never be simulated, inferred or replaced by `User.phone`.
- Linking a quote reference to an **already existing** admin-created Lead needs
  no phone and remains allowed for eligible users (§7).

### 3. Division source

- `division` is schema-required on `Lead` and is asserted required by
  `models/__tests__/Lead.test.js`; `POST /api/crm` already requires the admin to
  supply it (`crmController.createLead`).
- **Division is never derived from district.** The district→division map exists
  only as duplicated frontend UI state (`components/checkout/DeliveryAddress.jsx`,
  `views/account/AddressesPage.jsx`; 8 divisions / 64 districts), is not
  persisted anywhere (User addresses, `Order` and `Quote` store no division),
  and the backend has no geography dataset or cross-app shared-module precedent.
- **Rule: division is always explicitly supplied** (admin on manual entry, or a
  future explicit business-profile field). Absence ⇒ automatic creation is
  skipped (§5). No shared map is promoted by this contract, and no undocumented
  approximation (e.g. district→division guessing) is permitted.
- Relaxing `Lead.division` is expressly **out of scope**: it would contradict
  the Phase 4.2 schema and its tests and is not an acceptable way to fit
  automation.

### 4. Organization type source / mapping

`organization_type` uses the `ORG_TYPES` enum. The only possible User source is
`institutionType`, which is client-settable (the public registration API passes
it through unvalidated), so it is translated by **exact, case-sensitive string
match only** — never fuzzy, substring or case-insensitive matching, and never
with new enum values:

| `institutionType` (exact) | → `organization_type` |
|---|---|
| `Hospital` | `hospital` |
| `Clinic` | `clinic` |
| `Diagnostic Center` | `diagnostic_centre` |
| `Laboratory` | `laboratory` |
| `Pharmacy` | `pharmacy` |
| `Research Institute` | `institution` |
| `Other` | `other` |
| `Medical Store` | **no mapping — skip creation** |
| `Nursing Home` | **no mapping — skip creation** |
| `Veterinary Clinic` | **no mapping — skip creation** |
| any other value / empty / missing | **no mapping — skip creation** |

Source of the vocabulary: the controlled `institutionTypes` select in
`views/B2BRegisterPage.jsx` (10 values). The seven mapped rows correspond
unambiguously to an `ORG_TYPES` member; `Medical Store`, `Nursing Home` and
`Veterinary Clinic` are genuinely ambiguous and are never guessed. Seed data
(`seedData.js`) only ever stores `Hospital` and `Diagnostic Center`.

### 5. Incomplete B2B profile behaviour

**Rule chosen: create no Lead; admin follow-up required.**

If the eligibility gate (§1) passes but any required field is unavailable —
`organization` (non-empty `companyName`/`company`, ≥2 chars),
`organization_type` (§4 mapping), approved business phone (§2), `district`
(default address), `division` (§3) — then **no Lead is created and no Lead is
modified**. The system logs a safe server-side message for admin follow-up.

RFQ success must never depend on CRM completeness: the quote is created, the
normal RFQ response is returned, and the CRM outcome is ignored. Required Lead
fields are never relaxed to make automation work, and no intentionally
incomplete Lead is created (the contract does not permit it).

### 6. Retail customer behaviour

`accountType === 'Retail'` (equivalently `role === 'customer'`) never satisfies
the §1 gate (`b2bAccount` false or not approved) ⇒ **`NOT_ELIGIBLE`**:

- no Lead is created for a retail RFQ,
- no Lead lookup or link is performed,
- no CRM field is written,
- RFQ submission behaviour, pricing, quoting and analytics are unchanged.

A retail customer is never converted into a B2B lead without an explicit,
admin-approved business profile — contract support for such a conversion does
not exist.

### 7. RFQ-to-Lead eligibility boundary (implemented by Phase 4.2-D)

```
after Quote.create() has succeeded (fire-and-forget, failure isolated):

  if (!(user.b2bAccount === true && user.b2bApprovalStatus === 'approved'))
      -> no CRM read, no CRM write (NOT_ELIGIBLE)
  else
      lead = Lead.findOne({ customer: user._id })   // ONLY lookup key
      if (lead exists) -> link idempotently:
            push { quote, quote_number, linked_at: server time }
                 only when that quote_number is absent (duplicate guard)
            rfq_status: 'none' -> 'requested' only
            status -> 'rfq' only if Lead.canTransition(current, 'rfq')
            last_touch_at = server time
      else -> automatic creation only if the §5 profile is complete;
              with today's repository state (§2/§3) this always skips,
              admin follow-up required.
```

Additional invariants (preserved from the Phase 4.2 architecture):

- Lookup by `customer == user._id` **only** — never phone-only, email-only or
  organization-only matching; phone/email/organization are never globally
  unique; no automatic merge; no Organization collection; multiple Leads per
  customer remain legitimate (multiple facilities, contacts, opportunities,
  repeat business cycles).
- Repeat RFQs re-find the same customer Lead and only append quote references —
  never duplicate a quote reference, never overwrite organization data, never
  downgrade a later-stage Lead (status moves only when the transition is legal).
- `Lead.customer` references an existing `User._id` only; Users and Quotes are
  never created or modified by association.
- Attribution persisted on creation only: the four allowlisted UTM keys plus
  `landing_page`, sanitised with server-side time; `utm_term` and `gclid` are
  not part of the contract and cannot be stored; no CRM PII reaches GA4/Meta.

