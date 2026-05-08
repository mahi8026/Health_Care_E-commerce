const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const logger = require('../utils/logger');
require('dotenv').config();

const sampleCoupons = [
  {
    code: 'EID20',
    type: 'percentage',
    value: 20,
    minimumOrderAmount: 5000,
    maximumDiscount: 5000,
    description: 'Eid Special - 20% off on orders above ৳5,000 (max ৳5,000 discount)',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: 0, // Unlimited
    isActive: true,
    applicableProducts: [],
    applicableCategories: [],
    applicableUserRoles: []
  },
  {
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    minimumOrderAmount: 1000,
    maximumDiscount: 1000,
    description: 'Welcome offer - 10% off on your first order (max ৳1,000 discount)',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: 0,
    isFirstOrderOnly: true,
    isActive: true,
    applicableProducts: [],
    applicableCategories: [],
    applicableUserRoles: []
  },
  {
    code: 'FLAT500',
    type: 'fixed',
    value: 500,
    minimumOrderAmount: 3000,
    description: 'Flat ৳500 off on orders above ৳3,000',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: 0,
    isActive: true,
    applicableProducts: [],
    applicableCategories: [],
    applicableUserRoles: []
  },
  {
    code: 'B2B15',
    type: 'percentage',
    value: 15,
    minimumOrderAmount: 10000,
    maximumDiscount: 10000,
    description: 'B2B Special - 15% off on orders above ৳10,000 (max ৳10,000 discount)',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: 0,
    isActive: true,
    applicableProducts: [],
    applicableCategories: [],
    applicableUserRoles: ['b2b_customer']
  },
  {
    code: 'MEGA25',
    type: 'percentage',
    value: 25,
    minimumOrderAmount: 20000,
    maximumDiscount: 15000,
    description: 'Mega Sale - 25% off on orders above ৳20,000 (max ৳15,000 discount)',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: 100, // Limited to 100 uses
    isActive: true,
    applicableProducts: [],
    applicableCategories: [],
    applicableUserRoles: []
  },
  {
    code: 'NEWYEAR2026',
    type: 'fixed',
    value: 1000,
    minimumOrderAmount: 5000,
    description: 'New Year Special - Flat ৳1,000 off on orders above ৳5,000',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    usageLimit: 500,
    isActive: true,
    applicableProducts: [],
    applicableCategories: [],
    applicableUserRoles: []
  }
];

async function seedCoupons() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('✓ Connected to MongoDB');

    // Find an admin user to set as creator
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      logger.error('✗ No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    logger.info(`✓ Found admin user: ${adminUser.email}`);

    // Clear existing coupons (optional - comment out if you want to keep existing)
    // await Coupon.deleteMany({});
    // logger.info('✓ Cleared existing coupons');

    const results = {
      added: [],
      skipped: [],
      failed: []
    };

    // Add coupons
    for (const couponData of sampleCoupons) {
      try {
        // Check if coupon already exists
        const existing = await Coupon.findOne({ code: couponData.code });
        
        if (existing) {
          results.skipped.push({
            code: couponData.code,
            reason: 'Already exists'
          });
          logger.info(`⏭️  Skipped: ${couponData.code} (already exists)`);
          continue;
        }

        // Create coupon with admin as creator
        const coupon = await Coupon.create({
          ...couponData,
          createdBy: adminUser._id
        });

        results.added.push({
          code: coupon.code,
          type: coupon.type,
          value: coupon.value
        });
        logger.info(`✅ Added: ${coupon.code} (${coupon.type}, ${coupon.value}${coupon.type === 'percentage' ? '%' : '৳'})`);

      } catch (error) {
        results.failed.push({
          code: couponData.code,
          error: error.message
        });
        logger.error(`❌ Failed: ${couponData.code} - ${error.message}`);
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(70));
    console.log('📊 COUPON SEED SUMMARY');
    console.log('═'.repeat(70));
    console.log(`✅ Added:   ${results.added.length}`);
    console.log(`⏭️  Skipped: ${results.skipped.length}`);
    console.log(`❌ Failed:  ${results.failed.length}`);
    console.log('═'.repeat(70) + '\n');

    if (results.failed.length > 0) {
      console.log('Failed coupons:');
      results.failed.forEach(item => console.log(`  - ${item.code}: ${item.error}`));
    }

    logger.info('✓ Coupon seeding completed');

  } catch (error) {
    logger.error(`Coupon seed error: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('✓ Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  seedCoupons()
    .then(() => {
      console.log('✓ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ Failed:', error);
      process.exit(1);
    });
}

module.exports = seedCoupons;
