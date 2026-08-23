# MediportBD — n8n Production Go-Live

> Status: **LIVE** as of Aug 23, 2026. n8n runs on the office Windows PC, published
> through Tailscale Funnel. Render API ↔ Atlas are shared between dev and prod, so
> the tested local instance became production directly.

## Architecture (as deployed)

```
Vercel storefront ──> api.mediportbd.com (Render, srv-d9v05gh5efls73dk9pgg) ──> Atlas (shared DB)
                              │  order/quote/auth events                ▲
                              ▼  X-Webhook-Secret                      │ X-Automation-Key
        https://desktop-bfpoicr.tailbfa9d9.ts.net  ──>  localhost:15678  ─┘
        (Tailscale Funnel → Docker container mediport-n8n, Asia/Dhaka crons)
```

| Piece | Value |
|---|---|
| Public n8n URL | `https://desktop-bfpoicr.tailbfa9d9.ts.net` (stable, auto-TLS) |
| Prod API | `https://api.mediportbd.com` (+ native `health-care-e-commerce-ubyy.onrender.com`) |
| Deployed commit | `6f0e11f` feat(automation): self-hosted n8n stack |
| Workflows | 10/10 ACTIVE; BACKEND_URL = `https://api.mediportbd.com` |
| Verified | POST `/api/automation/test` → pong ✓ · container→prod stats HTTP 200 ✓ |

## What was set up (record)

1. **PC hardening** — sleep disabled on AC (`powercfg`), Docker Desktop auto-start at login.
2. **Tailscale Funnel** — installed via winget, machine joined tailnet `tailbfa9d9.ts.net`,
   Funnel enabled at login.tailscale.com/f/funnel, then `tailscale funnel --bg 15678`.
   The funnel config is persisted on the node and survives reboots; Tailscale runs as a service.
   (ngrok was abandoned: winget ships 3.3.1 which ngrok rejects, and Defender blocked newer binaries.)
3. **Render env vars** — `N8N_EVENTS_ENABLED=true`, `N8N_WEBHOOK_BASE_URL=https://desktop-bfpoicr.tailbfa9d9.ts.net/`,
   plus matching `N8N_WEBHOOK_SECRET` / `AUTOMATION_API_KEY`. Deployed via cleared-cache rebuild.
4. **Workflow flip** — all backend URLs moved from `http://host.docker.internal:5001` to
   `https://api.mediportbd.com` (7 workflows; 01/05/06 are webhook-triggered with no backend calls).

## Still on you (Phase 5–6)

- [ ] Create coupons **COMEBACK5** and **WELCOME10** in admin panel (WF-06 emails reference them).
- [ ] Verification matrix — fire each path once:

| WF | Trigger action | Expected |
|----|----------------|----------|
| 01 | Real COD order on Vercel store | Gmail "New Order" alert ≤1 min |
| 05 | Same order / status→shipped | WhatsApp template to customer |
| 02 | Product stock below threshold | 08:00 BDT run emails low-stock list |
| 03 | Abandon a logged-in cart | recovery email within the hour; next run skips |
| 04 | Submit B2B quote form | Gmail lead alert |
| 06 | Register fresh account | welcome email w/ WELCOME10 |
| 07 | 21:00 BDT digest | daily numbers email (zeros fine) |
| 08 | Sunday 02:00 BDT | segmentation summary (already verified green) |
| 09 | Monday 11:00 BDT | win-back to at_risk (silent skip if empty) |
| 10 | Saturday 12:00 BDT | vip digest (silent skip if empty) |

Watch runs live: <http://localhost:15678> → Executions.

## Operations

**Backups (weekly):**
```powershell
docker exec mediport-n8n sh -c "cd /home/node && tar czf - .n8n/database.sqlite" > "$env:USERPROFILE\Desktop\n8n-backup-$(Get-Date -f yyyyMMdd).tar.gz"
```
Workflows are also in git under `automation/workflows/*.json`.

**Monitoring (recommended):**
- UptimeRobot → `https://api.mediportbd.com/api/health` every 5 min (keeps free-tier Render awake!)
- UptimeRobot → `https://desktop-bfpoicr.tailbfa9d9.ts.net/healthz`

**Failure playbook:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Event workflows silent | Tailscale down / funnel off | Restart "Tailscale" service; re-run `tailscale funnel --bg 15678` if needed |
| HTTP nodes timeout in runs | Render asleep | Confirm UptimeRobot monitor green; wait 60 s and retry |
| Executions error ECONNREFUSED :5001 | Workflow still on dev URL | Re-run the Phase-4 flip for that workflow |
| PC rebooted | — | Everything auto-starts; spot-check both health endpoints |

**Rollback switch:** set Render env `N8N_EVENTS_ENABLED=false` → redeploy. Backend's own cron
resumes abandoned-cart duty instantly; n8n goes idle. Zero customer impact.

**Later upgrade path:** rent a small VPS, `docker compose up` this same `automation/` stack
behind Caddy, update two URLs (Render `N8N_WEBHOOK_BASE_URL`, workflows' `BACKEND_URL`). ~1 hour.
