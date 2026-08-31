const Settings = require('../models/Settings');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * @desc    Get site settings
 * @route   GET /api/settings
 * @access  Public
 */
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // Create default settings if none exist
    if (!settings) {
      settings = await Settings.create({
        freeDeliveryThreshold: 50000,
        returnPolicyDays: 30,
        b2bMaxDiscount: 22,
        b2bCreditDays: 90,
        certifications: ['DGDA Registered', 'ISO 13485 Certified'],
        supportHours: '24/7',
        contactPhone: '+880 1646-886795',
        contactEmail: 'mediportbdofficial@gmail.com',
        companyName: 'MediportBD',
        tagline: "Bangladesh's Most Trusted Medical Equipment Supplier",
      });
    }
    
    return successResponse(res, settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return errorResponse(res, 'Error fetching settings', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Update site settings
 * @route   PUT /api/settings
 * @access  Private/Admin
 */
exports.updateSettings = async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    
    return successResponse(res, settings, 'Settings updated successfully');
  } catch (error) {
    console.error('Error updating settings:', error);
    return errorResponse(res, 'Error updating settings', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};
