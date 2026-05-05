# MedCore BD — Medical Equipment E-Commerce Platform

B2B/B2C e-commerce platform for medical equipment, surgical instruments, laboratory reagents and hospital machines in Bangladesh.

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, React Context API
- **Backend**: Node.js, Express.js, MongoDB Atlas
- **Payments**: Stripe, bKash (sandbox), Bank Transfer, B2B Credit
- **Storage**: Cloudinary (product images)
- **Email**: Nodemailer (SendGrid/Gmail SMTP)
- **Deployment**: Vercel (frontend) + Render (backend)

## Features

- 10,000+ product catalogue with Cloudinary images
- B2B portal: quotations, credit limits, tiered pricing (10–30% off)
- 7 payment methods including bKash and B2B credit
- PDF invoice generation
- Order tracking with email notifications at every step
- Admin panel: product management, order management, analytics
- Reagent store with cold-chain delivery
- Product reviews and ratings system
- Wishlist, coupon/promo code system
- Refund and returns management
- Daily stock alert emails via cron job

## Quick Start

See [QUICK_START.md](./QUICK_START.md) for setup instructions.

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
STRIPE_WEBHOOK_SECRET=your_webhook_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=MedCore BD <your_email@gmail.com>
ADMIN_EMAIL=admin@medcorebd.com

FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Project Structure

```
medcore-bd/
├── health-care/          # Next.js frontend
│   ├── src/
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   ├── views/        # Page views
│   │   ├── context/      # React context
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Utilities
│   └── public/           # Static assets
│
└── backend/              # Express.js backend
    └── src/
        ├── controllers/  # Route controllers
        ├── models/       # Mongoose models
        ├── routes/       # API routes
        ├── middleware/   # Express middleware
        ├── services/     # Business logic
        ├── utils/        # Utilities
        └── scripts/      # Database seed scripts
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Products
- `GET /api/products` - Get all products (with pagination, filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update order status (admin only)

### Payments
- `POST /api/payments/stripe/create-intent` - Create Stripe payment intent
- `POST /api/payments/stripe/webhook` - Stripe webhook handler
- `POST /api/payments/bkash/create` - Create bKash payment

## Development

```bash
# Install dependencies
cd backend && npm install
cd ../health-care && npm install

# Run development servers
cd backend && npm run dev      # Backend on port 5000
cd health-care && npm run dev  # Frontend on port 3000
```

## Production Deployment

### Backend (Render)
1. Create new Web Service on Render
2. Connect GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables from .env.example

### Frontend (Vercel)
1. Import project from GitHub
2. Set root directory: `health-care`
3. Framework preset: Next.js
4. Add environment variables from .env.local.example

## License

Proprietary - All rights reserved

## Support

For support, email support@medcorebd.com
