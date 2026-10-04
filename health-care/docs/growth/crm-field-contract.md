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
