const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  getMe,
  updateProfile,
  logout,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { noStore } = require('../middleware/cache');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', protect, noStore, logout);
router.get('/me', protect, noStore, getMe);
router.put('/profile', protect, noStore, updateProfile);
router.patch('/profile', protect, noStore, updateProfile);

module.exports = router;
