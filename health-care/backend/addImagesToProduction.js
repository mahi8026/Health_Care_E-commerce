const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.production') });
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Generic medical product images from Unsplash (free to use)
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

// Upload image to Cloudinary
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

    console.log(`✅ Uploaded image for: ${productName}`);
    return {
      url: result.secure_url,
      publicId: result.public_id,
      isPrimary: true,
      alt: productName
    };
  } catch (error) {
    console.error(`❌ Failed to upload image for ${productName}:`, error.message);
    return null;
  }
}

// Get a random image URL for a category
function getRandomImageForCategory(categoryName) {
  const images = PRODUCT_IMAGE_CATEGORIES[categoryName] || PRODUCT_IMAGE_CATEGORIES['Medical Supplies'];
  return images[Math.floor(Math.random() * images.length)];
}

// Add delay to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function addProductImages() {
  try {
    console.log('🚀 Starting product image upload to PRODUCTION database...\n');
    console.log('📍 Database:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
    console.log('☁️  Cloudinary:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('');
    
    // Connect to MongoDB (production)
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas (Production)\n');

    // Find all products without images
    const products = await Product.find({
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } }
      ]
    }).populate('category', 'name');

    console.log(`📦 Found ${products.length} products without images\n`);

    if (products.length === 0) {
      console.log('✅ All products already have images!');
      await mongoose.connection.close();
      return;
    }

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        // Skip if product already has images
        if (product.images && product.images.length > 0) {
          console.log(`⏭️  Skipped: ${product.name} - Already has images`);
          skippedCount++;
          continue;
        }

        // Get category name
        const categoryName = product.category?.name || 'Medical Supplies';
        
        // Get a random image for this category
        const imageUrl = getRandomImageForCategory(categoryName);
        
        // Upload to Cloudinary
        const uploadedImage = await uploadToCloudinary(imageUrl, product.name, product.sku);
        
        if (uploadedImage) {
          // Update product with new image
          product.images = [uploadedImage];
          await product.save();
          
          successCount++;
          console.log(`✅ [${i + 1}/${products.length}] Added image to: ${product.name}`);
        } else {
          failedCount++;
          console.log(`❌ [${i + 1}/${products.length}] Failed: ${product.name}`);
        }

        // Add delay to avoid rate limiting
        if ((i + 1) % 10 === 0) {
          console.log(`\n⏸️  Pausing for 5 seconds to avoid rate limiting...\n`);
          await delay(5000);
        } else {
          await delay(1000);
        }

      } catch (error) {
        failedCount++;
        console.error(`❌ Error processing ${product.name}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Success: ${successCount} products`);
    console.log(`⏭️  Skipped: ${skippedCount} products`);
    console.log(`❌ Failed: ${failedCount} products`);
    console.log(`📦 Total: ${products.length} products processed`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('\n🎉 Image upload to production complete!');
    console.log('\n🌐 Check your deployed site: https://health-care-e-commerce-murex.vercel.app');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
addProductImages();
