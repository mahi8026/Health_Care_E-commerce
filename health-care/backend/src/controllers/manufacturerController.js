const Manufacturer = require('../models/Manufacturer');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const { logActivityAsync, ACTIONS } = require('../utils/activityLogger');

// @desc    Get all manufacturers
// @route   GET /api/manufacturers
// @access  Public
exports.getManufacturers = async (req, res) => {
  try {
    const { includeInactive, search } = req.query;
    
    // Build query
    let query = {};
    
    // Admin can see inactive manufacturers
    if (includeInactive !== 'true' || req.user?.role !== 'admin') {
      query.isActive = true;
    }
    
    // Search by name
    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }
    
    const manufacturers = await Manufacturer.find(query)
      .sort({ name: 1 })
      .lean();
    
    // Get product counts for each manufacturer
    const manufacturersWithCounts = await Promise.all(
      manufacturers.map(async (mfr) => {
        const productCount = await Product.countDocuments({ 
          brand: mfr._id, 
          isActive: true 
        });
        return { ...mfr, productCount };
      })
    );
    
    res.status(200).json({
      success: true,
      count: manufacturersWithCounts.length,
      manufacturers: manufacturersWithCounts
    });
  } catch (error) {
    logger.error(`[getManufacturers] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Get single manufacturer by slug
// @route   GET /api/manufacturers/:slug
// @access  Public
exports.getManufacturer = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findOne({ slug: req.params.slug }).lean();
    
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: 'Manufacturer not found' });
    }
    
    // Get product count
    const productCount = await Product.countDocuments({ 
      brand: manufacturer._id, 
      isActive: true 
    });
    
    res.status(200).json({
      success: true,
      manufacturer: {
        ...manufacturer,
        productCount
      }
    });
  } catch (error) {
    logger.error(`[getManufacturer] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Create manufacturer
// @route   POST /api/manufacturers
// @access  Private/Admin
exports.createManufacturer = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.create(req.body);
    
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
    
    res.status(201).json({
      success: true,
      message: 'Manufacturer created successfully',
      manufacturer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Manufacturer name already exists' 
      });
    }
    logger.error(`[createManufacturer] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Update manufacturer
// @route   PUT /api/manufacturers/:id
// @access  Private/Admin
exports.updateManufacturer = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: 'Manufacturer not found' });
    }
    
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
    
    res.status(200).json({
      success: true,
      message: 'Manufacturer updated successfully',
      manufacturer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Manufacturer name already exists' 
      });
    }
    logger.error(`[updateManufacturer] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Delete/Deactivate manufacturer
// @route   DELETE /api/manufacturers/:id
// @access  Private/Admin
exports.deleteManufacturer = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findById(req.params.id);
    
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: 'Manufacturer not found' });
    }
    
    // Check if manufacturer has products
    const productCount = await Product.countDocuments({ brand: manufacturer._id });
    if (productCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete manufacturer with ${productCount} products. Please reassign products first.` 
      });
    }
    
    // Soft delete - just deactivate
    manufacturer.isActive = false;
    await manufacturer.save();
    
    // Log manufacturer deletion activity
    logActivityAsync({
      user: req.user,
      action: ACTIONS.MANUFACTURER.DELETED,
      targetModel: 'Manufacturer',
      targetId: manufacturer._id,
      targetName: manufacturer.name,
      req
    });
    
    res.status(200).json({
      success: true,
      message: 'Manufacturer deactivated successfully'
    });
  } catch (error) {
    logger.error(`[deleteManufacturer] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Upload manufacturer logo
// @route   POST /api/manufacturers/:id/logo
// @access  Private/Admin
exports.uploadManufacturerLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a logo' });
    }
    
    const manufacturer = await Manufacturer.findById(req.params.id);
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: 'Manufacturer not found' });
    }
    
    // Cloudinary upload result is in req.file
    manufacturer.logo = {
      url: req.file.path,
      publicId: req.file.filename,
      alt: req.body.alt || manufacturer.name
    };
    
    await manufacturer.save();
    
    res.status(200).json({
      success: true,
      message: 'Manufacturer logo uploaded successfully',
      logo: manufacturer.logo
    });
  } catch (error) {
    logger.error(`[uploadManufacturerLogo] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};
