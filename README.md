# 🏥 MedCore BD - Medical E-commerce Platform

A comprehensive medical e-commerce platform built with Next.js and Node.js.

## 🚀 Quick Start

### For Deployment:
**Read this first:** [DEPLOY_SIMPLE.md](DEPLOY_SIMPLE.md)

This guide will walk you through deploying to Vercel (frontend) and Render (backend) in ~1 hour.

### For Development:
```bash
# Frontend
cd health-care
npm install
npm run dev

# Backend
cd health-care/backend
npm install
npm run dev
```

## 📚 Documentation

- **[DEPLOY_SIMPLE.md](DEPLOY_SIMPLE.md)** - Simple deployment guide (START HERE!)
- **[QUICK_DEPLOY_REFERENCE.md](QUICK_DEPLOY_REFERENCE.md)** - Quick reference card
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Comprehensive deployment guide
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Detailed checklist

## 🔗 Live URLs

- **Frontend:** https://health-care-e-commerce-murex.vercel.app
- **Backend:** https://health-care-e-commerce.onrender.com
- **API Health:** https://health-care-e-commerce.onrender.com/api/health

## 🛠️ Tech Stack

### Frontend
- Next.js 16
- React 19
- Tailwind CSS 4
- Stripe
- Cloudinary

### Backend
- Node.js
- Express
- MongoDB
- Redis
- JWT Authentication

## 📋 Features

- 🛒 Product catalog with search and filters
- 👤 User authentication (Email + Google OAuth)
- 💳 Payment integration (Stripe, bKash, Nagad)
- 📦 Order management
- 🎨 Admin dashboard
- 📊 Analytics
- 🔔 Notifications
- 📧 Email notifications
- 💬 SMS notifications
- ⭐ Product reviews
- 🎁 Coupon system
- 📱 Responsive design

## 🚀 Deployment

### Prerequisites
- GitHub account
- Vercel account
- Render account
- MongoDB Atlas database
- Redis Cloud instance
- Cloudinary account
- Stripe account

### Deploy Now
Follow the step-by-step guide: [DEPLOY_SIMPLE.md](DEPLOY_SIMPLE.md)

**Time required:** ~1 hour

## 🔐 Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
```

See [health-care/.env.example](health-care/.env.example) for complete list.

### Backend (.env)
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/medcore-bd
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

See [health-care/backend/.env.example](health-care/backend/.env.example) for complete list.

## 📦 Installation

### Frontend
```bash
cd health-care
npm install
npm run dev
```

Visit: http://localhost:3000

### Backend
```bash
cd health-care/backend
npm install
npm run dev
```

API: http://localhost:5000

## 🧪 Testing

### Frontend
```bash
cd health-care
npm test
```

### Backend
```bash
cd health-care/backend
npm test
```

## 📝 Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run linter
- `npm test` - Run tests

### Backend
- `npm run dev` - Start development server
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run seed` - Seed database

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- **Developer:** Mahi Rahman
- **Email:** mahimrahman07@gmail.com
- **GitHub:** [@mahi8026](https://github.com/mahi8026)

## 🆘 Support

- **Documentation:** See [DEPLOY_SIMPLE.md](DEPLOY_SIMPLE.md)
- **Issues:** https://github.com/mahi8026/Health_Care_E-commerce/issues
- **Email:** mahimrahman07@gmail.com

## 🎯 Project Status

- ✅ Development: Complete
- ✅ Testing: Complete
- ✅ Documentation: Complete
- ⏳ Deployment: Ready (follow DEPLOY_SIMPLE.md)
- ⏳ Production: Pending deployment

## 🔄 Continuous Deployment

Once deployed, every push to `main` branch will automatically:
- Run tests via GitHub Actions
- Deploy frontend to Vercel
- Deploy backend to Render

## 📊 Performance

- Lighthouse Score: 75-80
- Page Load: 2-2.5s
- Time to Interactive: 40-50% faster with Redis caching

## 🔒 Security

- JWT authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- XSS protection
- CSRF protection
- Helmet security headers

## 🌟 Highlights

- Modern tech stack
- Responsive design
- Fast performance
- Secure authentication
- Payment integration
- Admin dashboard
- Analytics
- Email & SMS notifications
- Redis caching
- MongoDB indexes

---

**Ready to deploy?** Open [DEPLOY_SIMPLE.md](DEPLOY_SIMPLE.md) and follow the guide!

