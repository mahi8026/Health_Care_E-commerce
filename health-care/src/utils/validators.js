/**
 * Validation Utilities
 * Centralized validation functions for forms and inputs
 */

export const validators = {
  /**
   * Validate email address
   * @param {string} email
   * @returns {boolean}
   */
  email: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  /**
   * Validate Bangladesh phone number
   * Accepts: 01XXXXXXXXX or +8801XXXXXXXXX
   * @param {string} phone
   * @returns {boolean}
   */
  phone: (phone) => {
    const cleaned = phone.replace(/[\s\-+]/g, '');
    const regex = /^(88)?01[3-9]\d{8}$/;
    return regex.test(cleaned);
  },

  /**
   * Validate password strength
   * @param {string} password
   * @returns {object} Validation result with details
   */
  password: (password) => {
    return {
      isValid: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      length: password.length,
    };
  },

  /**
   * Check if value is not empty
   * @param {any} value
   * @returns {boolean}
   */
  required: (value) => {
    return value !== null && value !== undefined && value !== '';
  },

  /**
   * Validate minimum length
   * @param {string|array} value
   * @param {number} min
   * @returns {boolean}
   */
  minLength: (value, min) => {
    return String(value).length >= min;
  },

  /**
   * Validate maximum length
   * @param {string|array} value
   * @param {number} max
   * @returns {boolean}
   */
  maxLength: (value, max) => {
    return String(value).length <= max;
  },

  /**
   * Validate positive number
   * @param {number|string} value
   * @returns {boolean}
   */
  positiveNumber: (value) => {
    return !isNaN(value) && Number(value) > 0;
  },

  /**
   * Validate URL slug format
   * @param {string} value
   * @returns {boolean}
   */
  slug: (value) => {
    const regex = /^[a-z0-9-]+$/;
    return regex.test(value);
  },

  /**
   * Validate URL format
   * @param {string} url
   * @returns {boolean}
   */
  url: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate number range
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {boolean}
   */
  range: (value, min, max) => {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
  },
};

export default validators;
