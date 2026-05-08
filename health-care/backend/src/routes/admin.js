const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Manufacturer = require('../models/Manufacturer');

// @desc    Seed Finecare manufacturer (admin only)
// @route   POST /api/admin/seed-finecare
// @access  Private/Admin
router.post('/seed-finecare', protect, authorize('admin'), async (req, res) => {
  try {
    // Check if Finecare already exists
    let finecare = await Manufacturer.findOne({ 
      name: { $regex: new RegExp('^Finecare$', 'i') } 
    });

    if (finecare) {
      // If exists but inactive, activate it
      if (!finecare.isActive) {
        finecare.isActive = true;
        await finecare.save();
        return res.status(200).json({
          success: true,
          message: 'Finecare manufacturer was inactive and has been activated',
          manufacturer: finecare
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Finecare manufacturer already exists',
        manufacturer: finecare
      });
    }

    // Create Finecare manufacturer
    finecare = await Manufacturer.create({
      name: 'Finecare',
      description: 'Finecare Biosystems - Leading manufacturer of rapid diagnostic test systems and fluorescence immunoassay analyzers',
      country: 'China',
      website: 'https://www.finecarebio.com',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Finecare manufacturer created successfully',
      manufacturer: finecare
    });

  } catch (error) {
    console.error('Error seeding Finecare:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding Finecare manufacturer',
      error: error.message
    });
  }
});

module.exports = router;

