/**
 * Data Synchronization Service
 * Ensures all manufacturers and products are properly synced across environments
 * Runs on server startup to guarantee data consistency
 */

const Manufacturer = require('../models/Manufacturer');
const Category = require('../models/Category');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const { invalidateCache } = require('../middleware/cache');

/**
 * Core manufacturers that must exist in all environments
 */
const CORE_MANUFACTURERS = [
  {
    name: 'Finecare',
    description: 'Finecare Biosystems - Leading manufacturer of rapid diagnostic test systems and fluorescence immunoassay analyzers',
    country: 'China',
    website: 'https://www.finecarebio.com',
    isActive: true
  },
  {
    name: 'LabKit',
    description: 'LabKit - Medical laboratory equipment and supplies',
    country: 'Bangladesh',
    isActive: true
  },
  {
    name: 'GPL',
    description: 'GPL - Laboratory reagents and diagnostic solutions',
    country: 'India',
    isActive: true
  },
  {
    name: 'BSMI',
    description: 'BSMI - Medical equipment manufacturer',
    country: 'Bangladesh',
    isActive: true
  },
  {
    name: 'Genesis International',
    description: 'Genesis International - Medical supplies and equipment',
    country: 'Bangladesh',
    isActive: true
  },
  {
    name: 'Pacific Surgical',
    description: 'Pacific Surgical - Surgical instruments and supplies',
    country: 'Bangladesh',
    isActive: true
  },
  {
    name: 'MR Trading',
    description: 'MR Trading - Medical equipment distributor',
    country: 'Bangladesh',
    isActive: true
  },
  {
    name: 'Trology Atlas',
    description: 'Trology Atlas - Laboratory equipment and supplies',
    country: 'Bangladesh',
    isActive: true
  },
  {
    name: 'CareForce Shanto',
    description: 'CareForce Shanto - Medical supplies',
    country: 'Bangladesh',
    isActive: true
  },
  {
    name: 'Salmonella Lab Instruments',
    description: 'Salmonella Lab Instruments - Laboratory equipment',
    country: 'Bangladesh',
    isActive: true
  },
  {
    name: 'Turbilatex',
    description: 'Turbilatex - Laboratory reagents',
    country: 'Bangladesh',
    isActive: true
  }
];

/**
 * Core categories that must exist in all environments
 */
const CORE_CATEGORIES = [
  {
    name: 'Laboratory Reagents',
    description: 'Laboratory reagents and test kits',
    isActive: true
  },
  {
    name: 'Laboratory Equipment',
    description: 'Laboratory equipment and instruments',
    isActive: true
  },
  {
    name: 'Medical Devices',
    description: 'Medical devices and equipment',
    isActive: true
  },
  {
    name: 'Surgical Instruments',
    description: 'Surgical instruments and supplies',
    isActive: true
  },
  {
    name: 'Diagnostic Equipment',
    description: 'Diagnostic equipment and tools',
    isActive: true
  },
  {
    name: 'Consumables',
    description: 'Medical consumables and supplies',
    isActive: true
  }
];

/**
 * Ensure a manufacturer exists, create if missing
 */
async function ensureManufacturer(manufacturerData) {
  try {
    let manufacturer = await Manufacturer.findOne({
      name: { $regex: new RegExp(`^${manufacturerData.name}$`, 'i') }
    });

    if (!manufacturer) {
      manufacturer = await Manufacturer.create(manufacturerData);
      logger.info(`✅ Created manufacturer: ${manufacturerData.name}`);
      return { created: true, manufacturer };
    } else if (!manufacturer.isActive) {
      manufacturer.isActive = true;
      await manufacturer.save();
      logger.info(`✅ Activated manufacturer: ${manufacturerData.name}`);
      return { activated: true, manufacturer };
    }

    return { exists: true, manufacturer };
  } catch (error) {
    logger.error(`❌ Error ensuring manufacturer ${manufacturerData.name}:`, error.message);
    throw error;
  }
}

/**
 * Ensure a category exists, create if missing
 */
async function ensureCategory(categoryData) {
  try {
    let category = await Category.findOne({
      name: { $regex: new RegExp(`^${categoryData.name}$`, 'i') }
    });

    if (!category) {
      const slug = categoryData.name.toLowerCase().replace(/\s+/g, '-');
      category = await Category.create({ ...categoryData, slug });
      logger.info(`✅ Created category: ${categoryData.name}`);
      return { created: true, category };
    } else if (!category.isActive) {
      category.isActive = true;
      await category.save();
      logger.info(`✅ Activated category: ${categoryData.name}`);
      return { activated: true, category };
    }

    return { exists: true, category };
  } catch (error) {
    logger.error(`❌ Error ensuring category ${categoryData.name}:`, error.message);
    throw error;
  }
}

/**
 * Fix products with missing or invalid brand references
 */
async function fixProductBrandReferences() {
  try {
    // Find all products
    const products = await Product.find({}).lean();
    let fixedCount = 0;

    for (const product of products) {
      let needsUpdate = false;
      const updates = {};

      // Check if brand reference is valid
      if (!product.brand) {
        // Try to find manufacturer by product SKU or name patterns
        let manufacturerName = null;

        // Extract brand from SKU patterns
        if (product.sku) {
          if (product.sku.startsWith('FC-')) manufacturerName = 'Finecare';
          else if (product.sku.startsWith('LK-')) manufacturerName = 'LabKit';
          else if (product.sku.startsWith('GPL-')) manufacturerName = 'GPL';
          else if (product.sku.startsWith('BSMI-')) manufacturerName = 'BSMI';
        }

        // Extract brand from product name
        if (!manufacturerName && product.name) {
          for (const mfr of CORE_MANUFACTURERS) {
            if (product.name.toLowerCase().includes(mfr.name.toLowerCase())) {
              manufacturerName = mfr.name;
              break;
            }
          }
        }

        if (manufacturerName) {
          const manufacturer = await Manufacturer.findOne({
            name: { $regex: new RegExp(`^${manufacturerName}$`, 'i') }
          });

          if (manufacturer) {
            updates.brand = manufacturer._id;
            needsUpdate = true;
          }
        }
      }

      // Check if category reference is valid
      if (!product.category) {
        // Default to Laboratory Reagents if not specified
        const category = await Category.findOne({
          name: { $regex: new RegExp('^Laboratory Reagents$', 'i') }
        });

        if (category) {
          updates.category = category._id;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await Product.findByIdAndUpdate(product._id, updates);
        fixedCount++;
        logger.info(`✅ Fixed product: ${product.name} (${product.sku})`);
      }
    }

    if (fixedCount > 0) {
      logger.info(`✅ Fixed ${fixedCount} products with missing references`);
    }

    return fixedCount;
  } catch (error) {
    logger.error('❌ Error fixing product brand references:', error.message);
    throw error;
  }
}

/**
 * Main synchronization function
 * Runs on server startup to ensure data consistency
 */
async function syncData() {
  try {
    logger.info('🔄 Starting data synchronization...');

    const stats = {
      manufacturers: { created: 0, activated: 0, exists: 0 },
      categories: { created: 0, activated: 0, exists: 0 },
      productsFixed: 0
    };

    // 1. Ensure all core manufacturers exist
    logger.info('📋 Syncing manufacturers...');
    for (const mfrData of CORE_MANUFACTURERS) {
      const result = await ensureManufacturer(mfrData);
      if (result.created) stats.manufacturers.created++;
      else if (result.activated) stats.manufacturers.activated++;
      else stats.manufacturers.exists++;
    }

    // 2. Ensure all core categories exist
    logger.info('📋 Syncing categories...');
    for (const catData of CORE_CATEGORIES) {
      const result = await ensureCategory(catData);
      if (result.created) stats.categories.created++;
      else if (result.activated) stats.categories.activated++;
      else stats.categories.exists++;
    }

    // 3. Fix products with missing brand/category references
    logger.info('📋 Fixing product references...');
    stats.productsFixed = await fixProductBrandReferences();

    // 4. Clear cache if any changes were made
    const hasChanges = 
      stats.manufacturers.created > 0 || 
      stats.manufacturers.activated > 0 ||
      stats.categories.created > 0 ||
      stats.categories.activated > 0 ||
      stats.productsFixed > 0;

    if (hasChanges) {
      logger.info('🗑️  Clearing cache...');
      await invalidateCache('manufacturers:*');
      await invalidateCache('categories:*');
      await invalidateCache('products:*');
    }

    // 5. Log summary
    const summary = `✅ Data synchronization completed:
   Manufacturers - Created: ${stats.manufacturers.created}, Activated: ${stats.manufacturers.activated}, Exists: ${stats.manufacturers.exists}
   Categories - Created: ${stats.categories.created}, Activated: ${stats.categories.activated}, Exists: ${stats.categories.exists}
   Products Fixed: ${stats.productsFixed}`;
    
    logger.info(summary);

    return stats;
  } catch (error) {
    const errorMsg = `❌ Data synchronization failed: ${error.message}`;
    logger.error(errorMsg, error.stack);
    // Don't throw - allow server to start even if sync fails
    return null;
  }
}

/**
 * Verify data integrity
 * Returns a report of any issues found
 */
async function verifyDataIntegrity() {
  try {
    const issues = [];

    // Check for products with missing brand references
    const productsWithoutBrand = await Product.countDocuments({ brand: null });
    if (productsWithoutBrand > 0) {
      issues.push({
        type: 'missing_brand',
        count: productsWithoutBrand,
        message: `${productsWithoutBrand} products have missing brand references`
      });
    }

    // Check for products with missing category references
    const productsWithoutCategory = await Product.countDocuments({ category: null });
    if (productsWithoutCategory > 0) {
      issues.push({
        type: 'missing_category',
        count: productsWithoutCategory,
        message: `${productsWithoutCategory} products have missing category references`
      });
    }

    // Check for products with invalid brand references
    const products = await Product.find({}).populate('brand').lean();
    const productsWithInvalidBrand = products.filter(p => p.brand && !p.brand._id).length;
    if (productsWithInvalidBrand > 0) {
      issues.push({
        type: 'invalid_brand',
        count: productsWithInvalidBrand,
        message: `${productsWithInvalidBrand} products have invalid brand references`
      });
    }

    // Check for inactive manufacturers with active products
    const inactiveManufacturers = await Manufacturer.find({ isActive: false }).lean();
    for (const mfr of inactiveManufacturers) {
      const productCount = await Product.countDocuments({ brand: mfr._id, isActive: true });
      if (productCount > 0) {
        issues.push({
          type: 'inactive_manufacturer_with_products',
          manufacturer: mfr.name,
          count: productCount,
          message: `Manufacturer "${mfr.name}" is inactive but has ${productCount} active products`
        });
      }
    }

    return {
      healthy: issues.length === 0,
      issues,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('❌ Data integrity verification failed:', error.message);
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  syncData,
  verifyDataIntegrity,
  ensureManufacturer,
  ensureCategory,
  fixProductBrandReferences,
  CORE_MANUFACTURERS,
  CORE_CATEGORIES
};
