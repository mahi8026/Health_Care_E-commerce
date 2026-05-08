#!/bin/bash

###############################################################################
# Deployment Script with Data Synchronization
# Ensures all brands and products are synced before deployment
###############################################################################

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         DEPLOYMENT WITH DATA SYNCHRONIZATION               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Error: .env.production file not found${NC}"
    exit 1
fi

# Load production environment
export $(cat .env.production | grep -v '^#' | xargs)

echo -e "${YELLOW}📋 Step 1: Running data synchronization...${NC}"
echo ""

# Run data sync script
node src/scripts/syncAllData.js

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Data synchronization failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Data synchronization completed${NC}"
echo ""

echo -e "${YELLOW}📋 Step 2: Verifying data integrity...${NC}"
echo ""

# Run verification script
node src/scripts/verifyDataIntegrity.js

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Data integrity issues found (non-critical)${NC}"
fi

echo ""
echo -e "${GREEN}✅ Deployment preparation completed${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "   1. Commit changes to git"
echo "   2. Push to production branch"
echo "   3. Deployment will auto-sync on server startup"
echo ""
