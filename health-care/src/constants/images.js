/**
 * Image Constants
 * Centralized image paths and fallbacks
 */

export const IMAGES = {
  // Placeholder images
  placeholder: '/placeholder.svg',
  productPlaceholder: '/placeholder.svg',
  userPlaceholder: '/placeholder.svg',
  
  // Logo
  logo: '/Mediport_Logo.png',
  
  // Default OG image
  ogImage: '/og-default.png',
};

/**
 * Get image URL with fallback
 * @param {string|object} image - Image URL or image object with url property
 * @param {string} fallback - Fallback image path
 * @returns {string} Image URL
 */
export function getImageUrl(image, fallback = IMAGES.placeholder) {
  if (!image) return fallback;
  
  // Handle image object with url property
  if (typeof image === 'object' && image.url) {
    return image.url || fallback;
  }
  
  // Handle direct URL string
  if (typeof image === 'string') {
    return image || fallback;
  }
  
  return fallback;
}

/**
 * Get product image URL with fallback
 * @param {object} product - Product object
 * @returns {string} Image URL
 */
export function getProductImageUrl(product) {
  if (!product) return IMAGES.productPlaceholder;
  
  const images = product.images;
  if (!images || !Array.isArray(images) || images.length === 0) {
    return IMAGES.productPlaceholder;
  }
  
  return getImageUrl(images[0], IMAGES.productPlaceholder);
}

export default IMAGES;
