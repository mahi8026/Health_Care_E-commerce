# MediportBD — n8n Production Go-Live Plan

> Architecture chosen: n8n stays on your Windows PC, exposed via an **ngrok static domain**
> (free, no domain purchase). Your local instance — already fully configured and tested —
> becomes production. Render API ↔ Atlas are shared with dev, so no data migration needed.

```
Vercel storefront ──> Render API (mediportbd-api.onrender.com) ──> Atlas (shared DB)
                          │  order/quote/auth events                ▲
                          ▼  (X-Webhook-Secret)                     │ X-Automation-Key
                   ngrok static URL ──> localhost:15678 (n8n, Docker) ──┘
                   (10 active workflows, Asia/Dhaka crons)
```

---

## Phase 0 — Prerequisites (~15 min)

| # | Task | Where |
|---|------|-------|
| 0.1 | Create free account at <https://ngrok.com>, copy your **authtoken** | browser |
| 0.2 | In ngrok dashboard → *Domains* → claim your **free static domain** (e.g. `mediport-n8n.ngrok-free.app`). This URL never changes. | browser |
| 0.3 | Render dashboard → `mediportbd-api` → Settings → note the **deploy branch** (usually `main`) | browser |

---

## Phase 1 — Make the PC a server (~10 min)

The PC is now production infrastructure:

```powershell
# 1.1 Docker Desktop starts at login (Settings → General → Start when you log in — tick it manually)

# 1.2 Never sleep while on power (run as Admin):
powercfg /change standby-timeout-ac 0
powercfg /change monitor-timeout-ac 20   # screen off is fine, system stays awake

# 1.3 Auto-recovery check: after any reboot confirm both come back
#     docker ps   → mediport-n8n  (restart: unless-stopped already set in compose)
```

Optional but recommended: BIOS "Restore AC Power Loss → On" so the box self-heals after outages.

---

## Phase 2 — ngrok tunnel as auto-start service (~15 min)

```powershell
# 2.1 Install
winget install ngrok.ngrok
ngrok config add-authtoken <YOUR_TOKEN>

# 2.2 Test run — replace with YOUR static domain
ngrok http --domain=mediport-n8n.ngrok-free.app 15678
# Visit https://mediport-n8n.ngrok-free.app/healthz from your PHONE → must return OK. Ctrl+C after.
```

Auto-start on login (Task Scheduler):

```powershell
$action  = New-ScheduledTaskAction -Execute "ngrok" -Argument 'http --domain=mediport-n8n.ngrok-free.app 15678 --log=stdout --log-format=logfmt'
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -AllowStartIfOnBatteries
Register-ScheduledTask -TaskName "ngrok-n8n" -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest
Start-ScheduledTask -TaskName "ngrok-n8n"
```

> Free tier = 1 agent / 1 static domain — exactly what we need. If you ever see the
> interstitial page on API calls, clients bypass it automatically (only browsers get it).

---

## Phase 3 — Ship automation code + wire Render (~30 min)

### 3.1 Commit & push (code currently uncommitted on `fix/browse-to-delivery-bugs`!)

Files going in:
- `backend/src/services/n8nWebhookService.js` (new — outbound event dispatcher)
- `backend/src/routes/automationRoutes.js` + `controllers/automationController.js` + `middleware/automationAuth.js` (new — 9 endpoints behind `X-Automation-Key`)
- Modified: `orderController`, `quoteController`, `authController`, `User` model (`marketingSegment`, `lastNotifiedAt`…), `server.js`, `stockAlertCron.js`
- `automation/` folder (compose, env example, workflow JSONs, README)

Merge `fix/browse-to-delivery-bugs` → deploy branch → push. Render auto-deploys.

### 3.2 Render dashboard → `mediportbd-api` → Environment → add:

| Key | Value |
|-----|-------|
| `N8N_EVENTS_ENABLED` | `true` |
| `N8N_WEBHOOK_BASE_URL` | `https://mediport-n8n.ngrok-free.app/` |
| `N8N_WEBHOOK_SECRET` | *(same value as local `automation/.env`)* |
| `AUTOMATION_API_KEY` | *(same value as local `automation/.env`)* |

Save → **Manual Deploy → Deploy latest reference**.

### 3.3 Keep Render awake (critical — free tier sleeps after 15 min idle,
cold-starting mid-workflow breaks HTTP nodes):

<https://uptimerobot.com> (free) → Add monitor → HTTPS → `https://health-care-e-commerce.onrender.com/api/health` → every 5 min.

### 3.4 Verify from anywhere:

```powershell
curl.exe -H "X-Automation-Key: <KEY>" https://health-care-e-commerce.onrender.com/api/automation/test
# expect: {"success":true,...,"n8n":{"enabled":true,"baseUrl":"https://mediport-n8n.ngrok-free.app/"}}
```

---

## Phase 4 — Flip workflows to the prod API (~20 min)

Workflows currently call `http://host.docker.internal:5001` (your laptop dev server).
Repoint all of them at Render — run inside the n8n container:

```js
// save as flip-prod.js → docker cp → node flip-prod.js
const { execSync } = require('child_process');
const fs = require('fs');
const PROD = 'https://health-care-e-commerce.onrender.com';
const ids = {
  '01': 'Bs5KQBRXiA5gnJ1F', '02': 'A2nR8JuMMZfraCmg', '03': 'NZiEke5NHcWRbzmi',
  '04': 'sFvADZODW3nR8Ump', '05': 'puLQ1XMvpG1AzOZP', '06': 'kLZUjYIIYsPWZEkD',
  '07': 'fBLf3zLm0oR8iJzR', '08': 'nALVuk1Fw83ENSN8', '09': 'Jcgn0gHXlA1bgNLv',
  '10': 'eTGe9C4fp7BE512s'
};
for (const [tag, id] of Object.entries(ids)) {
  execSync(`n8n export:workflow --id=${id} --output=/tmp/w.json`, { stdio: 'pipe' });
  let s = fs.readFileSync('/tmp/w.json', 'utf8');
  const before = s;
  s = s.split('http://host.docker.internal:5001').join(PROD);
  if (s !== before) fs.writeFileSync('/tmp/w.json', s);
  fs.copyFileSync('/tmp/w.json', `/tmp/w-${tag}.json`);
}
console.log('patched');
```

Then import all, re-activate, restart (imports reset active flags):

```bash
for f in /tmp/w-*.json; do n8n import:workflow --input=$f; done
n8n update:workflow --id=<each-id> --active=true   # ×10
docker compose restart
```

Verify: board shows 10 ACTIVE; open any Setup node → BACKEND_URL = onrender URL.

> Local nodemon no longer participates in automations. It's just for development again.

---

## Phase 5 — Data prerequisites checklist

Same Atlas DB means most items already exist — verify each:

- [x] WINBACK10 coupon (created Aug 23, expires Sep 30)
- [ ] **COMEBACK5** coupon (WF-06 reactivation email references it)
- [ ] **WELCOME10** coupon (WF-06 welcome email references it)
- [x] WhatsApp templates approved (`en_US`: order_confirmed/order_shipped · `en`: others)
- [x] Brevo sender verified (`mahimrahman07@gmail.com`), ~300 emails/day cap
- [x] Telegram bot credential working in n8n
- [ ] Recipients sanity pass: internal alerts → `mahimrahman07@gmail.com` ✔ (already routed)

Create the two coupons in the admin panel (Vercel site → admin → coupons) before activating WF-06 flows in verification.

---

## Phase 6 — End-to-end verification matrix

Fire each path once against production. Backend must be awake (UptimeRobot covers).

| WF | Trigger action | Expected |
|----|----------------|----------|
| 01 | Place a real COD order on the Vercel store | Gmail "New Order" alert ≤1 min |
| 05 | Same order (or status bump to shipped) | WhatsApp template to customer's number |
| 02 | Set one product stock below threshold | next 08:00 BDT run emails low-stock list |
| 03 | Abandon a cart logged-in, wait for hourly run | recovery email; second run skips (notified flag) |
| 04 | Submit B2B quote form | Gmail lead alert |
| 06 | Register a fresh test account | welcome email w/ WELCOME10 |
| 07 | Wait 21:00 BDT digest | daily numbers email (zeros fine) |
| 08 | Sunday 02:00 BDT | segmentation summary (already verified green) |
| 09 | Monday 11:00 BDT | win-back to at_risk (silent skip if segment empty) |
| 10 | Saturday 12:00 BDT | vip digest (silent skip if empty) |

Watch runs live: <http://localhost:15678> → Executions.

---

## Phase 7 — Operations

**Backups (weekly):**
```powershell
docker exec mediport-n8n sh -c "cd /home/node && tar czf - .n8n/database.sqlite" > "$env:USERPROFILE\Desktop\n8n-backup-$(Get-Date -f yyyyMMdd).tar.gz"
```
Schedule via Task Scheduler weekly. Workflows themselves are also in git (`automation/workflows/*.json`).

**Monitoring:** UptimeRobot also monitors `https://mediport-n8n.ngrok-free.app/healthz`.
Alerts land in your inbox before customers notice.

**Failure playbook:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| All event WFs silent | ngrok agent down | Restart task `ngrok-n8n`; URL unchanged (static) |
| HTTP nodes timeout | Render asleep | Check UptimeRobot monitor is green; wait 60 s |
| Executions error "ECONNREFUSED :5001" | A workflow still points at dev | Re-run Phase 4 flip for that WF |
| PC rebooted | — | Everything auto-starts; spot-check `/healthz` |

**Rollback switch:** Render env `N8N_EVENTS_ENABLED=false` → redeploy. Backend's own cron
resumes abandoned-cart duty instantly; n8n goes idle. Zero customer impact.

**Later upgrade path:** when revenue justifies 24/7 dedicated hosting, rent a €4 VPS,
`docker compose up` the same `automation/` stack behind Caddy, move DNS, update the two
URLs (Render `N8N_WEBHOOK_BASE_URL`, workflows' `BACKEND_URL`). ~1 hour migration.
