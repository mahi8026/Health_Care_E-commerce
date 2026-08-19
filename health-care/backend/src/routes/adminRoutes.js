const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboard,
  getAnalytics,
  getCustomers,
  updateCustomer,
  deleteCustomer,
  manualStockCheck,
  getBadges,
  getAdminUsers
} = require('../controllers/adminController');
const { getMonitoringDashboard } = require('../controllers/monitoringController');
const {
  getAllQuotes,
  getQuote,
  updateQuote,
  convertQuoteToOrder
} = require('../controllers/quoteController');
const { adminApiLimiter } = require('../middleware/enhancedRateLimiter');
const Manufacturer = require('../models/Manufacturer');

// All admin routes require authentication + admin role + rate limiting
router.use(protect, authorize('admin'), adminApiLimiter);

router.get('/dashboard', getDashboard);
router.get('/monitoring', getMonitoringDashboard);
router.get('/analytics', getAnalytics);
router.get('/badges', getBadges);
router.get('/users', getAdminUsers);
router.get('/customers', getCustomers);
router.patch('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);
router.post('/stock-check', manualStockCheck);

// Quote management
router.get('/quotes', getAllQuotes);
router.get('/quotes/:id', getQuote);
router.patch('/quotes/:id', updateQuote);
router.post('/quotes/:id/convert', convertQuoteToOrder);

// Seed Finecare manufacturer (quick fix for missing brand)
router.post('/seed-finecare', async (req, res) => {
  try {
    const { invalidateCache } = require('../middleware/cache');
    
    // Check if Finecare already exists
    let finecare = await Manufacturer.findOne({ 
      name: { $regex: new RegExp('^Finecare$', 'i') } 
    });

    if (finecare) {
      // If exists but inactive, activate it
      if (!finecare.isActive) {
        finecare.isActive = true;
        await finecare.save();
        
        // Clear cache
        await invalidateCache('manufacturers:*');
        await invalidateCache('products:*');
        
        return res.status(200).json({
          success: true,
          message: 'Finecare manufacturer was inactive and has been activated. Cache cleared.',
          manufacturer: finecare
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Finecare manufacturer already exists and is active',
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

    // Clear cache after creating manufacturer
    await invalidateCache('manufacturers:*');
    await invalidateCache('products:*');

    res.status(201).json({
      success: true,
      message: 'Finecare manufacturer created successfully. Cache cleared.',
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
