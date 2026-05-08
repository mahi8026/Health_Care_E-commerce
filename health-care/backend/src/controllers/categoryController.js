const Category = require('../models/Category');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const { logActivityAsync, ACTIONS } = require('../utils/activityLogger');
const { invalidateCache } = require('../middleware/cache');

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
    
    res.status(200).json({
      success: true,
      count: categoriesWithCounts.length,
      categories: categoriesWithCounts
    });
  } catch (error) {
    logger.error(`[getCategories] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
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
    
    res.status(200).json({
      success: true,
      tree: treeWithCounts
    });
  } catch (error) {
    logger.error(`[getCategoryTree] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
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
      return res.status(404).json({ success: false, message: 'Category not found' });
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
    }).lean();
    
    res.status(200).json({
      success: true,
      category: {
        ...category,
        productCount,
        subcategories
      }
    });
  } catch (error) {
    logger.error(`[getCategory] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    
    // Invalidate category cache
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
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category name already exists' 
      });
    }
    if (error.message.includes('Maximum category nesting')) {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
    logger.error(`[createCategory] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
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
        return res.status(400).json({ 
          success: false, 
          message: 'Category cannot be its own parent' 
        });
      }
      
      // Check if parent is a child of this category
      const children = await Category.find({ parentCategory: categoryId });
      if (children.some(child => child._id.toString() === parentId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot set a subcategory as parent (circular reference)' 
        });
      }
    }
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
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
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    if (error.message.includes('Maximum category nesting')) {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
    logger.error(`[updateCategory] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Delete/Deactivate category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    // Check if category has products
    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete category with ${productCount} products. Please reassign products first.` 
      });
    }
    
    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({ parentCategory: category._id });
    if (subcategoryCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete category with ${subcategoryCount} subcategories. Please delete subcategories first.` 
      });
    }
    
    // Soft delete - just deactivate
    category.isActive = false;
    await category.save();
    
    // Log category deletion activity
    logActivityAsync({
      user: req.user,
      action: ACTIONS.CATEGORY.DELETED,
      targetModel: 'Category',
      targetId: category._id,
      targetName: category.name,
      req
    });
    
    res.status(200).json({
      success: true,
      message: 'Category deactivated successfully'
    });
  } catch (error) {
    logger.error(`[deleteCategory] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Upload category image
// @route   POST /api/categories/:id/image
// @access  Private/Admin
exports.uploadCategoryImage = async (req, res) => {
  try {
    const { type } = req.body; // 'image' or 'banner'
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image' });
    }
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
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
    
    res.status(200).json({
      success: true,
      message: `Category ${type} uploaded successfully`,
      [type]: imageData
    });
  } catch (error) {
    logger.error(`[uploadCategoryImage] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};
