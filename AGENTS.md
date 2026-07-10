# MedCore BD — Agent Guide

## Monorepo Layout

```
Health Care/               # Root (husky + lint-staged only)
├── health-care/           # Frontend: Next.js 16 App Router
│   ├── backend/           # Backend: Express.js + MongoDB
│   ├── src/               # Frontend source
│   ├── commitlint.config.js
│   ├── next.config.mjs
│   ├── jest.config.js
│   ├── tailwind.config.js
│   └── postcss.config.mjs
├── .kiro/                 # Task tracking / specs (do not edit manually)
├── check-tasks.js         # Reads .kiro tasks
└── update-info.js         # Interactive script to update company info
```

## Commands

Run from the subdirectory (`health-care/` or `health-care/backend/`), **not** root.

### Frontend (`health-care/`)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Production server |
| `npm run lint` | ESLint (**flat config** `eslint.config.mjs`, ESLint 9) |
| `npm run lint:fix` | Auto-fix |
| `npm test` | Jest (jsdom, next/jest) |
| `npm run test:coverage` | Coverage (thresholds: branches 50%, lines/funcs 60%) |
| `ANALYZE=true npm run build` | Bundle analysis |
| `npm run lighthouse` | Lighthouse CI audit |
| `npm run build:sitemap` | Generate sitemap |

### Backend (`health-care/backend/`)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with nodemon (port from `PORT` env, defaults to **3001** in code) |
| `npm start` | Production server |
| `npm test` | Jest + coverage (thresholds: branches/lines 60%) |
| `npm run seed` | Seed DB with sample data |
| `npm run diagnose` | MongoDB connection diagnostic |
| `npm run verify-indexes` | Verify MongoDB indexes |
| `npm run fix:categories` / `fix:brands` | Fix product category/brand data |
| `npm run lint` | ESLint (**legacy** `.eslintrc.js`, ESLint 8) |
| `npm run load-test` | Artillery load tests (`load-tests/`) |

## Key Architecture

- **Frontend**: `app/*/page.jsx` (server components, thin wrappers) → `views/*` (client components, `'use client'`) → `components/`
- **Backend**: `routes/` → `controllers/` → `services/` → `models/` (Mongoose, 23 models)
- **State**: 6 React contexts — Auth, Cart, Wishlist, Language, Compare, Theme
- **API proxy**: Dev only — Next.js rewrites `/api/*` → backend. On Cloudflare Pages, browser calls `NEXT_PUBLIC_API_URL` directly.
- **Path aliases**: `@/` → `src/` (frontend only)
- **SEO**: Centralized in `src/config/seo.js`; pages export `metadata` or `generateMetadata()`; `src/app/sitemap.js` + `robots.js` are dynamic

## Testing Quirks

- Backend tests suppress all console output (setup in `src/tests/setup.js`)
- Backend tests require MongoDB at `mongodb://localhost:27017/medcore-test`
- Backend tests must import `app` from `server.js` (already exported) — server won't start listening in `NODE_ENV=test`
- Tests co-located in `__tests__/` dirs or `*.test.js`
- Frontend jest.setup.js polyfills TextEncoder/TextDecoder

## Environment

- Frontend `.env.local`: copy from `.env.example` (doesn't exist yet — use `cp .env.example .env.local`)
- Backend `.env`: copy from `.env.example`
- Backend port: code defaults to **3001** if no `PORT` env set; frontend's `NEXT_PUBLIC_API_URL` defaults to `http://localhost:5000` — these may conflict
- Generate JWT secrets: `node generate-secrets.js` (at root or backend)
- Deployment: **Vercel** (frontend) + **Render** (backend, see `render.yaml`)

## Non-obvious Conventions

- **Two ESLint versions**: frontend uses ESLint 9 flat config (`eslint.config.mjs`), backend uses ESLint 8 legacy (`.eslintrc.js`)
- **commitlint** lives in `health-care/commitlint.config.js`, not root
- **Swagger UI** at `/api-docs` (backend only)
- **Graceful shutdown**: Backend handles `SIGTERM`/`SIGINT`, closes MongoDB + Redis
- **Cache warming**: 3s after server start, Redis is pre-populated with featured products and categories
- **Mobile navigation**: The app has a `BottomNav` component for mobile; test on small viewports
- **`.kiro/`**: AI-managed task tracking; read-only for agents, use `check-tasks.js` to inspect status
- **`update-info.js`**: Interactive script to update company contact/SEO info across files
