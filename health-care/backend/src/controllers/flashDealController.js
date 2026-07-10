const FlashDeal = require('../models/FlashDeal');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// ── Get all flash deals (admin) ──────────────────────────────────────────────
exports.getAllFlashDeals = async (req, res) => {
  try {
    const { status, isActive } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const flashDeals = await FlashDeal.find(filter)
      .populate('products.product', 'name brand images price stock')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    
    return successResponse(res, { flashDeals, total: flashDeals.length }, 'Flash deals retrieved successfully');
  } catch (error) {
    logger.error(`[getAllFlashDeals] ${error.message}`);
    return errorResponse(res, 'Failed to retrieve flash deals', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ── Get active flash deals (public) ──────────────────────────────────────────
exports.getActiveFlashDeals = async (req, res) => {
  try {
    const flashDeals = await FlashDeal.getActiveDeals();
    
    // Filter out products that are out of stock
    const activeDeals = flashDeals.map(deal => {
      const filteredProducts = deal.products.filter(item => {
        if (!item.stockLimit) return true; // unlimited stock
        return item.soldCount < item.stockLimit;
      });
      
      return {
        ...deal.toObject(),
        products: filteredProducts
      };
    }).filter(deal => deal.products.length > 0);
    
    return successResponse(res, { flashDeals: activeDeals }, 'Active flash deals retrieved successfully');
  } catch (error) {
    logger.error(`[getActiveFlashDeals] ${error.message}`);
    return errorResponse(res, 'Failed to retrieve active flash deals', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ── Get flash deal by ID ─────────────────────────────────────────────────────
exports.getFlashDealById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const flashDeal = await FlashDeal.findById(id)
      .populate('products.product')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!flashDeal) {
      return errorResponse(res, 'Flash deal not found', null, 404);
    }
    
    return successResponse(res, { flashDeal }, 'Flash deal retrieved successfully');
  } catch (error) {
    logger.error(`[getFlashDealById] ${error.message}`);
    return errorResponse(res, 'Failed to retrieve flash deal', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ── Create flash deal (admin) ────────────────────────────────────────────────
exports.createFlashDeal = async (req, res) => {
  try {
    const { title, description, products, startTime, endTime, badge, displayOrder } = req.body;
    
    // Validate required fields
    if (!products || !products.length) {
      return errorResponse(res, 'At least one product is required', null, 400);
    }
    
    if (!startTime || !endTime) {
      return errorResponse(res, 'Start time and end time are required', null, 400);
    }
    
    // Validate time range
    if (new Date(startTime) >= new Date(endTime)) {
      return errorResponse(res, 'End time must be after start time', null, 400);
    }
    
    // Validate products and calculate prices
    const processedProducts = [];
    for (const item of products) {
      const product = await Product.findById(item.productId).lean();
      if (!product) {
        return errorResponse(res, `Product ${item.productId} not found`, null, 404);
      }
      
      const discountAmount = Math.round(product.price * (item.discountPercentage / 100));
      const finalPrice = product.price - discountAmount;
      
      processedProducts.push({
        product: item.productId,
        discountPercentage: item.discountPercentage,
        discountAmount,
        finalPrice,
        stockLimit: item.stockLimit || null,
        soldCount: 0
      });
    }
    
    const flashDeal = new FlashDeal({
      title: title || 'Deal of the Day',
      description: description || 'Limited time offer - grab it before it\'s gone!',
      products: processedProducts,
      startTime,
      endTime,
      badge: badge || { text: 'FLASH DEAL', color: '#E11D48' },
      displayOrder: displayOrder || 0,
      createdBy: req.user.id
    });
    
    // Update status based on current time
    await flashDeal.updateStatus();
    
    const populatedDeal = await FlashDeal.findById(flashDeal._id)
      .populate('products.product')
      .lean();
    
    logger.info(`Flash deal created: ${flashDeal._id} by ${req.user.email}`);
    
    return successResponse(res, { flashDeal: populatedDeal }, 'Flash deal created successfully', 201);
  } catch (error) {
    logger.error(`[createFlashDeal] ${error.message}`);
    return errorResponse(res, 'Failed to create flash deal', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ── Update flash deal (admin) ────────────────────────────────────────────────
exports.updateFlashDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, products, startTime, endTime, badge, displayOrder, isActive } = req.body;
    
    const flashDeal = await FlashDeal.findById(id);
    if (!flashDeal) {
      return errorResponse(res, 'Flash deal not found', null, 404);
    }
    
    // Update basic fields
    if (title !== undefined) flashDeal.title = title;
    if (description !== undefined) flashDeal.description = description;
    if (badge !== undefined) flashDeal.badge = badge;
    if (displayOrder !== undefined) flashDeal.displayOrder = displayOrder;
    if (isActive !== undefined) flashDeal.isActive = isActive;
    
    // Update time range if provided
    if (startTime) flashDeal.startTime = startTime;
    if (endTime) flashDeal.endTime = endTime;
    
    // Validate time range
    if (flashDeal.startTime >= flashDeal.endTime) {
      return errorResponse(res, 'End time must be after start time', null, 400);
    }
    
    // Update products if provided
    if (products && products.length > 0) {
      const processedProducts = [];
      for (const item of products) {
        const product = await Product.findById(item.productId).lean();
        if (!product) {
          return errorResponse(res, `Product ${item.productId} not found`, null, 404);
        }
        
        const discountAmount = Math.round(product.price * (item.discountPercentage / 100));
        const finalPrice = product.price - discountAmount;
        
        processedProducts.push({
          product: item.productId,
          discountPercentage: item.discountPercentage,
          discountAmount,
          finalPrice,
          stockLimit: item.stockLimit || null,
          soldCount: item.soldCount || 0
        });
      }
      flashDeal.products = processedProducts;
    }
    
    // Update status based on time
    await flashDeal.updateStatus();
    
    flashDeal.updatedBy = req.user.id;
    await flashDeal.save();
    
    const updatedDeal = await FlashDeal.findById(id)
      .populate('products.product')
      .lean();
    
    logger.info(`Flash deal updated: ${id} by ${req.user.email}`);
    
    return successResponse(res, { flashDeal: updatedDeal }, 'Flash deal updated successfully');
  } catch (error) {
    logger.error(`[updateFlashDeal] ${error.message}`);
    return errorResponse(res, 'Failed to update flash deal', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ── Delete flash deal (admin) ────────────────────────────────────────────────
exports.deleteFlashDeal = async (req, res) => {
  try {
    const { id } = req.params;
    
    const flashDeal = await FlashDeal.findByIdAndDelete(id);
    if (!flashDeal) {
      return errorResponse(res, 'Flash deal not found', null, 404);
    }
    
    logger.info(`Flash deal deleted: ${id} by ${req.user.email}`);
    
    return successResponse(res, null, 'Flash deal deleted successfully');
  } catch (error) {
    logger.error(`[deleteFlashDeal] ${error.message}`);
    return errorResponse(res, 'Failed to delete flash deal', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ── Toggle flash deal active status ──────────────────────────────────────────
exports.toggleFlashDealStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const flashDeal = await FlashDeal.findById(id);
    if (!flashDeal) {
      return errorResponse(res, 'Flash deal not found', null, 404);
    }
    
    flashDeal.isActive = !flashDeal.isActive;
    flashDeal.updatedBy = req.user.id;
    await flashDeal.save();
    
    logger.info(`Flash deal ${flashDeal.isActive ? 'activated' : 'deactivated'}: ${id} by ${req.user.email}`);
    
    return successResponse(res, { flashDeal }, `Flash deal ${flashDeal.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    logger.error(`[toggleFlashDealStatus] ${error.message}`);
    return errorResponse(res, 'Failed to toggle flash deal status', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ── Update flash deal statuses (cron job) ────────────────────────────────────
exports.updateFlashDealStatuses = async () => {
  try {
    const flashDeals = await FlashDeal.find({ isActive: true }).limit(50);
    
    for (const deal of flashDeals) {
      await deal.updateStatus();
    }
    
    logger.info(`Updated statuses for ${flashDeals.length} flash deals`);
  } catch (error) {
    logger.error(`[updateFlashDealStatuses] ${error.message}`);
  }
};
