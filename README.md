# MedCore BD — Medical Equipment E-Commerce Platform

<div align="center">

![MedCore BD](https://img.shields.io/badge/MedCore-BD-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black)
![React](https://img.shields.io/badge/React-19.2.4-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

A comprehensive B2B and B2C e-commerce platform for medical equipment, surgical instruments, laboratory reagents, and hospital supplies in Bangladesh.

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [SEO & Performance](#seo--performance)
- [Contributing](#contributing)
- [License](#license)

---

## 🏥 Overview

MedCore BD is a full-stack medical equipment e-commerce platform serving Bangladesh's healthcare sector. The platform connects hospitals, clinics, diagnostic centers, and healthcare professionals with DGDA-certified medical equipment from global brands like Siemens, GE, Roche, Abbott, and Mindray.

### Core Business Model

- **Primary Market**: Bangladesh healthcare sector
- **Customer Segments**:
  - B2B customers (hospitals, clinics) with bulk discounts (8-30%) and credit terms (30-90 days)
  - B2C retail customers (healthcare professionals, small clinics)
- **Product Range**: 10,000+ products across 8 major categories
- **Key Differentiators**: DGDA registration, ISO 13485 certification, free installation in Dhaka, cold chain delivery for reagents

### Target Keywords

- **Primary**: "medical equipment Bangladesh", "diagnostic equipment Dhaka", "reagent supplier BD"
- **Long-tail**: "ECG machine price Bangladesh", "HbA1c kit price BD", "surgical instruments supplier Dhaka"

---

## ✨ Features

### Customer Features
- 🛒 **Product Catalog**: Browse 10,000+ medical products with advanced filtering
- 🔍 **Smart Search**: Real-time search with debouncing and category filtering
- 💳 **Multiple Payment Options**: bKash, Nagad, credit card, bank transfer
- 📦 **Order Tracking**: Real-time order status with SMS/email notifications
- 💝 **Wishlist & Compare**: Save products and compare specifications
- 🔄 **Returns Management**: Easy return request system with status tracking
- 📱 **Mobile Responsive**: Optimized mobile experience with bottom navigation

### B2B Portal Features
- 🏢 **Dedicated Dashboard**: Account management with order history
- 💰 **Bulk Pricing**: Tiered discounts (8-30%) based on order value
- 📄 **Quote Requests**: Submit RFQs for custom orders
- 💳 **Credit Terms**: 30-90 day payment terms for verified accounts
- 📊 **Purchase Analytics**: Track spending and order patterns
- 👤 **Account Manager**: Dedicated support for enterprise clients

### Admin Features
- 📊 **Analytics Dashboard**: Sales, revenue, and user metrics
- 📦 **Inventory Management**: Stock tracking with low-stock alerts
- 👥 **User Management**: Customer and B2B account administration
- 🏷️ **Category Management**: Dynamic category and brand management
- 📧 **Communication Tools**: Email/SMS marketing campaigns
- 🔐 **Role-Based Access**: Admin, manager, and staff roles

### Technical Features
- ⚡ **Performance**: 90+ Lighthouse score, optimized images, lazy loading
- 🔒 **Security**: JWT authentication, rate limiting, XSS protection, CSRF tokens
- 📱 **PWA Ready**: Installable progressive web app
- 🌐 **SEO Optimized**: Dynamic sitemaps, structured data, Open Graph tags
- 📈 **Analytics**: Google Analytics 4, conversion tracking
- 🚨 **Error Tracking**: Sentry integration for error monitoring
- 🔄 **Redis Caching**: API response caching for improved performance
- 📧 **Email Notifications**: Order confirmations, tracking updates

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16.2.3](https://nextjs.org/) (App Router)
- **React**: 19.2.4 with Server Components
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with PostCSS
- **Fonts**: Plus Jakarta Sans (body), Lora (headings) via next/font
- **State Management**: React Context API (Auth, Cart, Wishlist, Language, Compare, Theme)
- **Image Optimization**: Next.js Image + [Cloudinary](https://cloudinary.com/)
- **Analytics**: Google Analytics 4 (react-ga4)
- **Error Tracking**: [Sentry](https://sentry.io/) (@sentry/nextjs)
- **Charts**: [Recharts](https://recharts.org/)
- **PDF Generation**: jsPDF + jsPDF-autotable
- **Icons**: react-icons
- **Date Handling**: date-fns

### Backend
- **Runtime**: Node.js with [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with Mongoose ODM
- **Cache**: [Redis](https://redis.io/) (ioredis) with in-memory fallback
- **Authentication**: Passport.js (JWT + Google OAuth 2.0)
- **File Upload**: Multer + Cloudinary
- **Security**: Helmet, CORS, express-mongo-sanitize, hpp, xss-clean
- **Rate Limiting**: express-rate-limit with Redis store
- **Validation**: express-validator
- **Email**: Nodemailer
- **Logging**: Winston + Morgan
- **Cron Jobs**: node-cron (stock alerts)
- **Error Tracking**: Sentry (@sentry/node)
- **PDF Generation**: PDFKit
- **QR Codes**: qrcode
- **2FA**: speakeasy

### DevOps & Tools
- **Testing**: Jest + @testing-library/react (frontend), Jest + Supertest (backend)
- **Linting**: ESLint 9 (frontend flat config), ESLint 8 (backend legacy)
- **Git Hooks**: Husky + Commitlint (conventional commits)
- **Performance**: Lighthouse CI (@lhci/cli)
- **Bundle Analysis**: @next/bundle-analyzer
- **API Documentation**: Swagger UI at `/api-docs`

### Deployment
- **Frontend**: [Vercel](https://vercel.com/) (production + preview)
- **Backend**: [Render.com](https://render.com/) (see `render.yaml`)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Cache**: Redis Cloud or Upstash
- **CDN**: Cloudinary for images

---

## 📁 Project Structure

```
Health Care/               # Root (husky + lint-staged only)
├── .github/              # GitHub Actions workflows (CI/CD, security scans)
├── .kiro/                # Kiro AI configuration and specs
├── health-care/          # Main application directory
│   ├── backend/          # Express.js API server
│   │   ├── src/
│   │   │   ├── config/           # Configuration (database, passport, sentry)
│   │   │   ├── controllers/      # Route controllers (20+ controllers)
│   │   │   ├── middleware/       # Express middleware (auth, cache, rate limiting)
│   │   │   ├── models/           # Mongoose models (23 models)
│   │   │   ├── routes/           # Express routes (20+ route files)
│   │   │   ├── services/         # Business logic services
│   │   │   ├── utils/            # Utility functions (logger, email, SMS)
│   │   │   └── server.js         # Express app entry point
│   │   ├── load-tests/           # Artillery load tests
│   │   └── package.json
│   │
│   ├── src/              # Next.js frontend source
│   │   ├── app/                  # Next.js App Router (file-based routing)
│   │   │   ├── layout.jsx        # Root layout (metadata, providers)
│   │   │   ├── page.jsx          # Homepage
│   │   │   ├── sitemap.js        # Dynamic sitemap
│   │   │   ├── robots.js         # Dynamic robots.txt
│   │   │   ├── about/            # Static pages
│   │   │   ├── account/          # User dashboard
│   │   │   ├── admin/            # Admin dashboard
│   │   │   ├── b2b/              # B2B portal
│   │   │   ├── products/         # Product listing + [id] detail
│   │   │   ├── reagent-store/    # Specialized reagent catalog
│   │   │   └── [other routes]/
│   │   ├── components/           # React components (organized by feature)
│   │   ├── config/               # Configuration (SEO)
│   │   ├── constants/            # App constants
│   │   ├── context/              # React Context providers (Auth, Cart, Wishlist)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # External service integrations (GA4)
│   │   ├── utils/                # Utility functions
│   │   └── views/                # Page-level view components
│   │
│   ├── public/           # Static assets
│   ├── next.config.mjs   # Next.js configuration
│   ├── tailwind.config.js # Tailwind CSS configuration
│   ├── jest.config.js    # Jest testing configuration
│   ├── commitlint.config.js # Commit message linting
│   └── package.json
│
├── check-tasks.js        # Reads .kiro tasks
├── update-info.js        # Interactive script to update company info
└── README.md
```

## 📞 Support
For support, email- mahimrahman07@gmail.com

---

<div align="center">

**[⬆ back to top](#mediport-bd--medical-equipment-e-commerce-platform)**

Made with ❤️ by Mediport BD Team

</div>
