# MedCore BD - Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup

#### Frontend (.env.production.local)
Create a `.env.production.local` file in the `health-care/` directory:

```bash
# Copy the template
cp .env.production .env.production.local

# Edit with your production values
nano .env.production.local
```

**Required Variables:**
- `NEXT_PUBLIC_API_URL` - Your backend API URL (e.g., `https://api.medcorebd.com/api`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe LIVE publishable key (pk_live_...)
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID` - Google Analytics 4 Measurement ID
- `NEXT_PUBLIC_SITE_URL` - Your production domain (e.g., `https://medcorebd.com`)

#### Backend (.env)
Update `backend/.env` with production values:

```bash
# Edit backend environment
nano backend/.env
```

**Critical Production Settings:**
```env
NODE_ENV=production
PORT=5000

# MongoDB Atlas (already configured)
MONGODB_URI=mongodb+srv://Health_Care_E-commerce:iKoKDJ7OlJDT8MSd@cluster0.rqyzhey.mongodb.net/medcore-bd?retryWrites=true&w=majority&appName=Cluster0

# JWT Secrets (already configured - keep these secure!)
JWT_SECRET=f22c149106748947deef9b0990564b4778aeb219a60e8cbde8b5d5b924e19dab5e4db8384ac822b0050792b57b618908f8b33f43f4dc6a14bd575cdbff4e29e0
JWT_REFRESH_SECRET=289383302baf1b90e7afde7b2f667fc99db3f20c83f6126e8ff2161312248c99193c3022ee30e30c0c0aa6abce291bbc4e3085ed029aec96e148bbe6e1ed081f

# CORS - Update with your production domain
CORS_ORIGIN=https://medcorebd.com
FRONTEND_URL=https://medcorebd.com
ADMIN_URL=https://medcorebd.com/admin

# Stripe (LIVE keys for production)
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# bKash (Production credentials)
BKASH_APP_KEY=YOUR_PRODUCTION_APP_KEY
BKASH_APP_SECRET=YOUR_PRODUCTION_APP_SECRET
BKASH_USERNAME=YOUR_PRODUCTION_USERNAME
BKASH_PASSWORD=YOUR_PRODUCTION_PASSWORD
BKASH_BASE_URL=https://tokenized.pay.bka.sh/v1.2.0-beta

# SMTP (Production email server)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@medcorebd.com
SMTP_PASS=your_email_password
SMTP_FROM=noreply@medcorebd.com
ADMIN_EMAIL=admin@medcorebd.com

# AWS S3 (for product images)
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=medcorebd-assets
```

---

## 🚀 Deployment Options

### Option 1: Vercel (Frontend) + Railway/Render (Backend)

#### **Frontend on Vercel:**

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy Frontend:**
```bash
cd health-care
vercel --prod
```

4. **Set Environment Variables in Vercel Dashboard:**
   - Go to: https://vercel.com/dashboard
   - Select your project → Settings → Environment Variables
   - Add all variables from `.env.production.local`

#### **Backend on Railway:**

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login to Railway:**
```bash
railway login
```

3. **Deploy Backend:**
```bash
cd health-care/backend
railway init
railway up
```

4. **Set Environment Variables:**
```bash
railway variables set NODE_ENV=production
railway variables set MONGODB_URI="your_mongodb_uri"
# ... add all other variables
```

---

### Option 2: DigitalOcean App Platform

1. **Create a new app** on DigitalOcean
2. **Connect your GitHub repository**
3. **Configure build settings:**
   - **Frontend:**
     - Build Command: `npm run build`
     - Run Command: `npm start`
     - Environment: Node.js
   - **Backend:**
     - Build Command: `npm install`
     - Run Command: `npm start`
     - Environment: Node.js

4. **Add environment variables** in the App Platform dashboard

---

### Option 3: AWS (EC2 + S3 + CloudFront)

#### **Backend on EC2:**

1. **Launch EC2 Instance:**
   - Ubuntu 22.04 LTS
   - t2.small or larger
   - Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 5000 (API)

2. **SSH into instance:**
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

3. **Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

4. **Clone and setup:**
```bash
git clone https://github.com/your-repo/medcore-bd.git
cd medcore-bd/health-care/backend
npm install
```

5. **Create .env file with production values**

6. **Start with PM2:**
```bash
pm2 start src/server.js --name medcore-api
pm2 startup
pm2 save
```

#### **Frontend on EC2 or Vercel:**

**If using EC2:**
```bash
cd ../health-care
npm install
npm run build
pm2 start npm --name medcore-frontend -- start
```

**Setup Nginx as reverse proxy:**
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/medcore
```

```nginx
server {
    listen 80;
    server_name medcorebd.com www.medcorebd.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/medcore /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. **Setup SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d medcorebd.com -d www.medcorebd.com
```

---

## 🔐 Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (already done ✅)
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Enable rate limiting (already configured ✅)
- [ ] Remove test credentials from LoginPage
- [ ] Set `NODE_ENV=production`
- [ ] Use environment variables for all secrets
- [ ] Enable MongoDB IP whitelist
- [ ] Set up backup strategy for database
- [ ] Configure monitoring (e.g., PM2, New Relic, Datadog)

---

## 📊 Post-Deployment Setup

### 1. Google Analytics Setup

1. Go to https://analytics.google.com/
2. Create a new GA4 property
3. Get your Measurement ID (G-XXXXXXXXXX)
4. Add it to `NEXT_PUBLIC_GA4_MEASUREMENT_ID`

### 2. Stripe Setup

1. Go to https://dashboard.stripe.com/
2. Switch to **Live mode** (toggle in top-right)
3. Go to **Developers → API keys**
4. Copy:
   - Publishable key (pk_live_...) → Frontend env
   - Secret key (sk_live_...) → Backend env
5. Go to **Developers → Webhooks**
6. Add endpoint: `https://api.medcorebd.com/api/payments/stripe/webhook`
7. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
8. Copy webhook secret → Backend env

### 3. bKash Setup

1. Go to https://developer.bka.sh/
2. Create a merchant account
3. Get production credentials:
   - App Key
   - App Secret
   - Username
   - Password
4. Update backend `.env`
5. Change `BKASH_BASE_URL` to production URL

### 4. Email (SMTP) Setup

**Option A: Gmail**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Generate at: https://myaccount.google.com/apppasswords
```

**Option B: SendGrid**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Option C: AWS SES**
```env
SMTP_HOST=email-smtp.ap-southeast-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

### 5. Domain & DNS Setup

Point your domain to your server:

```
A Record:
medcorebd.com → your-server-ip

A Record:
www.medcorebd.com → your-server-ip

A Record (if separate API server):
api.medcorebd.com → your-api-server-ip
```

---

## 🧪 Testing Production Build Locally

### Frontend:
```bash
cd health-care
npm run build
npm start
```
Visit: http://localhost:3000

### Backend:
```bash
cd health-care/backend
NODE_ENV=production npm start
```
Visit: http://localhost:5000/api/health

---

## 📈 Monitoring & Maintenance

### PM2 Monitoring (if using PM2):
```bash
pm2 status
pm2 logs medcore-api
pm2 logs medcore-frontend
pm2 monit
```

### Database Backups:
```bash
# MongoDB Atlas automatic backups (already enabled)
# Or manual backup:
mongodump --uri="your-mongodb-uri" --out=/backup/$(date +%Y%m%d)
```

### Log Rotation:
```bash
# PM2 handles this automatically
pm2 install pm2-logrotate
```

---

## 🆘 Troubleshooting

### Frontend not loading:
1. Check environment variables are set
2. Verify API URL is correct
3. Check browser console for errors
4. Verify build completed successfully

### Backend API errors:
1. Check MongoDB connection
2. Verify all environment variables
3. Check PM2 logs: `pm2 logs medcore-api`
4. Test health endpoint: `curl https://api.medcorebd.com/api/health`

### Payment issues:
1. Verify Stripe keys are LIVE keys (not test)
2. Check webhook is configured
3. Test with Stripe test cards first
4. Check backend logs for payment errors

---

## 📞 Support

For deployment issues:
- Email: admin@medcorebd.com
- Check logs: `pm2 logs`
- MongoDB Atlas: https://cloud.mongodb.com/
- Vercel Dashboard: https://vercel.com/dashboard
- Railway Dashboard: https://railway.app/dashboard

---

**Last Updated:** April 23, 2026
**Version:** 2.0.0
