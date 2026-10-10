# Funnel + Dashboard Data Contract — Phase 4.1 (Workstreams D & E)

## The funnel and its source of truth (no duplicate sources)

```
Visit → Product/category view → WhatsApp click / RFQ start → Qualified lead → Quote → Order → Repeat order
```

| Stage | Event / field | **Single source of truth** | Notes |
|---|---|---|---|
| Visit | `page_view` / `session_start` | **GA4** (gtag loader in `app/layout.jsx`) | Diagnostic traffic metric |
| Product/category view | `view_item` + page views on listing/detail | **GA4** (`GA4Tracker.trackViewItem`, gtag) | Diagnostic |
| WhatsApp click | `whatsapp_click` | **GA4** (centralized `services/funnelTracking.js`) | Legacy mirrors `whatsapp_order_click`, `exit_popup_whatsapp_click` are excluded from stage counting |
| RFQ start | `rfq_start` | **GA4** (fires on quote-form open) | `entry_point` from referrer |
| RFQ complete (submitted) | `rfq_complete` (+ legacy `quote_request_submitted`) | **GA4**, fired only after server confirmation | Both fire from the same point — count `rfq_complete` |
| Qualified lead | `lead_status = qualified` | **CRM** (per `crm-field-contract.md`) | Web attribution enters via UTM → `lead_source` |
| Quote | `rfq_status = quoted` / quote number | **Existing quote system** (`POST /api/quotes` → account/admin quotes) | CRM references quote numbers, never duplicates them |
| Order | order record | **Existing order/backend data** | Not modified by Phase 4.1 |
| Repeat order | `customer_status = repeat` / order history | **CRM + order history** | |

**Mapping rule:** GA4 measures *behavior*, the quote system measures *quotation documents*, CRM measures *pipeline state*, orders measure *revenue events*. Each stage has exactly one owner; downstream stages reference (not re-count) upstream ids.

## Weekly dashboard metrics (spreadsheet — no dashboard UI in Phase 4.1)

**Diagnostic (traffic — never reported as success):**
- organic clicks, organic impressions *(source: Google Search Console)*
- sessions, product views, category views *(source: GA4)*

**Lead:**
- WhatsApp clicks *(GA4 `whatsapp_click`)*
- RFQ starts *(GA4 `rfq_start`)*
- RFQ completions *(GA4 `rfq_complete`)*
- Qualified leads *(CRM `lead_status = qualified`)*

**Sales:**
- Quotes sent *(quote system / CRM `rfq_status = quoted`)*
- Quote SLA compliance *(CRM — `quoted` within 24h of `requested`)*
- Orders *(order backend)*
- Quote-to-order rate *(orders ÷ quotes sent, weekly cohort)*

**Retention:**
- Repeat orders *(CRM `customer_status = repeat`)*
- Standing-order accounts *(CRM `customer_status = standing_order`)*
- Reorder-reminder response *(CRM — reminder sent → order within 7 days)*

**Efficiency:**
- Cost per qualified lead = channel spend ÷ qualified leads with that `lead_source`
- Cost per order = channel spend ÷ orders attributed to that `lead_source`

> Traffic metrics live on a separate diagnostics tab. Business metrics are the first page of the weekly review.
