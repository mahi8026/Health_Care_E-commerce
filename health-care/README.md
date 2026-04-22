# MedCore BD — Medical E-Commerce Platform

A full-stack medical equipment and supplies e-commerce platform built for the Bangladesh market. Serves hospitals, diagnostic centres, clinics, and individual healthcare professionals.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Node.js, Express 4, MongoDB (Mongoose 8) |
| Auth | JWT (access + refresh tokens) |
| Payments | Stripe, bKash, Bank Transfer, B2B Credit |
| Email | Nodemailer (Ethereal in dev, SMTP in prod) |
| PDF | PDFKit (invoice generation) |
| Logging | Winston |
| Security | Helmet, CORS, express-mongo-sanitize, hpp, xss-clean |

---

## Features

- Multi-category product catalogue (Diagnostic, Surgical, Reagents, Lab, PPE)
- Persistent shopping cart with localStorage
- Multi-step checkout with address, delivery, and payment selection
- Specialized reagent store (temperature, hazard, lot tracking, MSDS/CoA)
- B2B dashboard — KPIs, quotations, credit tracking, account manager
- Admin panel — orders, products, customers, analytics, stock alerts
- Mobile-optimised responsive design with bottom navigation
- Role-based access: customer, b2b_customer, admin
- Stripe webhook integration with signature verification
- Automated stock alert cron job (daily 8 AM BDT)
- PDF invoice generation and email delivery
- Google Analytics 4 integration

---

## Project Structure

```
health-care/
├── backend/                  # Express API server
│   ├── src/
│   │   ├── config/           # Database connection
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/       # Auth, cache, error handler, rate limiter
│   │   ├── models/           # Mongoose schemas (User, Product, Order, Quote)
│   │   ├── routes/           # Express routers
│   │   ├── services/         # Cache service
│   │   └── utils/            # emailService, invoiceGenerator, seedData, stockAlertCron, logger
│   └── package.json
│
├── src/                      # Next.js frontend
│   ├── app/                  # App Router pages
│   ├── components/           # React components (admin, b2b, checkout, layout, mobile, payment, product, reagent, search, ui)
│   ├── context/              # AuthContext, CartContext
│   ├── hooks/                # useProducts, useOrders
│   ├── services/             # GA4Tracker
│   ├── utils/                # api.js, helpers, validation, payment, pdfExporter
│   └── views/                # Page-level view components
│
└── package.json
```

---

## Environment Variables

### Frontend — `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Backend — `backend/.env`

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/medcore-bd
JWT_SECRET=your-strong-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# bKash
BKASH_CALLBACK_URL=http://localhost:3000/payment/bkash/callback

# Email (leave blank to use Ethereal test account in dev)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@medcorebd.com
ADMIN_EMAIL=admin@medcorebd.com

# Ethereal (auto-created if SMTP_HOST is blank)
ETHEREAL_USER=
ETHEREAL_PASS=
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | — | Register user |
| POST | /api/auth/login | — | Login |
| POST | /api/auth/refresh | — | Refresh access token |
| POST | /api/auth/forgot-password | — | Request password reset |
| POST | /api/auth/reset-password | — | Reset password with token |
| GET | /api/auth/me | JWT | Get current user |
| PATCH | /api/auth/profile | JWT | Update profile |
| POST | /api/auth/logout | JWT | Logout |
| GET | /api/products | — | List products (paginated, filterable) |
| GET | /api/products/featured | — | Featured products |
| GET | /api/products/:id | — | Single product |
| POST | /api/products | Admin | Create product |
| PUT | /api/products/:id | Admin | Update product |
| DELETE | /api/products/:id | Admin | Delete product |
| GET | /api/orders | JWT | List orders |
| POST | /api/orders | JWT | Create order |
| GET | /api/orders/:id | JWT | Single order |
| PUT | /api/orders/:id/status | Admin | Update status |
| PUT | /api/orders/:id/cancel | JWT | Cancel order |
| GET | /api/orders/track/:orderNumber | — | Track order (public) |
| POST | /api/payments/stripe/create-intent | JWT | Create Stripe intent |
| POST | /api/payments/stripe/webhook | — | Stripe webhook |
| POST | /api/payments/bkash/initiate | JWT | Initiate bKash |
| POST | /api/payments/credit/process | JWT | B2B credit payment |
| GET | /api/admin/dashboard | Admin | Dashboard KPIs |
| GET | /api/admin/customers | Admin | Customer list |
| GET | /api/health | — | Health check |

---

## Test Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@medcorebd.com | admin123 |
| B2B Customer | shahid@example.com | password123 |
| Customer | customer@example.com | password123 |

---

## Scripts

```bash
# Frontend
npm run dev          # Development server (port 3000)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint

# Backend
npm run dev          # Nodemon dev server (port 3001)
npm start            # Production server
npm run seed         # Seed database with sample data
```

---

## License

MIT
