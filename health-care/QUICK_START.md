# MedCore BD — Quick Start

Get the full-stack app running locally in 5 steps.

---

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

---

## Step 1 — Clone and install frontend

```bash
git clone https://github.com/yourusername/medcore-bd.git
cd health-care
npm install
```

---

## Step 2 — Configure frontend environment

Create `health-care/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

---

## Step 3 — Configure and start backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` — minimum required:

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/medcore-bd
JWT_SECRET=change-this-to-a-strong-secret-32-chars-min
FRONTEND_URL=http://localhost:3000
```

Seed the database:

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

Backend runs at **http://localhost:3001**

---

## Step 4 — Start frontend

Open a new terminal in the `health-care/` directory:

```bash
npm run dev
```

Frontend runs at **http://localhost:3000**

---

## Step 5 — Verify

| Check | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API health | http://localhost:3001/api/health |
| Products | http://localhost:3001/api/products |

**Test login:**
- Admin: `admin@medcorebd.com` / `admin123`
- B2B: `shahid@example.com` / `password123`
- Customer: `customer@example.com` / `password123`

---

## Common Issues

**MongoDB not connecting**
```bash
sudo systemctl start mongod        # Linux
brew services start mongodb-community  # macOS
```

**Port already in use**
```bash
lsof -i :3001 | grep LISTEN
kill -9 <PID>
```

**Module not found**
```bash
rm -rf node_modules package-lock.json
npm install
```
