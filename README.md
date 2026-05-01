# MedCore BD - Medical E-Commerce Platform

A comprehensive B2B/B2C medical equipment e-commerce platform built with Next.js and Node.js.

## 🌐 Live Demo

**Frontend:** [https://health-care-e-commerce-murex.vercel.app/](https://health-care-e-commerce-murex.vercel.app/)
**Backend:** [https://health-care-e-commerce.onrender.com](https://health-care-e-commerce.onrender.com)

> ✅ **Status**: PRODUCTION READY - Deployed on Vercel (frontend) and Render (backend) with MongoDB Atlas

## 🎉 Production Status

Your application is **fully deployed and configured**! See [PRODUCTION_READY.md](PRODUCTION_READY.md) for:
- ✅ All services configured and running
- ✅ Cloudinary image storage active
- ✅ Stripe payments and webhooks configured
- ✅ Auto-deployment enabled
- 📊 Monitoring and maintenance guide
- 🚀 Optional enhancements

### Quick Health Check:
```bash
curl https://health-care-e-commerce.onrender.com/api/health
```

## 🚀 For New Deployments

Want to deploy your own instance? Follow these guides:

- **Production Ready**: See [PRODUCTION_READY.md](PRODUCTION_READY.md) - Current deployment status
- **Quick Start**: See [QUICK_DEPLOY_GUIDE.md](QUICK_DEPLOY_GUIDE.md) - Deploy in 30 minutes
- **Detailed Guide**: See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Complete deployment guide

### Deployment Architecture

```
Frontend (Vercel) → Backend (Render) → Database (MongoDB Atlas)
                  ↓
            Cloudinary (Images) + Stripe (Payments)
```

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

## 📖 Documentation

### Production Status
- **[PRODUCTION_READY.md](PRODUCTION_READY.md)** - ⭐ Your application is production ready!

### Deployment Guides
- **[START_HERE.md](START_HERE.md)** - Main entry point for new deployments
- **[QUICK_DEPLOY_GUIDE.md](QUICK_DEPLOY_GUIDE.md)** - Deploy new instance in 30 minutes
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Complete deployment guide
- **[SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)** - Technical setup guide
- **[DEPLOYMENT_README.md](DEPLOYMENT_README.md)** - Deployment overview

### Technical Documentation
- **[ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md)** - System architecture
- **[DATABASE_SETUP_GUIDE.md](DATABASE_SETUP_GUIDE.md)** - Database configuration

### Tools
- **check-deployment-readiness.js** - Verify deployment readiness
- **deploy-backend.sh** - Automated backend deployment (Render/Heroku)
- **deploy-frontend.sh** - Automated frontend deployment (Vercel)

## 🚀 Getting Started

### Local Development

See [health-care/README.md](health-care/README.md) for local development setup.

### Production Deployment

1. **Check Readiness**
   ```bash
   node check-deployment-readiness.js
   ```

2. **Choose Your Guide**
   - Quick: [QUICK_DEPLOY_GUIDE.md](QUICK_DEPLOY_GUIDE.md)
   - Detailed: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

3. **Deploy**
   ```bash
   # Automated
   bash deploy-backend.sh
   bash deploy-frontend.sh
   
   # Or manual
   # See deployment guides
   ```

