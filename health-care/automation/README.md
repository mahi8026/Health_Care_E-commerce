# MediportBD — n8n Automation Setup & Operations Guide

Self-hosted n8n workflow automation for the MediportBD platform.
Read `docs/N8N_AUTOMATION_PLAN.md` for architecture and workflow details.

---

## 1. Prerequisites

- Docker Desktop (installed ✔)
- Backend API running locally on port **5000** (`cd backend && npm run dev`)
- A Telegram bot token (optional but recommended): create via [@BotFather](https://t.me/BotFather), add bot to your ops group, get the chat id via `https://api.telegram.org/bot<TOKEN>/getUpdates`

## 2. Start n8n

```powershell
cd health-care\automation
copy .env.example .env      # then edit values
docker compose up -d
```

Open **http://localhost:15678** → log in with `N8N_BASIC_AUTH_USER/PASSWORD`.

> Generate an encryption key once: `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`
> Losing this key means losing all stored n8n credentials.

## 3. Configure the backend

In `backend/.env` set:

```bash
N8N_EVENTS_ENABLED=true
N8N_WEBHOOK_BASE_URL=http://localhost:15678
N8N_WEBHOOK_SECRET=<same value as automation/.env>
AUTOMATION_API_KEY=<same value as automation/.env>
```

Restart the backend, then verify connectivity from n8n's side:

```powershell
curl -H "X-Automation-Key: <AUTOMATION_API_KEY>" http://localhost:5000/api/automation/test
# → {"success":true,"data":{"pong":true,...}}
```

Note: n8n runs inside Docker, so it reaches a local backend via
`http://host.docker.internal:5000` — that is the default `BACKEND_URL` in every workflow.

## 4. Import the workflows

n8n UI → **Workflows → ⋯ → Import from File** for each JSON in `workflows/`:

| File | Workflow | Trigger |
|---|---|---|
| 01-order-notifications.json | New order alerts | Webhook `order-placed` |
| 02-low-stock-alerts.json | Low stock digest | Every 6h |
| 03-abandoned-cart-recovery.json | Cart recovery emails | Hourly |
| 04-b2b-quote-routing.json | Quote routing + SLA sweep | Webhook + daily |
| 05-whatsapp-automation.json | WhatsApp status updates | Webhook `order-status-changed` |
| 06-email-lifecycle.json | Welcome + review request | Webhooks `user-registered`, `order-delivered` |
| 07-order-ops-digest.json | Daily/weekly sales digest | Cron |
| 08-customer-segmentation.json | RFM segmentation | Weekly Sun 02:00 |
| 09-followup-campaigns.json | Win-back / cross-sell / VIP | Daily 11:00 |
| 10-product-recommendations.json | Recommendation digest | Weekly Sat 12:00 |

### After importing each workflow

1. Open the first **Code node ("Setup" / "Normalize" / "Pick Campaign")** and fill the
   `CONFIG` block at the top:
   - `BACKEND_URL` = `http://host.docker.internal:5000`
   - `AUTOMATION_API_KEY` = value from `.env`
   - emails / chat ids / store URL
2. Create credentials (once, reused by all workflows):
   - **Telegram**: credential name `Mediport Telegram Bot` → paste bot token
   - **SMTP**: credential name `Mediport SMTP` → your SMTP host/user/pass (Brevo/Resend SMTP work well)
3. Click **Execute Workflow** once to test, then toggle **Active**.

## 5. WhatsApp templates (WF-05)

WF-05 calls the Meta Graph API directly. Required once:

1. Meta Business account + WhatsApp Business app → note **Phone Number ID** and a permanent **Access Token**
2. Create message templates in Business Manager and name them exactly as in the
   workflow config: `order_confirmed`, `order_shipped`, `delivery_today`,
   `delivery_thanks`, `order_cancelled` (language: English). Submit for approval.
3. Paste Phone Number ID + token into WF-05's **Normalize + Config** node.

Until templates are approved you can deactivate WF-05 — the backend already sends
its own WhatsApp/SMS confirmations directly.

## 6. Event flow reference

Backend emits (fire-and-forget, never blocks checkout):

| Event | n8n webhook path |
|---|---|
| order placed | `POST /webhook/order-placed` |
| order status changed | `POST /webhook/order-status-changed` |
| order delivered (lifecycle) | `POST /webhook/order-delivered` |
| quote created | `POST /webhook/quote-created` |
| user registered | `POST /webhook/user-registered` |

Test any webhook manually:

```powershell
$body = '{"eventId":"test-1","event":"order-placed","timestamp":"2026-01-01T00:00:00Z","source":"manual","data":{"orderNumber":"TEST-001","totalAmount":12345,"paymentMethod":"cod","itemCount":2,"items":[{"name":"BP Monitor","sku":"OMR-BP-004","qty":1,"price":3500}],"customer":{"name":"Test User","email":"t@e.com","phone":"01700000000"}}}'
Invoke-RestMethod -Uri http://localhost:15678/webhook/order-placed -Method Post -Body $body -ContentType "application/json"
```

(Workflow must be **Active** for `/webhook/...`; use the test URL shown in the
webhook node while editing.)

## 7. Operations

- **Logs/executions**: n8n UI → Executions (per-run input/output per node)
- **Prune old runs**: already configured (`EXECUTIONS_DATA_PRUNE=true`, max age 7d)
- **Backup**: `docker cp mediport-n8n:/home/node/.n8n ./backup-$(Get-Date -f yyyyMMdd)` weekly
- **Upgrade**: `docker compose pull && docker compose up -d`
- **Error alerts**: create a tiny workflow (Telegram node) and set it as
  *Settings → Error Workflow* in each workflow so failures ping ops

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| Backend logs show `[n8n] ❌ ... dropped` | n8n not running or wrong `N8N_WEBHOOK_BASE_URL`; check `docker compose ps` |
| Workflow HTTP nodes return 401 | `AUTOMATION_API_KEY` mismatch between backend `.env` and workflow CONFIG |
| HTTP nodes can't reach backend | Use `http://host.docker.internal:5000` inside containers; check backend is running |
| Webhook returns 404 | Workflow not Active (production path only exists when active) |
| No Telegram messages | Bot token credential missing, or chat id wrong (must be negative for groups) |
| Emails not arriving | Check SMTP credential; Brevo/Resend require verified sender domain |
