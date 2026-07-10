const Category = require('../models/Category');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const { logActivityAsync, ACTIONS } = require('../utils/activityLogger');
const { invalidateCache } = require('../middleware/cache');
const redisCache = require('../services/redisCache');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// @desc    Get all categories (with nested children)
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    
    // Admin can see inactive categories
    const query = includeInactive === 'true' && req.user?.role === 'admin' 
      ? {} 
      : { isActive: true };
    
    const categories = await Category.find(query)
      .populate('parentCategory', 'name slug')
      .sort({ displayOrder: 1, name: 1 })
      .limit(100)
      .lean();
    
    // Get product counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({ 
          category: cat._id, 
          isActive: true 
        });
        return { ...cat, productCount };
      })
    );
    
    return successResponse(res, {
      count: categoriesWithCounts.length,
      categories: categoriesWithCounts
    });
  } catch (error) {
    logger.error(`[getCategories] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// @desc    Get category tree (nested structure)
// @route   GET /api/categories/tree
// @access  Public
exports.getCategoryTree = async (req, res) => {
  try {
    const tree = await Category.getCategoryTree();
    
    // Add product counts
    const treeWithCounts = await Promise.all(
      tree.map(async (cat) => {
        const productCount = await Product.countDocuments({ 
          category: cat._id, 
          isActive: true 
        });
        
        // Count products in subcategories too
        if (cat.children && cat.children.length > 0) {
          const childCounts = await Promise.all(
            cat.children.map(async (child) => {
              const count = await Product.countDocuments({ 
                category: child._id, 
                isActive: true 
              });
              return { ...child, productCount: count };
            })
          );
          return { ...cat, productCount, children: childCounts };
        }
        
        return { ...cat, productCount };
      })
    );
    
    return successResponse(res, {
      tree: treeWithCounts
    });
  } catch (error) {
    logger.error(`[getCategoryTree] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// @desc    Get single category by slug
// @route   GET /api/categories/:slug
// @access  Public
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug })
      .populate('parentCategory', 'name slug')
      .lean();
    
    if (!category) {
      return errorResponse(res, 'Category not found', null, 404);
    }
    
    // Get product count
    const productCount = await Product.countDocuments({ 
      category: category._id, 
      isActive: true 
    });
    
    // Get subcategories
    const subcategories = await Category.find({ 
      parentCategory: category._id, 
      isActive: true 
    }).limit(100).lean();
    
    return successResponse(res, {
      category: {
        ...category,
        productCount,
        subcategories
      }
    });
  } catch (error) {
    logger.error(`[getCategory] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    
    // Invalidate caches using centralized Redis cache service
    await redisCache.invalidateCategories();
    
    // Keep legacy cache invalidation for backward compatibility
    await invalidateCache('categories:*');
    await invalidateCache('products:*'); // Products may be affected by new category
    
    // Log category creation activity
    logActivityAsync({
      user: req.user,
      action: ACTIONS.CATEGORY.CREATED,
      targetModel: 'Category',
      targetId: category._id,
      targetName: category.name,
      req,
      metadata: {
        slug: category.slug,
        parentCategory: category.parentCategory
      }
    });
    
    logger.info(`[createCategory] Category ${category._id} created, cache invalidated`);
    
    return successResponse(res, { category }, 'Category created successfully', 201);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 'Category name already exists', null, 400);
    }
    if (error.message.includes('Maximum category nesting')) {
      return errorResponse(res, error.message, null, 400);
    }
    logger.error(`[createCategory] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
  try {
    // Prevent circular references
    if (req.body.parentCategory) {
      const parentId = req.body.parentCategory;
      const categoryId = req.params.id;
      
      if (parentId === categoryId) {
        return errorResponse(res, 'Category cannot be its own parent', null, 400);
      }
      
      // Check if parent is a child of this category
      const children = await Category.find({ parentCategory: categoryId }).limit(100).lean();
      if (children.some(child => child._id.toString() === parentId)) {
        return errorResponse(res, 'Cannot set a subcategory as parent (circular reference)', null, 400);
      }
    }
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return errorResponse(res, 'Category not found', null, 404);
    }
    
    // Invalidate caches using centralized Redis cache service
    await redisCache.invalidateCategories();
    
    // Log category update activity
    logActivityAsync({
      user: req.user,
      action: ACTIONS.CATEGORY.UPDATED,
      targetModel: 'Category',
      targetId: category._id,
      targetName: category.name,
      req,
      metadata: {
        updatedFields: Object.keys(req.body)
      }
    });
    
    logger.info(`[updateCategory] Category ${category._id} updated, cache invalidated`);
    
    return successResponse(res, { category }, 'Category updated successfully');
  } catch (error) {
    if (error.message.includes('Maximum category nesting')) {
      return errorResponse(res, error.message, null, 400);
    }
    logger.error(`[updateCategory] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// @desc    Delete/Deactivate category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return errorResponse(res, 'Category not found', null, 404);
    }
    
    // Check if category has products
    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      return errorResponse(res, `Cannot delete category with ${productCount} products. Please reassign products first.`, null, 400);
    }
    
    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({ parentCategory: category._id });
    if (subcategoryCount > 0) {
      return errorResponse(res, `Cannot delete category with ${subcategoryCount} subcategories. Please delete subcategories first.`, null, 400);
    }
    
    // Soft delete - just deactivate
    category.isActive = false;
    await category.save();
    
    // Invalidate caches using centralized Redis cache service
    await redisCache.invalidateCategories();
    
    // Log category deletion activity
    logActivityAsync({
      user: req.user,
      action: ACTIONS.CATEGORY.DELETED,
      targetModel: 'Category',
      targetId: category._id,
      targetName: category.name,
      req
    });
    
    logger.info(`[deleteCategory] Category ${category._id} deactivated, cache invalidated`);
    
    return successResponse(res, null, 'Category deactivated successfully');
  } catch (error) {
    logger.error(`[deleteCategory] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// @desc    Upload category image
// @route   POST /api/categories/:id/image
// @access  Private/Admin
exports.uploadCategoryImage = async (req, res) => {
  try {
    const { type } = req.body; // 'image' or 'banner'
    
    if (!req.file) {
      return errorResponse(res, 'Please upload an image', null, 400);
    }
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return errorResponse(res, 'Category not found', null, 404);
    }
    
    // Cloudinary upload result is in req.file
    const imageData = {
      url: req.file.path,
      publicId: req.file.filename,
      alt: req.body.alt || category.name
    };
    
    if (type === 'banner') {
      category.banner = imageData;
    } else {
      category.image = imageData;
    }
    
    await category.save();
    
    return successResponse(res, { [type]: imageData }, `Category ${type} uploaded successfully`);
  } catch (error) {
    logger.error(`[uploadCategoryImage] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};
