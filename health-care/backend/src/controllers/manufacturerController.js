const Manufacturer = require('../models/Manufacturer');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const { logActivityAsync, ACTIONS } = require('../utils/activityLogger');
const { invalidateCache } = require('../middleware/cache');
const redisCache = require('../services/redisCache');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// @desc    Get all manufacturers
// @route   GET /api/manufacturers
// @access  Public
exports.getManufacturers = async (req, res) => {
  try {
    const { includeInactive, search } = req.query;
    
    // Build query
    let query = {};
    
    // Only filter active if not explicitly requesting inactive
    // Note: GET /manufacturers is a public route with no auth middleware,
    // so req.user is always undefined here. Allow includeInactive param directly.
    if (includeInactive !== 'true') {
      query.isActive = true;
    }
    
    // Search by name
    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }
    
    const manufacturers = await Manufacturer.find(query)
      .sort({ name: 1 })
      .lean();
    
    // Per-manufacturer product counts (active products only, matching Products page "Active" filter)
    const productCounts = await Product.aggregate([
      { $match: { brand: { $in: manufacturers.map(m => m._id) }, isActive: true } },
      { $group: { _id: '$brand', total: { $sum: 1 } } }
    ]);

    const countMap = {};
    productCounts.forEach(({ _id, total }) => {
      countMap[_id.toString()] = total;
    });

    const manufacturersWithCounts = manufacturers.map(mfr => ({
      ...mfr,
      productCount: countMap[mfr._id.toString()] || 0
    }));

    // Global total: ALL active products across ALL manufacturers (for the stats card)
    const totalProductCount = await Product.countDocuments({ isActive: true });
    
    return successResponse(res, {
      count: manufacturersWithCounts.length,
      totalProductCount,
      manufacturers: manufacturersWithCounts
    });
  } catch (error) {
    logger.error(`[getManufacturers] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// @desc    Get single manufacturer by slug
// @route   GET /api/manufacturers/:slug
// @access  Public
exports.getManufacturer = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findOne({ slug: req.params.slug }).lean();
    
    if (!manufacturer) {
      return errorResponse(res, 'Manufacturer not found', null, 404);
    }
    
    // Get product count (all products, active + inactive)
    const productCount = await Product.countDocuments({ 
      brand: manufacturer._id
    });
    
    return successResponse(res, {
      manufacturer: {
        ...manufacturer,
        productCount
      }
    });
  } catch (error) {
    logger.error(`[getManufacturer] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// @desc    Create manufacturer
// @route   POST /api/manufacturers
// @access  Private/Admin
exports.createManufacturer = async (req, res) => {
  try {
    // Check for duplicate name at application level
    const existing = await Manufacturer.findOne({
      name: { $regex: new RegExp(`^${req.body.name?.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    }).lean();
    if (existing) {
      return errorResponse(res, 'A manufacturer with this name already exists', null, 400);
    }

    const manufacturer = await Manufacturer.create(req.body);
    
    // Invalidate caches using centralized Redis cache service
    await redisCache.invalidateBrands();
    
    // Keep legacy cache invalidation for backward compatibility
    await invalidateCache('manufacturers:*');
    
    // Log manufacturer creation activity
    logActivityAsync({
      user: req.user,
      action: ACTIONS.MANUFACTURER.CREATED,
      targetModel: 'Manufacturer',
      targetId: manufacturer._id,
      targetName: manufacturer.name,
      req,
      metadata: {
        slug: manufacturer.slug,
        country: manufacturer.country
      }
    });
    
    logger.info(`[createManufacturer] Manufacturer ${manufacturer._id} created, cache invalidated`);
    
    return successResponse(res, { manufacturer }, 'Manufacturer created successfully', 201);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 'Manufacturer name already exists', null, 400);
    }
    logger.error(`[createManufacturer] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// @desc    Update manufacturer
// @route   PUT /api/manufacturers/:id
// @access  Private/Admin
exports.updateManufacturer = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findById(req.params.id);
    
    if (!manufacturer) {
      return errorResponse(res, 'Manufacturer not found', null, 404);
    }
    
    // Allowed fields to update
    const allowedFields = ['name', 'description', 'country', 'website', 'contactEmail', 'isActive', 'seo', 'slug'];
    
    // Update only allowed fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        manufacturer[field] = req.body[field];
      }
    });
    
    // Save triggers pre('save') middleware for slug regeneration
    await manufacturer.save();
    
    // Invalidate caches using centralized Redis cache service
    await redisCache.invalidateBrands();
    
    // Keep legacy cache invalidation for backward compatibility
    await invalidateCache('manufacturers:*');
    
    // Log manufacturer update activity
    logActivityAsync({
      user: req.user,
      action: ACTIONS.MANUFACTURER.UPDATED,
      targetModel: 'Manufacturer',
      targetId: manufacturer._id,
      targetName: manufacturer.name,
      req,
      metadata: {
        updatedFields: Object.keys(req.body)
      }
    });
    
    logger.info(`[updateManufacturer] Manufacturer ${manufacturer._id} updated, cache invalidated`);
    
    return successResponse(res, { manufacturer }, 'Manufacturer updated successfully');
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 'Manufacturer name already exists', null, 400);
    }
    logger.error(`[updateManufacturer] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// @desc    Remove duplicate manufacturers (keep oldest, delete the rest)
// @route   POST /api/manufacturers/deduplicate
// @access  Private/Admin
exports.deduplicateManufacturers = async (req, res) => {
  try {
    // Find all groups of manufacturers sharing the same name (case-insensitive)
    const duplicateGroups = await Manufacturer.aggregate([
      {
        $group: {
          _id: { $toLower: '$name' },
          ids: { $push: '$_id' },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (duplicateGroups.length === 0) {
      return successResponse(res, { removed: 0 }, 'No duplicate manufacturers found');
    }

    let totalRemoved = 0;
    const mongoose = require('mongoose');

    for (const group of duplicateGroups) {
      // Sort by _id ascending — oldest ObjectId = first created
      const sorted = group.ids.sort((a, b) => a.toString().localeCompare(b.toString()));
      const keepId = sorted[0];
      const removeIds = sorted.slice(1);

      // Reassign all products from duplicate manufacturers to the one we keep
      await Product.updateMany(
        { brand: { $in: removeIds } },
        { $set: { brand: keepId } }
      );

      // Hard-delete the duplicates
      await Manufacturer.deleteMany({ _id: { $in: removeIds } });
      totalRemoved += removeIds.length;

      logger.info(`[deduplicateManufacturers] Kept ${keepId}, removed ${removeIds.length} duplicates for "${group._id}"`);
    }

    // Invalidate caches
    await redisCache.invalidateBrands();
    await redisCache.invalidateProductList();
    await invalidateCache('manufacturers:*');
    await invalidateCache('products:*');

    logActivityAsync({
      user: req.user,
      action: ACTIONS.MANUFACTURER.DELETED,
      targetModel: 'Manufacturer',
      targetId: null,
      targetName: 'BULK DEDUP',
      req,
      metadata: { duplicateGroupsFound: duplicateGroups.length, totalRemoved }
    });

    return successResponse(res, {
      duplicateGroupsFound: duplicateGroups.length,
      removed: totalRemoved
    }, `Removed ${totalRemoved} duplicate manufacturer(s) across ${duplicateGroups.length} group(s)`);
  } catch (error) {
    logger.error(`[deduplicateManufacturers] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// @desc    Delete/Deactivate manufacturer (CASCADE: deletes all associated products)
// @route   DELETE /api/manufacturers/:id
// @access  Private/Admin
exports.deleteManufacturer = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findById(req.params.id);
    
    if (!manufacturer) {
      return errorResponse(res, 'Manufacturer not found', null, 404);
    }
    
    // Check if force delete is requested (query param ?force=true)
    const forceDelete = req.query.force === 'true';
    
    if (forceDelete) {
      // HARD DELETE: Permanently delete manufacturer and all products
      // Count products before deletion for logging
      const productCount = await Product.countDocuments({ brand: manufacturer._id });
      
      // Delete all products associated with this manufacturer (CASCADE DELETE)
      const productDeleteResult = await Product.deleteMany({ brand: manufacturer._id });
      
      // Delete the manufacturer permanently
      await Manufacturer.findByIdAndDelete(req.params.id);
      
      // Invalidate caches
      await redisCache.invalidateBrands();
      await redisCache.invalidateProductList();
      await invalidateCache('manufacturers:*');
      await invalidateCache('products:*');
      
      // Log manufacturer deletion activity
      logActivityAsync({
        user: req.user,
        action: ACTIONS.MANUFACTURER.DELETED,
        targetModel: 'Manufacturer',
        targetId: manufacturer._id,
        targetName: manufacturer.name,
        req,
        metadata: {
          deleteType: 'hard',
          productsDeleted: productDeleteResult.deletedCount,
          productCountBefore: productCount
        }
      });
      
      logger.warn(`[deleteManufacturer] HARD DELETE: Manufacturer ${manufacturer._id} and ${productDeleteResult.deletedCount} products permanently deleted`);
      
      return successResponse(res, {
        manufacturerDeleted: true,
        productsDeleted: productDeleteResult.deletedCount
      }, `Manufacturer and ${productDeleteResult.deletedCount} associated products deleted permanently`);
    } else {
      // SOFT DELETE: Deactivate manufacturer and all products (default behavior)
      // Count products before deactivation
      const productCount = await Product.countDocuments({ brand: manufacturer._id, isActive: true });
      
      // Deactivate all products associated with this manufacturer (CASCADE DEACTIVATE)
      const productUpdateResult = await Product.updateMany(
        { brand: manufacturer._id },
        { $set: { isActive: false } }
      );
      
      // Deactivate the manufacturer
      manufacturer.isActive = false;
      await manufacturer.save();
      
      // Invalidate caches
      await redisCache.invalidateBrands();
      await redisCache.invalidateProductList();
      await invalidateCache('manufacturers:*');
      await invalidateCache('products:*');
      
      // Log manufacturer deletion activity
      logActivityAsync({
        user: req.user,
        action: ACTIONS.MANUFACTURER.DELETED,
        targetModel: 'Manufacturer',
        targetId: manufacturer._id,
        targetName: manufacturer.name,
        req,
        metadata: {
          deleteType: 'soft',
          productsDeactivated: productUpdateResult.modifiedCount,
          activeProductCountBefore: productCount
        }
      });
      
      logger.info(`[deleteManufacturer] SOFT DELETE: Manufacturer ${manufacturer._id} and ${productUpdateResult.modifiedCount} products deactivated`);
      
      return successResponse(res, {
        manufacturerDeactivated: true,
        productsDeactivated: productUpdateResult.modifiedCount
      }, `Manufacturer and ${productUpdateResult.modifiedCount} associated products deactivated successfully`);
    }
  } catch (error) {
    logger.error(`[deleteManufacturer] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// @desc    Upload manufacturer logo
// @route   POST /api/manufacturers/:id/logo
// @access  Private/Admin
exports.uploadManufacturerLogo = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Please upload a logo', null, 400);
    }
    
    const manufacturer = await Manufacturer.findById(req.params.id);
    if (!manufacturer) {
      return errorResponse(res, 'Manufacturer not found', null, 404);
    }
    
    // Cloudinary upload result is in req.file
    manufacturer.logo = {
      url: req.file.path,
      publicId: req.file.filename,
      alt: req.body.alt || manufacturer.name
    };
    
    await manufacturer.save();
    
    return successResponse(res, { logo: manufacturer.logo }, 'Manufacturer logo uploaded successfully');
  } catch (error) {
    logger.error(`[uploadManufacturerLogo] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};
