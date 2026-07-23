#!/bin/bash

# Quick Import All Tynor Products from Healthway
# This script automates the entire import process

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║    Healthway Tynor Complete Import & Cloudinary Setup     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    echo "   cd c:\Projects\Health Care\health-care\backend"
    exit 1
fi

# Step 1: Fetch all products from Healthway
echo "📡 Step 1: Fetching ALL Tynor products from Healthway API..."
echo ""
npm run fetch:healthway-all

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to fetch products from Healthway API"
    echo "   Check your internet connection and try again"
    exit 1
fi

# Step 2: Format the data
echo ""
echo "🔄 Step 2: Converting to MediportBD format..."
echo ""
npm run format:healthway

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to format products"
    exit 1
fi

# Step 3: Import to database
echo ""
echo "📦 Step 3: Importing to database..."
echo ""
npm run import:auto

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to import products"
    exit 1
fi

# Step 4: Upload images to Cloudinary (optional)
echo ""
echo "☁️  Step 4: Upload images to Cloudinary? (y/N)"
read -r upload

if [ "$upload" = "y" ] || [ "$upload" = "Y" ]; then
    echo ""
    echo "📤 Uploading Tynor images to Cloudinary..."
    echo "   This may take several minutes..."
    echo ""
    npm run upload:cloudinary-tynor

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Images uploaded successfully!"
    else
        echo ""
        echo "⚠️  Some images failed to upload, but products are still imported"
    fi
else
    echo ""
    echo "⏭️  Skipped Cloudinary upload"
    echo "   You can upload later with: npm run upload:cloudinary-tynor"
fi

# Success message
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    ✅ IMPORT COMPLETE!                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🎉 All Tynor products imported successfully!"
echo ""
echo "📋 View products at:"
echo "   http://localhost:3000/admin"
echo ""
echo "🔍 Next steps:"
echo "   1. Review products in admin dashboard"
echo "   2. Update stock quantities if needed"
echo "   3. Set featured products"
echo "   4. Configure product variants (sizes)"
echo ""
