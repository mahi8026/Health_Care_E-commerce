# UTM Naming Convention — Phase 4.1 (Workstream F)

Campaign-tag construction only — no PII, ever. Captured client-side by
`src/utils/attribution.js` (allowlist: the four keys below) and replayed on
`whatsapp_click` / `rfq_start` / `rfq_complete`.

## Parameters

| Parameter | Meaning | Conventions |
|---|---|---|
| `utm_source` | Channel platform | `google`, `facebook`, `instagram`, `linkedin`, `newsletter`, `partner` |
| `utm_medium` | Mechanism | `cpc`, `paid_social`, `organic_social`, `email`, `referral`, `outbound` |
| `utm_campaign` | Initiative | lowercase, hyphenated: `q3-reagent-labs`, `clinic-starter`, `brand-price-ecg` |
| `utm_content` | Creative/placement | lowercase, hyphenated: `reagent-landing-hero`, `price-guide-banner`, `case-study-card` |

## Per-channel recipes

| Channel | utm_source | utm_medium | Example |
|---|---|---|---|
| Google Ads | `google` | `cpc` | `?utm_source=google&utm_medium=cpc&utm_campaign=lab-equipment&utm_content=ecg-price-guide` |
| Meta (FB/IG) | `facebook` / `instagram` | `paid_social` (ads) or `organic_social` (page links) | `?utm_source=facebook&utm_medium=paid_social&utm_campaign=clinic-checklist` |
| LinkedIn | `linkedin` | `paid_social` / `organic_social` | `?utm_source=linkedin&utm_medium=organic_social&utm_campaign=abm-hospitals` |
| Outbound (field rep shares link) | `outbound` | `referral` | `?utm_source=outbound&utm_medium=referral&utm_campaign=wave1-dhaka&utm-content=lab-script` |
| Referral partner | partner name | `referral` | `?utm_source=partner-biomed&utm_medium=referral&utm_campaign=referral-v1` |
| Email/newsletter | `newsletter` | `email` | `?utm_source=newsletter&utm_medium=email&utm_campaign=weekly-funnel` |

## Rules

1. **No campaign launches yet** — this is the naming contract only (spec F).
2. First-touch UTM persists in sessionStorage (`mediport_utm`) for the session; CRM `lead_source` is derived from it per `crm-field-contract.md`.
3. UTM values are sanitized (trimmed, max 64 chars) before storage or transmission.
4. Never place person names, phone numbers, or emails in UTM values.
