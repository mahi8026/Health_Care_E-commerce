const express = require('express');
const router = express.Router();
const {
  getWishlist,
  toggleProduct,
  removeProduct,
  checkProduct
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/', getWishlist);
router.get('/check/:productId', checkProduct);
router.post('/:productId', toggleProduct);
router.delete('/:productId', removeProduct);

module.exports = router;
