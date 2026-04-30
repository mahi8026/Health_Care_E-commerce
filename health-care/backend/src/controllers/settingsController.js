const Settings = require('../models/Settings');

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
        contactPhone: '+880 1800-MED-CORE',
        contactEmail: 'info@medcorebd.com',
        companyName: 'MedCore BD',
        tagline: "Bangladesh's Most Trusted Medical Equipment Supplier",
      });
    }
    
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message,
    });
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
    
    res.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings',
      error: error.message,
    });
  }
};
