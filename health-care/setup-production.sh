#!/bin/bash

# MediportBD - Production Setup Script
# This script helps you configure production environment variables

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   MediportBD - Production Environment Setup               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production.local exists
if [ -f ".env.production.local" ]; then
    echo -e "${YELLOW}⚠️  .env.production.local already exists!${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

echo -e "${GREEN}Creating .env.production.local...${NC}"
echo ""

# API URL
read -p "Enter your API URL (e.g., https://health-care-e-commerce-ubyy.onrender.com/api): " API_URL
API_URL=${API_URL:-https://health-care-e-commerce-ubyy.onrender.com/api}

# Site URL
read -p "Enter your site URL (e.g., https://mediportbd.com): " SITE_URL
SITE_URL=${SITE_URL:-https://mediportbd.com}

# Google Analytics
read -p "Enter your Google Analytics Measurement ID (G-XXXXXXXXXX): " GA_ID
GA_ID=${GA_ID:-G-XXXXXXXXXX}

# Stripe
read -p "Enter your Stripe LIVE Publishable Key (pk_live_...): " STRIPE_KEY
STRIPE_KEY=${STRIPE_KEY:-pk_live_REPLACE_WITH_YOUR_KEY}

# Create .env.production.local
cat > .env.production.local << EOF
# MediportBD - Production Environment Variables
# Generated: $(date)

# API Configuration
NEXT_PUBLIC_API_URL=$API_URL

# Google Analytics
NEXT_PUBLIC_GA4_MEASUREMENT_ID=$GA_ID

# Site Configuration
NEXT_PUBLIC_SITE_URL=$SITE_URL
NEXT_PUBLIC_SITE_NAME=MediportBD
NEXT_PUBLIC_APP_NAME=MediportBD

# Stripe Payment Gateway
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_KEY

# Feature Flags
NEXT_PUBLIC_ENABLE_STRIPE=true
NEXT_PUBLIC_ENABLE_BKASH=true
NEXT_PUBLIC_ENABLE_NAGAD=true
NEXT_PUBLIC_ENABLE_B2B_CREDIT=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
EOF

echo ""
echo -e "${GREEN}✅ Frontend environment configured!${NC}"
echo ""

# Backend configuration
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Backend Configuration${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "Do you want to update backend/.env for production? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd backend
    
    # Update NODE_ENV
    if grep -q "NODE_ENV=" .env; then
        sed -i 's/NODE_ENV=.*/NODE_ENV=production/' .env
        echo -e "${GREEN}✅ Set NODE_ENV=production${NC}"
    fi
    
    # Update CORS
    if grep -q "CORS_ORIGIN=" .env; then
        sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=$SITE_URL|" .env
        sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=$SITE_URL|" .env
        sed -i "s|ADMIN_URL=.*|ADMIN_URL=$SITE_URL/admin|" .env
        echo -e "${GREEN}✅ Updated CORS settings${NC}"
    fi
    
    cd ..
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Setup Complete! ✅                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: You still need to configure:${NC}"
echo ""
echo "  1. Stripe Secret Key in backend/.env"
echo "  2. bKash credentials in backend/.env"
echo "  3. SMTP settings in backend/.env"
echo "  4. AWS S3 credentials (optional)"
echo ""
echo -e "${GREEN}📖 Read DEPLOYMENT_GUIDE.md for detailed instructions${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review .env.production.local"
echo "  2. Update backend/.env with production credentials"
echo "  3. Test build: npm run build"
echo "  4. Deploy to your hosting platform"
echo ""
