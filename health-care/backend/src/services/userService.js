/**
 * User Service
 * 
 * Business logic layer for user operations.
 * Handles user profile management, validation, and related operations.
 */

const logger = require('../utils/logger');

/**
 * Validate user profile data
 * 
 * @param {Object} profileData - User profile data to validate
 * @returns {Object} Validated and sanitized profile data
 * @throws {Error} If validation fails
 */
function validateProfileData(profileData) {
  const validated = {};

  // Name validation
  if (profileData.name !== undefined) {
    if (typeof profileData.name !== 'string' || profileData.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
    validated.name = profileData.name.trim();
  }

  // Email validation (basic)
  if (profileData.email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      throw new Error('Invalid email format');
    }
    validated.email = profileData.email.toLowerCase().trim();
  }

  // Phone validation (Bangladesh format)
  if (profileData.phone !== undefined) {
    const phoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;
    if (!phoneRegex.test(profileData.phone.replace(/[\s-]/g, ''))) {
      throw new Error('Invalid phone number format');
    }
    validated.phone = profileData.phone.replace(/[\s-]/g, '');
  }

  // Company validation (for B2B users)
  if (profileData.company !== undefined) {
    validated.company = profileData.company.trim();
  }

  // Address validation
  if (profileData.address !== undefined) {
    validated.address = profileData.address;
  }

  // B2B specific fields
  if (profileData.tradeLicense !== undefined) {
    validated.tradeLicense = profileData.tradeLicense.trim();
  }

  if (profileData.taxId !== undefined) {
    validated.taxId = profileData.taxId.trim();
  }

  return validated;
}

/**
 * Validate password strength
 * 
 * @param {string} password - Password to validate
 * @returns {boolean} True if valid
 * @throws {Error} If password doesn't meet requirements
 */
function validatePassword(password) {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  // Optional: Add more strict requirements
  // const hasUpperCase = /[A-Z]/.test(password);
  // const hasLowerCase = /[a-z]/.test(password);
  // const hasNumber = /\d/.test(password);
  // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return true;
}

/**
 * Calculate user's available credit (for B2B customers)
 * 
 * @param {Object} user - User document
 * @returns {number} Available credit amount
 */
function calculateAvailableCredit(user) {
  if (user.role !== 'b2b_customer') {
    return 0;
  }

  const creditLimit = user.creditLimit || 0;
  const creditUsed = user.creditUsed || 0;

  return Math.max(0, creditLimit - creditUsed);
}

/**
 * Check if user can place order with given amount
 * 
 * @param {Object} user - User document
 * @param {number} orderAmount - Order total amount
 * @param {string} paymentMethod - Payment method
 * @returns {boolean} True if user can place order
 * @throws {Error} If user cannot place order
 */
function validateUserCanPlaceOrder(user, orderAmount, paymentMethod) {
  // Check if using B2B credit
  if (paymentMethod === 'b2b_credit') {
    if (user.role !== 'b2b_customer') {
      throw new Error('B2B credit is only available for B2B customers');
    }

    const availableCredit = calculateAvailableCredit(user);
    if (orderAmount > availableCredit) {
      throw new Error(
        `Insufficient credit. Available: ৳${availableCredit.toLocaleString()}, Required: ৳${orderAmount.toLocaleString()}`
      );
    }
  }

  // Check if account is active
  if (user.isActive === false) {
    throw new Error('Your account is inactive. Please contact support.');
  }

  return true;
}

/**
 * Format user data for public response (remove sensitive fields)
 * 
 * @param {Object} user - User document
 * @returns {Object} Sanitized user data
 */
function sanitizeUserData(user) {
  const sanitized = { ...user };

  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.resetPasswordToken;
  delete sanitized.resetPasswordExpire;
  delete sanitized.twoFactorSecret;
  delete sanitized.__v;

  return sanitized;
}

/**
 * Calculate user statistics
 * 
 * @param {Object} user - User document
 * @param {Function} getUserOrders - Repository function to get user orders
 * @returns {Promise<Object>} User statistics
 */
async function calculateUserStatistics(user, getUserOrders) {
  try {
    const orders = await getUserOrders(user._id);

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const totalSpent = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);

    return {
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalSpent,
      loyaltyPoints: user.loyaltyPoints || 0,
      availableCredit: calculateAvailableCredit(user)
    };
  } catch (error) {
    logger.error(`[calculateUserStatistics] Error: ${error.message}`);
    return {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalSpent: 0,
      loyaltyPoints: user.loyaltyPoints || 0,
      availableCredit: calculateAvailableCredit(user)
    };
  }
}

/**
 * Validate B2B customer data
 * 
 * @param {Object} userData - User data for B2B customer
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateB2BCustomerData(userData) {
  if (!userData.company || userData.company.trim().length < 2) {
    throw new Error('Company name is required for B2B customers');
  }

  if (!userData.tradeLicense || userData.tradeLicense.trim().length < 5) {
    throw new Error('Valid trade license number is required for B2B customers');
  }

  // Optional: Add more B2B-specific validations
  return true;
}

/**
 * Update user credit usage
 * 
 * @param {Object} user - User document
 * @param {number} amount - Amount to add/subtract from credit used
 * @returns {Object} Updated credit info
 */
function updateCreditUsage(user, amount) {
  if (user.role !== 'b2b_customer') {
    throw new Error('Credit management is only for B2B customers');
  }

  const newCreditUsed = (user.creditUsed || 0) + amount;
  const creditLimit = user.creditLimit || 0;

  if (newCreditUsed > creditLimit) {
    throw new Error('Credit limit exceeded');
  }

  if (newCreditUsed < 0) {
    throw new Error('Credit used cannot be negative');
  }

  return {
    creditUsed: newCreditUsed,
    availableCredit: creditLimit - newCreditUsed
  };
}

module.exports = {
  validateProfileData,
  validatePassword,
  calculateAvailableCredit,
  validateUserCanPlaceOrder,
  sanitizeUserData,
  calculateUserStatistics,
  validateB2BCustomerData,
  updateCreditUsage
};
