# MedCore BD - Medical E-Commerce Platform

A comprehensive B2B/B2C medical equipment e-commerce platform built with Next.js and Node.js.

## Features

- 🛒 Product catalog with advanced search and filtering
- 👤 User authentication and authorization
- 💳 Multiple payment methods (Stripe, bKash, Bank Transfer)
- 📦 Order management and tracking
- 💬 Quote request system
- ↩️ Returns and refund management
- 📊 Admin dashboard with analytics
- 🔍 System monitoring and performance tracking
- 📧 Email notifications
- 🖼️ Image optimization with Cloudinary

## Tech Stack

### Frontend
- Next.js 16
- React 19
- Tailwind CSS
- Stripe.js
- Cloudinary

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Stripe API
- Nodemailer

## Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd health-care
```

2. Install dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
```

3. Configure environment variables

**Frontend** - Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

**Backend** - Create `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/medcore-bd
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. Start development servers

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
npm run dev
```

5. Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Admin Dashboard: http://localhost:3000/admin

## Project Structure

```
health-care/
├── backend/              # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Custom middleware
│   │   └── utils/        # Utility functions
│   └── package.json
├── src/                  # Next.js frontend
│   ├── app/             # App router pages
│   ├── components/      # React components
│   ├── context/         # React context
│   └── views/           # Page views
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `GET /api/orders` - Get all orders (admin)

### Returns
- `POST /api/returns` - Create return request
- `GET /api/returns/my-returns` - Get user returns
- `GET /api/returns/:id` - Get return details
- `PATCH /api/returns/:id/status` - Update return status (admin)

### Monitoring
- `GET /api/monitoring/health` - Health check
- `GET /api/monitoring/metrics` - Performance metrics (admin)

## Admin Access

Default admin credentials (development):
- Email: admin@medcorebd.com
- Password: admin123

**⚠️ Change these credentials in production!**

## Deployment

### Frontend (Vercel)
```bash
vercel --prod
```

### Backend (Railway/Render)
1. Connect your repository
2. Set environment variables
3. Deploy

## Environment Variables

See `.env.example` files in both frontend and backend directories for complete list of required environment variables.

## License

Private - All rights reserved

## Support

For support, email support@medcorebd.com
