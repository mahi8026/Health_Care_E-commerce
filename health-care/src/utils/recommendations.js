/**
 * AI-Powered Product Recommendations Engine
 * 
 * Generates personalized product recommendations based on:
 * - Collaborative filtering (customers who bought X also bought Y)
 * - Content-based filtering (similar products by category, brand, features)
 * - User behavior (browsing history, cart items, wishlist)
 * - Purchase patterns (frequently bought together)
 * 
 * This is a simplified AI algorithm. For production, consider integrating:
 * - TensorFlow.js for deep learning
 * - A proper recommendation API (Amazon Personalize, Algolia Recommend)
 */

/**
 * Calculate similarity score between two products (0-1)
 * Uses cosine similarity based on product features
 */
function calculateProductSimilarity(product1, product2) {
  let score = 0;
  let factors = 0;

  // Same category (40% weight)
  if (product1.category === product2.category) {
    score += 0.4;
  }
  factors++;

  // Same brand (20% weight)
  if (product1.brand && product2.brand && product1.brand === product2.brand) {
    score += 0.2;
  }
  factors++;

  // Similar price range (±30%) (15% weight)
  if (product1.price && product2.price) {
    const priceDiff = Math.abs(product1.price - product2.price);
    const avgPrice = (product1.price + product2.price) / 2;
    const priceSimil = 1 - Math.min(priceDiff / avgPrice, 1);
    if (priceSimil > 0.7) {
      score += 0.15 * priceSimil;
    }
    factors++;
  }

  // Similar rating (10% weight)
  const rating1 = product1.rating?.average || product1.rating || 0;
  const rating2 = product2.rating?.average || product2.rating || 0;
  if (rating1 > 0 && rating2 > 0) {
    const ratingDiff = Math.abs(rating1 - rating2);
    const ratingSimil = 1 - (ratingDiff / 5);
    score += 0.1 * ratingSimil;
    factors++;
  }

  // Tags/keywords overlap (15% weight)
  if (product1.tags && product2.tags && Array.isArray(product1.tags) && Array.isArray(product2.tags)) {
    const tags1 = new Set(product1.tags);
    const tags2 = new Set(product2.tags);
    const intersection = [...tags1].filter(t => tags2.has(t)).length;
    const union = new Set([...tags1, ...tags2]).size;
    const jaccardSimilarity = intersection / union;
    score += 0.15 * jaccardSimilarity;
    factors++;
  }

  return score;
}

/**
 * Get "You might also like" recommendations
 * 
 * @param {Object} currentProduct - Current product being viewed
 * @param {Array} allProducts - All available products
 * @param {Array} recentlyViewed - User's recently viewed products
 * @param {Array} cartItems - User's cart items
 * @param {number} limit - Number of recommendations to return
 * @returns {Array} Recommended products
 */
export function getRecommendations(currentProduct, allProducts, recentlyViewed = [], cartItems = [], limit = 6) {
  if (!currentProduct || !allProducts || allProducts.length === 0) {
    return [];
  }

  // Filter out current product and already viewed/carted items
  const viewedIds = new Set([
    currentProduct._id || currentProduct.id,
    ...recentlyViewed.map(p => p._id || p.id),
    ...cartItems.map(p => p._id || p.id || p.product?._id),
  ]);

  const candidates = allProducts.filter(p => {
    const id = p._id || p.id;
    return id && !viewedIds.has(id) && p.stock > 0; // Only in-stock products
  });

  // Calculate similarity scores
  const scored = candidates.map(product => ({
    product,
    score: calculateProductSimilarity(currentProduct, product),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Apply diversification (don't show too many from same category)
  const diversified = [];
  const categoryCount = {};
  
  for (const item of scored) {
    const category = item.product.category;
    const count = categoryCount[category] || 0;
    
    // Allow max 3 products from same category
    if (count < 3) {
      diversified.push(item);
      categoryCount[category] = count + 1;
      
      if (diversified.length >= limit) break;
    }
  }

  // If not enough diversified, fill with highest scores
  if (diversified.length < limit) {
    const remaining = scored
      .filter(item => !diversified.includes(item))
      .slice(0, limit - diversified.length);
    diversified.push(...remaining);
  }

  return diversified.slice(0, limit).map(item => item.product);
}

/**
 * Get "Customers who bought this also bought" recommendations
 * 
 * @param {Object} currentProduct - Current product
 * @param {Array} orderHistory - All orders from database
 * @param {Array} allProducts - All available products
 * @param {number} limit - Number of recommendations
 * @returns {Array} Recommended products
 */
export function getFrequentlyBoughtTogether(currentProduct, orderHistory = [], allProducts = [], limit = 4) {
  if (!currentProduct || !orderHistory || orderHistory.length === 0) {
    return [];
  }

  const currentId = currentProduct._id || currentProduct.id;
  
  // Find orders that contain current product
  const relevantOrders = orderHistory.filter(order => 
    order.items?.some(item => {
      const itemId = item.product?._id || item.product?.id || item.productId || item._id;
      return itemId === currentId;
    })
  );

  // Count co-occurrences of other products
  const coOccurrences = {};
  
  relevantOrders.forEach(order => {
    order.items?.forEach(item => {
      const itemId = item.product?._id || item.product?.id || item.productId || item._id;
      if (itemId && itemId !== currentId) {
        coOccurrences[itemId] = (coOccurrences[itemId] || 0) + 1;
      }
    });
  });

  // Sort by frequency
  const sorted = Object.entries(coOccurrences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  // Find actual products
  return sorted
    .map(id => allProducts.find(p => (p._id || p.id) === id))
    .filter(Boolean);
}

/**
 * Get trending products (most viewed/purchased recently)
 * 
 * @param {Array} allProducts - All available products
 * @param {Array} analytics - View/purchase analytics data
 * @param {number} limit - Number of products
 * @returns {Array} Trending products
 */
export function getTrendingProducts(allProducts, analytics = [], limit = 6) {
  if (!allProducts || allProducts.length === 0) {
    return allProducts.slice(0, limit);
  }

  // Score products based on recent activity
  const scored = allProducts.map(product => {
    const id = product._id || product.id;
    
    // Recent views (last 7 days)
    const recentViews = analytics.filter(a => 
      a.productId === id && 
      a.type === 'view' && 
      Date.now() - new Date(a.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
    ).length;

    // Recent purchases (last 7 days)
    const recentPurchases = analytics.filter(a =>
      a.productId === id &&
      a.type === 'purchase' &&
      Date.now() - new Date(a.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
    ).length;

    // Score: purchases are worth 5x views
    const score = recentViews + (recentPurchases * 5);

    return { product, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(item => item.product);
}

/**
 * Get personalized homepage recommendations based on user history
 * 
 * @param {Object} user - User object
 * @param {Array} recentlyViewed - Recently viewed products
 * @param {Array} wishlist - Wishlist products
 * @param {Array} allProducts - All available products
 * @param {number} limit - Number of recommendations
 * @returns {Array} Personalized products
 */
export function getPersonalizedRecommendations(user, recentlyViewed = [], wishlist = [], allProducts = [], limit = 12) {
  if (!allProducts || allProducts.length === 0) {
    return allProducts.slice(0, limit);
  }

  // Collect user's preferred categories and brands
  const categoryPreferences = {};
  const brandPreferences = {};

  [...recentlyViewed, ...wishlist].forEach(product => {
    if (product.category) {
      categoryPreferences[product.category] = (categoryPreferences[product.category] || 0) + 1;
    }
    if (product.brand) {
      brandPreferences[product.brand] = (brandPreferences[product.brand] || 0) + 1;
    }
  });

  // Score products based on preferences
  const scored = allProducts.map(product => {
    let score = 0;

    // Category preference (50% weight)
    if (product.category && categoryPreferences[product.category]) {
      score += 0.5 * categoryPreferences[product.category];
    }

    // Brand preference (30% weight)
    if (product.brand && brandPreferences[product.brand]) {
      score += 0.3 * brandPreferences[product.brand];
    }

    // Rating (10% weight)
    const rating = product.rating?.average || product.rating || 0;
    score += 0.1 * rating;

    // Stock availability (10% weight)
    if (product.stock > 0) {
      score += 0.1;
    }

    return { product, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Remove already viewed/wishlisted
  const viewedIds = new Set([
    ...recentlyViewed.map(p => p._id || p.id),
    ...wishlist.map(p => p._id || p.id),
  ]);

  const filtered = scored.filter(item => {
    const id = item.product._id || item.product.id;
    return !viewedIds.has(id);
  });

  return filtered.slice(0, limit).map(item => item.product);
}
