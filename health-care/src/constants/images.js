/**
 * Image Constants
 * Centralized image paths and helpers
 */

export const IMAGES = {
  logo: '/Mediport_Logo.png',
  ogImage: '/og-default.png',
};

/**
 * Get image URL
 * @param {string|object} image - Image URL or image object with url property
 * @returns {string|null} Image URL or null when no image exists
 */
export function getImageUrl(image) {
  if (!image) return null;

  // Handle image object with url property
  if (typeof image === 'object' && image.url) {
    return image.url;
  }

  // Handle direct URL string
  if (typeof image === 'string') {
    return image || null;
  }

  return null;
}

/**
 * Get product image URL
 * @param {object} product - Product object
 * @returns {string|null} Primary image URL or null when no image exists
 */
export function getProductImageUrl(product) {
  if (!product) return null;

  const images = product.images;
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  return getImageUrl(images[0]);
}

export default IMAGES;
