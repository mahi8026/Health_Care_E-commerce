#!/bin/bash

# ============================================================================
# MedCore BD - Frontend Deployment Script (Vercel)
# ============================================================================

set -e  # Exit on error

echo "🚀 Starting Frontend Deployment to Vercel..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Navigate to frontend directory
cd health-care

echo -e "${YELLOW}📋 Pre-deployment Checklist:${NC}"
echo ""
echo "Before deploying, ensure you have:"
echo "  ✓ Updated environment variables in Vercel Dashboard"
echo "  ✓ Set NEXT_PUBLIC_API_URL to your backend URL"
echo "  ✓ Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (live key)"
echo "  ✓ Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"
echo "  ✓ Set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"
echo ""

read -p "Have you completed the checklist? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔍 Running pre-deployment checks...${NC}"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi

# Install dependencies
echo ""
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install --legacy-peer-deps

# Run linter
echo ""
echo -e "${YELLOW}🔍 Running linter...${NC}"
npm run lint || echo -e "${YELLOW}⚠️  Linting warnings found (continuing anyway)${NC}"

# Build the project
echo ""
echo -e "${YELLOW}🏗️  Building project...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Build successful${NC}"

# Deploy to Vercel
echo ""
echo -e "${YELLOW}🚀 Deploying to Vercel...${NC}"
vercel --prod

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""
echo -e "${GREEN}🎉 Your frontend is now live!${NC}"
echo ""
echo "Next steps:"
echo "  1. Visit your Vercel dashboard to get the deployment URL"
echo "  2. Test the deployment thoroughly"
echo "  3. Configure custom domain (optional)"
echo "  4. Set up monitoring and analytics"
echo ""
