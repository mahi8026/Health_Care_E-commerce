# MedCore BD

Medical equipment e-commerce platform for Bangladesh (B2B/B2C).

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS
- **Backend:** Node.js, Express, MongoDB
- **Storage:** Cloudinary (images), Redis (cache)
- **Payments:** Stripe, bKash, Nagad, Bank Transfer

## Getting Started

### Requirements

- Node.js 18+
- MongoDB 6+
- Redis (optional)

### Setup

```bash
# Clone and install
git clone <repo>

# Frontend
cd health-care
cp .env.example .env.local  # Fill in .env.local values
npm install
npm run dev                 # http://localhost:3000

# Backend (new terminal)
cd health-care/backend
cp .env.example .env        # Fill in .env values
npm install
npm run dev                 # http://localhost:5000
```

## Project Structure

```
health-care/
├── src/
│   ├── app/              # Next.js pages & admin panel
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── constants/        # App constants & config
│   └── utils/            # Helper functions
└── backend/
    └── src/
        ├── controllers/  # Route handlers
        ├── models/       # Mongoose schemas
        ├── routes/       # Express routes
        ├── middleware/   # Custom middleware
        ├── services/     # Business logic
        ├── config/       # Configuration
        └── constants/    # Backend constants
```

## Key Features

- Product catalog with B2B/B2C pricing
- Quotation system for B2B clients
- Multi-gateway payments (Stripe, bKash, Nagad)
- Order management with status tracking
- Inventory & stock management
- Coupon & discount system
- Reviews & ratings
- Wishlist & abandoned cart recovery
- Newsletter system
- SMS & OTP verification
- Admin panel with analytics
- Role-based access control

## Environment Variables

See `.env.example` files in both root and `backend/` directories for all required variables.

## Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Backend
- `npm run dev` - Start development server (nodemon)
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data
- `npm run fix:brands` - Fix product brand references
- `npm run fix:categories` - Fix product category references

## License

MIT
