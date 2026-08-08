/**
 * Currency utilities for MediportBD
 * Ensures proper Bengali Taka symbol rendering with UTF-8 encoding
 */

import { CURRENCY } from '@/constants/config';

/**
 * Format price with Bengali Taka symbol
 * @param {number} amount - The amount to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted price string
 */
export function formatPrice(amount, options = {}) {
  const {
    showSymbol = true,
    decimals = 0,
    locale = 'en-BD',
  } = options;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? `${CURRENCY.SYMBOL}0` : '0';
  }

  const formattedAmount = Number(amount).toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showSymbol ? `${CURRENCY.SYMBOL}${formattedAmount}` : formattedAmount;
}

/**
 * Get the currency symbol
 * @returns {string} Bengali Taka symbol
 */
export function getCurrencySymbol() {
  return CURRENCY.SYMBOL;
}

/**
 * Parse price string to number
 * @param {string} priceString - Price string with or without symbol
 * @returns {number} Parsed number
 */
export function parsePrice(priceString) {
  if (typeof priceString === 'number') return priceString;
  if (!priceString) return 0;
  
  // Remove currency symbol and commas
  const cleaned = String(priceString).replace(CURRENCY.SYMBOL, '').replace(/,/g, '').trim();
  return parseFloat(cleaned) || 0;
}
