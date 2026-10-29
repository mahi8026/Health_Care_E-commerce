# Secret Rotation Runbook — MongoDB Atlas password + JWT signing secrets

Audit item: **"Ops remediation (outside the repo) — PENDING (owner)"** in
`health-care/COMPREHENSIVE_FIX_PLAN.md` §0.

Status: **UNCONFIRMED**. This document is the audit trail: it is only "done" once
§8 is filled in with the date, the operator and the evidence from
`npm run security:verify-rotation`.

Cadence: every **90 days**, and immediately after any suspected exposure
(screenshot, chat paste, laptop loss, CI log leak, contractor offboarding).

---

## 1. What rotates, and who consumes it

| Secret | Lives in | Consumed by | Effect of rotation |
| --- | --- | --- | --- |
| Atlas database **user password** (inside `MONGODB_URI`) | Render dashboard → `mediportbd-api` → Environment; local `health-care/backend/.env` | Backend API, backend scripts (`scripts/*.js`) | Existing authenticated sockets may survive until closed — the service is restarted in §5, so all connections re-authenticate |
| `JWT_SECRET` | Same two places | `src/middleware/auth.js`, `src/controllers/authController.js`, `src/services/chatSocketService.js` (Socket.IO handshake) | Every issued **access token** becomes invalid on the next request (signature mismatch). Clients recover silently: the frontend calls `POST /api/auth/refresh` on 401 and retries (`src/utils/api.js`) |
| `JWT_REFRESH_SECRET` | Same two places | `authController.js` (`/api/auth/refresh`, `generateRefreshToken`) | Every **refresh token** (30-day TTL, persisted per user in `User.refreshToken`) becomes invalid → **hard logout for all users** |
| `CSRF_SECRET` | Same two places | `src/middleware/csrf.js` (`csrf-csrf` double-submit) | Cached CSRF tokens stop validating; the frontend drops its cached token on 403 and refetches. Harmless, rotate it in the same window |

Deliberately **not** in scope here: Cloudinary, WhatsApp, SteadFast, Google OAuth
and Resend credentials — they are tracked as separate items in the same audit.

CI is **not** affected: `.github/workflows/test.yml` injects its own throwaway
values (`mongodb://localhost:27017/Mediport-test`, `test_jwt_secret_…`) and never
reads production secrets. The frontend (Vercel) holds no Mongo URI and no JWT
secret — only `NEXT_PUBLIC_*` values.

### Why this is urgent

Three git-ignored files on developer machines still contain a full
`mongodb+srv://user:password@…` string and 64-byte JWT/CSRF secrets:
`deploy-render.md`, `RENDER_DEPLOYMENT_GUIDE.md`,
`health-care/backend/BACKEND_DEPLOYMENT_GUIDE.md` (plus
`health-care/backend/RAILWAY_ENV_VARIABLES.env`). They were never committed —
`git log --all -- <file>` is empty for all four — and `BACKEND_503_ERROR_FIX.md`
(tracked) only holds placeholders. Either way: assume any value that has ever
sat in a markdown file is burned, rotate it, then delete the files.

---

## 2. Pre-flight (15 minutes, do not skip)

```powershell
# 1. Baseline: the audit must FAIL before the rotation (proves it detects staleness)
cd health-care/backend
npm run security:verify-rotation

# 2. Record the current fingerprints into your password manager entry
#    (sha256 prefix only — never the value itself)
npm run security:verify-rotation -- --json

# 3. Snapshot the database before touching credentials (Atlas M0 has no PITR)
mongodump --uri="$env:MONGODB_URI" --archive=pre-rotation-$(Get-Date -f yyyyMMdd).archive --gzip
```

If `mongodump` is unavailable, export the collections you cannot rebuild
(`orders`, `users`, `products`, `carts`, `flashdeals`) from Atlas → Collections →
Export, and note it in §8.

Checklist before you start:

- [ ] Render service `mediportbd-api` is green and on a known commit (`/api/health` → `commit`)
- [ ] Branch protection still on; no deploy in flight (Render auto-deploy is off by design — see `render.yaml`)
- [ ] You can log in as a normal user **and** as an admin (you will re-verify both in §5)
- [ ] Password manager entry open for the rotation record

## 3. Part A — Rotate the Atlas database user password

Atlas user: **`Health_Care_E-commerce`**, database **`medcore-bd`**
(both visible in `MONGODB_URI`; the password is *not* recorded in this document).

1. Open <https://cloud.mongodb.com> → project → **Database Access**.
2. Row `Health_Care_E-commerce` → **Edit** → **Edit Password** →
   **Autogenerate Secure Password**.
   Autogenerate avoids characters that need percent-encoding. If you paste your
   own, it must be URL-safe (`A-Z a-z 0-9 - _ . ~`); `@ : / ? # % &` must be
   percent-encoded inside `MONGODB_URI`.
3. Copy the password into your password manager **now** (Atlas shows it once).
4. **Update User**. Existing connections are not force-closed — §5 restarts the
   backend so every socket re-authenticates.
5. Rebuild `MONGODB_URI` by replacing **only** the password segment:

   ```
   mongodb://Health_Care_E-commerce:<NEW_PASSWORD>@ac-…-shard-00-00.….mongodb.net:27017,…/medcore-bd?ssl=true&replicaSet=…&authSource=admin&retryWrites=true&w=majority
   ```

   Keep the host list, `replicaSet`, `authSource=admin`, `ssl=true` and
   `retryWrites=true` exactly as they are.

6. Set it in **both** places:

   | Place | How |
   | --- | --- |
   | Render → `mediportbd-api` → Environment → `MONGODB_URI` | Edit → paste → **Save** (Render restarts the service on save) |
   | `health-care/backend/.env` (local) | Edit the same value so local scripts keep working |

7. Verify before moving on:

   ```powershell
   cd health-care/backend
   npm run security:verify-rotation -- --ping
   ```

   Expect `Atlas ping OK via …` and `RESULT: PASS`. If it fails, the password is
   wrong or percent-encoding is off — fix it now, do not continue.

**Do not** create a second Atlas user "for safety" and leave the old one active;
that defeats the rotation. If you need overlap, do it inside a 15-minute window
and delete the old user before §8.

---

## 4. Part B — Rotate the JWT / CSRF signing secrets

Generate three **independent** secrets (64 bytes hex each — the format the code
has always used, 128 chars):

```powershell
cd health-care/backend
node -e "const c=require('crypto');['JWT_SECRET','JWT_REFRESH_SECRET','CSRF_SECRET'].forEach(n=>console.log(n+'='+c.randomBytes(64).toString('hex')))"
```

Rules the code and the audit enforce:

- `JWT_SECRET`, `JWT_REFRESH_SECRET` and `CSRF_SECRET` must all differ. If
  `JWT_SECRET` equals `JWT_REFRESH_SECRET`, an access token can be replayed as a
  30-day refresh token (`MEDIPORTBD_AUDIT_REPORT.md` ISSUE #19).
- `JWT_REFRESH_SECRET` must be set — `generateRefreshToken()` throws without it.
- No leading/trailing whitespace (signature checks fail with a trailing space;
  the audit reports `SURROUNDING_WHITESPACE`).

Set the three values in Render (`mediportbd-api` → Environment) and in the local
`.env`, together with the new `MONGODB_URI` — one save, one restart.

### Expected user-visible impact

| Rotation | Access tokens | Refresh tokens | User experience |
| --- | --- | --- | --- |
| `JWT_SECRET` only | invalid immediately | still valid | Seamless: the frontend refreshes on the first 401 and retries |
| `JWT_SECRET` + `JWT_REFRESH_SECRET` | invalid | invalid | Every user (incl. admins) is logged out once and must sign in again |
| `CSRF_SECRET` | unaffected | unaffected | One 403 → CSRF token is re-fetched automatically |

For an exposure-driven rotation, rotate **both** JWT secrets and accept the
one-time logout — announce it in the admin channel before you deploy.

## 5. Part C — Deploy and verify

```powershell
# 1. Render → mediportbd-api → Manual Deploy → Deploy latest commit
#    (or just re-save an env var; Render restarts the service either way)

# 2. Liveness + identity of the running build
curl https://<backend-host>/api/health

# 3. Full local audit against the rotated values
cd health-care/backend
npm run security:verify-rotation -- --ping --redis
```

Behavioural confirmation (this is the part that actually proves the rotation):

- [ ] **New login works** — `POST /api/auth/login` returns a token pair (this proves
      Atlas auth + both JWT secrets are consistent).
- [ ] **Pre-rotation token is rejected** — take an access token captured before the
      rotation, call `GET /api/auth/me` with it, expect `401`.
- [ ] **Refresh path works** — store the new token, let it be replaced by
      `POST /api/auth/refresh`, expect 200 + a new pair (403/401 here means
      `JWT_REFRESH_SECRET` differs between writer and reader, e.g. one instance
      still on the old value).
- [ ] **Admin UI loads** (`/admin`) and one write action succeeds (proves CSRF).
- [ ] **Socket.IO chat connects** while logged in (`chatSocketService` verifies
      `JWT_SECRET` on the handshake).
- [ ] Render logs show `✓ MongoDB Connected: …` and no
      `MongoServerError: Authentication failed` after the restart.

## 6. Part D — Record the rotation timestamp (optional but recommended)

`src/middleware/auth.js` rejects any token whose `iat` predates the value stored
in Redis under `jwt:secret:rotated_at`. A new signing secret already invalidates
old tokens, so this is only needed when you rotate the Redis marker ahead of the
secret, or when you want an auditable "rotated at" value the audit can read:

```powershell
cd health-care/backend
node -e "require('dotenv').config();const r=require('./src/services/redisCache');const b=require('./src/services/tokenBlacklist');r.initRedis();setTimeout(async()=>{console.log('recorded:',await b.recordSecretRotation());await r.close();},1500)"
npm run security:verify-rotation -- --redis   # Rotation: <ISO date> (0 days ago)
```

Do **not** clear it afterwards: `tokenBlacklist.clearAll()` also deletes
`jwt:secret:rotated_at`, which would silently re-validate every token signed with
the old secret if that secret ever leaked back into service.

## 7. Rollback

| Symptom | Fix |
| --- | --- |
| `Authentication failed` / `/api/health` flaps after deploy | Re-paste `MONGODB_URI` (check percent-encoding) → save → watch logs |
| 401 storm on `/api/auth/refresh` | `JWT_REFRESH_SECRET` mismatch between instances — confirm the Render value matches the local one byte-for-byte (use the `sha256` prefix, not the value) |
| Every mutation 403 | `CSRF_SECRET` changed but a client cached an old token → hard-refresh; if it persists, check the middleware reads the same variable |
| Total outage and you must restore service NOW | Revert the three env vars in Render to the values from your password manager entry, save, redeploy, then reopen the incident |

Never roll back by pasting a secret into a markdown file, a commit, a PR
description or a chat message. If you have done that, rotate again.

## 8. Sign-off (fill this in — this is what makes the rotation "confirmed")

| Item | Value / evidence | Date (UTC) | Confirmed by |
| --- | --- | --- | --- |
| Atlas password rotated | Atlas → Database Access → last modified | | |
| `MONGODB_URI` updated (Render) | Render env var + deploy id | | |
| `MONGODB_URI` updated (local `.env`) | `npm run security:verify-rotation -- --ping` → PASS | | |
| `JWT_SECRET` rotated | `sha256` prefix: ________ | | |
| `JWT_REFRESH_SECRET` rotated | `sha256` prefix: ________ | | |
| `CSRF_SECRET` rotated | `sha256` prefix: ________ | | |
| Behavioural checks §5 | all boxes ticked | | |
| Rotation timestamp recorded | `jwt:secret:rotated_at` = ________ | | |
| Credential-bearing local docs deleted | `deploy-render.md`, `RENDER_DEPLOYMENT_GUIDE.md`, `health-care/backend/BACKEND_DEPLOYMENT_GUIDE.md`, `health-care/backend/RAILWAY_ENV_VARIABLES.env` | | |

## 9. Quarterly drill

```powershell
cd health-care/backend
npm run security:verify-rotation -- --ping --redis
```

- `RESULT: PASS` with `Rotation … (n days ago)` and `n <= 90` → nothing to do.
- `ROTATION_NOT_RECORDED` / `ROTATION_STALE` → schedule a rotation this week.
- `TOO_SHORT`, `PLACEHOLDER`, `SHARED_SECRET` → the environment was never rotated;
  treat it as an open security item, not a warning.

Tracked-secret sanity check (should print nothing):

```powershell
git grep -n -E "mongodb(\+srv)?://[^\"'\s]+:[^\"'@\s]+@|JWT_SECRET=[0-9a-f]{32,}" -- ":!*.md"
```


