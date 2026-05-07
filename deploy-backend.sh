#!/bin/bash

# ============================================================================
# MedCore BD - Backend Deployment Script (Railway/Render/Heroku)
# ============================================================================

set -e  # Exit on error

echo "🚀 Starting Backend Deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Navigate to backend directory
cd health-care/backend

echo -e "${YELLOW}📋 Pre-deployment Checklist:${NC}"
echo ""
echo "Before deploying, ensure you have:"
echo "  ✓ MongoDB Atlas cluster created and running"
echo "  ✓ Database user created with strong password"
echo "  ✓ IP whitelist configured (0.0.0.0/0 for all IPs)"
echo "  ✓ Connection string ready"
echo "  ✓ All environment variables prepared"
echo "  ✓ Cloudinary account set up"
echo "  ✓ Stripe account configured"
echo "  ✓ Email SMTP credentials ready"
echo ""

read -p "Have you completed the checklist? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 1
fi

echo ""
# Display platform selection menu
platform_menu="Select deployment platform:"
echo -e "${BLUE}${platform_menu}${NC}"
echo "  1) Railway (Recommended)"
echo "  2) Render"
echo "  3) Heroku"
echo ""
read -p "Enter choice (1-3): " platform

case $platform in
    1)
        echo ""
        echo -e "${YELLOW}🚂 Deploying to Railway...${NC}"
        
        # Check if Railway CLI is installed
        if ! command -v railway &> /dev/null; then
            echo -e "${RED}❌ Railway CLI not found${NC}"
            echo "Installing Railway CLI..."
            npm install -g @railway/cli
        fi
        
        # Login to Railway
        echo ""
        echo -e "${YELLOW}🔐 Logging in to Railway...${NC}"
        railway login
        
        # Initialize project
        echo ""
        echo -e "${YELLOW}📦 Initializing Railway project...${NC}"
        railway init || echo "Project already initialized"
        
        # Set environment variables
        echo ""
        echo -e "${YELLOW}⚙️  Setting environment variables...${NC}"
        echo ""
        echo "Please enter the following values:"
        echo ""
        
        read -p "MongoDB URI: " MONGODB_URI
        read -p "JWT Secret (64+ chars): " JWT_SECRET
        read -p "JWT Refresh Secret (64+ chars): " JWT_REFRESH_SECRET
        read -p "Frontend URL: " FRONTEND_URL
        read -p "Stripe Secret Key: " STRIPE_SECRET_KEY
        read -p "Cloudinary Cloud Name: " CLOUDINARY_CLOUD_NAME
        read -p "Cloudinary API Key: " CLOUDINARY_API_KEY
        read -p "Cloudinary API Secret: " CLOUDINARY_API_SECRET
        read -p "SMTP Host: " SMTP_HOST
        read -p "SMTP Port: " SMTP_PORT
        read -p "SMTP User: " SMTP_USER
        read -p "SMTP Password: " SMTP_PASS
        
        # Set environment variables from user input (values collected via read prompts above)
        railway variables set NODE_ENV=production
        railway variables set PORT=5000
        railway variables set MONGODB_URI="$MONGODB_URI"
        railway variables set JWT_SECRET="$JWT_SECRET"
        railway variables set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
        railway variables set FRONTEND_URL="$FRONTEND_URL"
        railway variables set CORS_ORIGIN="$FRONTEND_URL"
        railway variables set ADMIN_URL="$FRONTEND_URL/admin"
        railway variables set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
        railway variables set CLOUDINARY_CLOUD_NAME="$CLOUDINARY_CLOUD_NAME"
        railway variables set CLOUDINARY_API_KEY="$CLOUDINARY_API_KEY"
        railway variables set CLOUDINARY_API_SECRET="$CLOUDINARY_API_SECRET"
        railway variables set SMTP_HOST="$SMTP_HOST"
        railway variables set SMTP_PORT="$SMTP_PORT"
        railway variables set SMTP_USER="$SMTP_USER"
        railway variables set SMTP_PASS="$SMTP_PASS"
        railway variables set SMTP_FROM="noreply@medcorebd.com"
        railway variables set ADMIN_EMAIL="admin@medcorebd.com"
        
        # Deploy
        echo ""
        echo -e "${YELLOW}🚀 Deploying...${NC}"
        railway up
        
        # Get domain
        echo ""
        echo -e "${GREEN}✅ Deployment successful!${NC}"
        echo ""
        echo "Getting your backend URL..."
        railway domain
        ;;
        
    2)
        echo ""
        echo -e "${YELLOW}🎨 Deploying to Render...${NC}"
        echo ""
        echo "Please follow these steps:"
        echo ""
        echo "1. Go to https://render.com"
        echo "2. Sign up/Login with GitHub"
        echo "3. Click 'New +' → 'Web Service'"
        echo "4. Connect your repository"
        echo "5. Configure:"
        echo "   - Name: medcore-backend"
        echo "   - Root Directory: health-care/backend"
        echo "   - Environment: Node"
        echo "   - Build Command: npm install"
        echo "   - Start Command: npm start"
        echo "6. Add environment variables from .env.production.template"
        echo "7. Click 'Create Web Service'"
        echo ""
        echo "Your backend will be deployed at: https://medcore-backend.onrender.com"
        ;;
        
    3)
        echo ""
        echo -e "${YELLOW}🟣 Deploying to Heroku...${NC}"
        
        # Check if Heroku CLI is installed
        if ! command -v heroku &> /dev/null; then
            echo -e "${RED}❌ Heroku CLI not found${NC}"
            echo "Please install from: https://devcenter.heroku.com/articles/heroku-cli"
            exit 1
        fi
        
        # Login to Heroku
        echo ""
        echo -e "${YELLOW}🔐 Logging in to Heroku...${NC}"
        heroku login
        
        # Create app
        echo ""
        read -p "Enter app name (e.g., medcore-backend): " APP_NAME
        heroku create $APP_NAME
        
        # Set environment variables
        echo ""
        echo -e "${YELLOW}⚙️  Setting environment variables...${NC}"
        echo ""
        echo "Please enter the following values:"
        echo ""
        
        read -p "MongoDB URI: " MONGODB_URI
        read -p "JWT Secret (64+ chars): " JWT_SECRET
        read -p "JWT Refresh Secret (64+ chars): " JWT_REFRESH_SECRET
        read -p "Frontend URL: " FRONTEND_URL
        read -p "Stripe Secret Key: " STRIPE_SECRET_KEY
        read -p "Cloudinary Cloud Name: " CLOUDINARY_CLOUD_NAME
        read -p "Cloudinary API Key: " CLOUDINARY_API_KEY
        read -p "Cloudinary API Secret: " CLOUDINARY_API_SECRET
        read -p "SMTP Host: " SMTP_HOST
        read -p "SMTP Port: " SMTP_PORT
        read -p "SMTP User: " SMTP_USER
        read -p "SMTP Password: " SMTP_PASS
        
        # Set environment variables from user input (values collected via read prompts above)
        heroku config:set NODE_ENV=production
        heroku config:set PORT=5000
        heroku config:set MONGODB_URI="$MONGODB_URI"
        heroku config:set JWT_SECRET="$JWT_SECRET"
        heroku config:set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
        heroku config:set FRONTEND_URL="$FRONTEND_URL"
        heroku config:set CORS_ORIGIN="$FRONTEND_URL"
        heroku config:set ADMIN_URL="$FRONTEND_URL/admin"
        heroku config:set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
        heroku config:set CLOUDINARY_CLOUD_NAME="$CLOUDINARY_CLOUD_NAME"
        heroku config:set CLOUDINARY_API_KEY="$CLOUDINARY_API_KEY"
        heroku config:set CLOUDINARY_API_SECRET="$CLOUDINARY_API_SECRET"
        heroku config:set SMTP_HOST="$SMTP_HOST"
        heroku config:set SMTP_PORT="$SMTP_PORT"
        heroku config:set SMTP_USER="$SMTP_USER"
        heroku config:set SMTP_PASS="$SMTP_PASS"
        heroku config:set SMTP_FROM="noreply@medcorebd.com"
        heroku config:set ADMIN_EMAIL="admin@medcorebd.com"
        
        # Deploy
        echo ""
        echo -e "${YELLOW}🚀 Deploying...${NC}"
        git push heroku main
        
        # Open app
        echo ""
        echo -e "${GREEN}✅ Deployment successful!${NC}"
        heroku open
        ;;
        
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Backend deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Note your backend URL"
echo "  2. Update NEXT_PUBLIC_API_URL in frontend"
echo "  3. Configure Stripe webhooks"
echo "  4. Test API endpoints"
echo "  5. Monitor logs for errors"
echo ""
