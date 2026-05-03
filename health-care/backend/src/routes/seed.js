const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Manufacturer = require('../models/Manufacturer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Product images by category
const PRODUCT_IMAGE_CATEGORIES = {
  'Laboratory Reagents': [
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800',
    'https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?w=800',
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800',
    'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800',
    'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800',
  ],
  'Diagnostic Equipment': [
    'https://images.unsplash.com/photo-1581594549595-35f6edc7b762?w=800',
    'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=800',
    'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800',
    'https://images.unsplash.com/photo-1583324113626-70df0f4deaab?w=800',
    'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800',
  ],
  'Hospital Machines': [
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800',
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800',
    'https://images.unsplash.com/photo-1582560475093-ba66accbc424?w=800',
    'https://images.unsplash.com/photo-1583324113626-70df0f4deaab?w=800',
  ],
  'Medical Supplies': [
    'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=800',
    'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=800',
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800',
    'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800',
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
  ],
  'Respiratory Equipment': [
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
    'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800',
    'https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?w=800',
    'https://images.unsplash.com/photo-1581594549595-35f6edc7b762?w=800',
  ],
  'Surgical Instruments': [
    'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800',
    'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800',
    'https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?w=800',
    'https://images.unsplash.com/photo-1581594549595-35f6edc7b762?w=800',
  ],
  'PPE & Safety': [
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
    'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=800',
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800',
    'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800',
  ]
};

// Helper function to get random image
function getRandomImageForCategory(categoryName) {
  const images = PRODUCT_IMAGE_CATEGORIES[categoryName] || PRODUCT_IMAGE_CATEGORIES['Medical Supplies'];
  return images[Math.floor(Math.random() * images.length)];
}

// Helper function to upload to Cloudinary
async function uploadToCloudinary(imageUrl, productName, productSku) {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'medcorebd/products',
      public_id: `${productSku}-${Date.now()}`,
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'fill', quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      isPrimary: true,
      alt: productName
    };
  } catch (error) {
    console.error(`Failed to upload image for ${productName}:`, error.message);
    return null;
  }
}

// GET /api/seed/status - Check database status
router.get('/status', async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    const productsWithImages = await Product.countDocuments({ 
      images: { $exists: true, $ne: [] } 
    });
    const productsWithoutImages = await Product.countDocuments({ 
      $or: [
        { images: { $exists: false } }, 
        { images: { $size: 0 } }
      ] 
    });
    const manufacturerCount = await Manufacturer.countDocuments();
    const categoryCount = await Category.countDocuments();

    res.json({
      success: true,
      database: {
        products: productCount,
        productsWithImages,
        productsWithoutImages,
        manufacturers: manufacturerCount,
        categories: categoryCount,
        imageCoverage: productCount > 0 ? `${((productsWithImages/productCount) * 100).toFixed(1)}%` : '0%'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/seed/run-all - Run all seed scripts
router.post('/run-all', async (req, res) => {
  try {
    // Set a longer timeout for this operation
    req.setTimeout(600000); // 10 minutes
    
    const results = [];
    let totalAdded = 0;
    
    // Import seed functions
    const seedFunctions = {
      'seedAllBrands-complete': require('../scripts/seedAllBrands-complete'),
      'seedGPLBiochemistry': require('../scripts/seedGPLBiochemistry'),
      'seedTurbilatex': require('../scripts/seedTurbilatex'),
      'seedSerologyProducts': require('../scripts/seedSerologyProducts'),
      'seedBiochemistryPage3': require('../scripts/seedBiochemistryPage3'),
      'seedBSMIProducts': require('../scripts/seedBSMIProducts'),
      'seedPacificSurgical': require('../scripts/seedPacificSurgical'),
      'seedCareForceShantoProducts': require('../scripts/seedCareForceShantoProducts'),
      'seedLabKitPadma': require('../scripts/seedLabKitPadma'),
      'seedGp1100Devices': require('../scripts/seedGp1100Devices'),
      'seedGenesisInternational': require('../scripts/seedGenesisInternational'),
      'seedSalmonellaLabInstruments': require('../scripts/seedSalmonellaLabInstruments'),
      'seedMRTradingProducts': require('../scripts/seedMRTradingProducts'),
      'seedTrologyAtlasProducts': require('../scripts/seedTrologyAtlasProducts')
    };

    for (const [scriptName, seedFn] of Object.entries(seedFunctions)) {
      try {
        const beforeCount = await Product.countDocuments();
        
        if (typeof seedFn === 'function') {
          await seedFn();
        }
        
        const afterCount = await Product.countDocuments();
        const added = afterCount - beforeCount;
        totalAdded += added;
        
        results.push({ 
          success: true, 
          script: scriptName,
          productsAdded: added
        });
      } catch (error) {
        results.push({ 
          success: false, 
          script: scriptName, 
          error: error.message 
        });
      }
    }

    const productCount = await Product.countDocuments();
    const manufacturerCount = await Manufacturer.countDocuments();
    const categoryCount = await Category.countDocuments();

    res.json({
      success: true,
      message: `Seeding completed! Added ${totalAdded} new products.`,
      results,
      final: {
        products: productCount,
        manufacturers: manufacturerCount,
        categories: categoryCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/seed/add-images - Add images to products without images
router.post('/add-images', async (req, res) => {
  try {
    // Verify Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ 
        success: false, 
        error: 'Cloudinary not configured. Please check environment variables.' 
      });
    }

    const products = await Product.find({
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } }
      ]
    }).populate('category', 'name').limit(50); // Process 50 at a time

    if (products.length === 0) {
      return res.json({
        success: true,
        message: 'All products already have images',
        processed: 0
      });
    }

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const product of products) {
      try {
        const categoryName = product.category?.name || 'Medical Supplies';
        const imageUrl = getRandomImageForCategory(categoryName);
        const uploadedImage = await uploadToCloudinary(imageUrl, product.name, product.sku);
        
        if (uploadedImage) {
          product.images = [uploadedImage];
          await product.save();
          successCount++;
        } else {
          failedCount++;
          errors.push(`${product.sku}: Upload failed`);
        }
      } catch (error) {
        failedCount++;
        errors.push(`${product.sku}: ${error.message}`);
      }
    }

    const remaining = await Product.countDocuments({
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } }
      ]
    });

    res.json({
      success: true,
      processed: products.length,
      successful: successCount,
      failed: failedCount,
      remaining,
      errors: errors.slice(0, 5), // Show first 5 errors
      message: remaining > 0 ? 'Call this endpoint again to process more products' : 'All products now have images!'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
