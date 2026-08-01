/**
 * Smart Search with Typo Correction
 * 
 * Features:
 * - Fuzzy matching for typos
 * - Levenshtein distance algorithm
 * - Phonetic matching
 * - Search suggestions
 * - Common medical equipment typo corrections
 */

/**
 * Calculate Levenshtein distance between two strings
 * (minimum number of single-character edits needed)
 */
function levenshteinDistance(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
}

/**
 * Calculate similarity score (0-1) based on Levenshtein distance
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  if (maxLength === 0) return 1;
  
  return 1 - (distance / maxLength);
}

/**
 * Common medical equipment typos and corrections
 */
const COMMON_TYPOS = {
  // Common misspellings
  'ultrasond': 'ultrasound',
  'xray': 'x-ray',
  'x ray': 'x-ray',
  'ecg': 'ecg',
  'ekg': 'ecg',
  'stetoscope': 'stethoscope',
  'sthethoscope': 'stethoscope',
  'thermometre': 'thermometer',
  'thermomiter': 'thermometer',
  'glukometer': 'glucometer',
  'glucometre': 'glucometer',
  'bood pressure': 'blood pressure',
  'blood presure': 'blood pressure',
  'surjical': 'surgical',
  'surgical instrumnts': 'surgical instruments',
  'injekshun': 'injection',
  'syring': 'syringe',
  'reagant': 'reagent',
  'reagents': 'reagent',
  'diagnostik': 'diagnostic',
  'monitr': 'monitor',
  'infusion pamp': 'infusion pump',
  'defibrilator': 'defibrillator',
  'ventilattor': 'ventilator',
  'nebulizer': 'nebulizer',
  'nebuliser': 'nebulizer',
  'oximeter': 'oximeter',
  'oxymeter': 'oximeter',
  'puls oximeter': 'pulse oximeter',
};

/**
 * Correct typos in search query
 */
export function correctTypos(query) {
  if (!query) return query;
  
  const lowerQuery = query.toLowerCase().trim();
  
  // Check for exact matches in typo dictionary
  if (COMMON_TYPOS[lowerQuery]) {
    return COMMON_TYPOS[lowerQuery];
  }
  
  // Check for partial matches (word by word)
  const words = lowerQuery.split(' ');
  const correctedWords = words.map(word => {
    if (COMMON_TYPOS[word]) {
      return COMMON_TYPOS[word];
    }
    
    // Find closest match in dictionary
    let closestMatch = word;
    let highestSimilarity = 0.7; // Threshold for typo correction
    
    for (const [typo, correction] of Object.entries(COMMON_TYPOS)) {
      const similarity = calculateSimilarity(word, typo);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        closestMatch = correction;
      }
    }
    
    return closestMatch;
  });
  
  return correctedWords.join(' ');
}

/**
 * Search products with fuzzy matching
 * 
 * @param {string} query - Search query
 * @param {Array} products - All products
 * @param {Object} options - Search options
 * @returns {Object} { results, suggestions, correctedQuery }
 */
export function smartSearch(query, products, options = {}) {
  const {
    threshold = 0.3,        // Minimum similarity score
    limit = 50,             // Max results
    includeOutOfStock = false,
  } = options;

  if (!query || !products || products.length === 0) {
    return { results: [], suggestions: [], correctedQuery: query };
  }

  // Correct typos
  const correctedQuery = correctTypos(query);
  const queryLower = correctedQuery.toLowerCase();
  const queryWords = queryLower.split(' ').filter(w => w.length > 0);

  // Score each product
  const scored = products.map(product => {
    let score = 0;
    const name = (product.name || '').toLowerCase();
    const category = (typeof product.category === 'object' ? product.category.name : product.category || '').toLowerCase();
    const brand = (typeof product.brand === 'object' ? product.brand.name : product.brand || '').toLowerCase();
    const tags = Array.isArray(product.tags) ? product.tags.map(t => t.toLowerCase()) : [];
    const description = (product.description || product.shortDescription || '').toLowerCase();

    // Exact match in name (highest priority)
    if (name.includes(queryLower)) {
      score += 10;
      // Bonus for exact match at start
      if (name.startsWith(queryLower)) {
        score += 5;
      }
    }

    // Word-by-word matching in name
    queryWords.forEach(word => {
      if (name.includes(word)) {
        score += 3;
      }
    });

    // Fuzzy matching in name
    const nameSimilarity = calculateSimilarity(queryLower, name);
    if (nameSimilarity > threshold) {
      score += nameSimilarity * 5;
    }

    // Category match
    if (category.includes(queryLower)) {
      score += 4;
    }
    queryWords.forEach(word => {
      if (category.includes(word)) {
        score += 2;
      }
    });

    // Brand match
    if (brand.includes(queryLower)) {
      score += 3;
    }
    queryWords.forEach(word => {
      if (brand.includes(word)) {
        score += 1.5;
      }
    });

    // Tags match
    tags.forEach(tag => {
      if (tag.includes(queryLower)) {
        score += 2;
      }
      queryWords.forEach(word => {
        if (tag.includes(word)) {
          score += 1;
        }
      });
    });

    // Description match (lower priority)
    if (description.includes(queryLower)) {
      score += 1;
    }
    queryWords.forEach(word => {
      if (description.includes(word)) {
        score += 0.5;
      }
    });

    // Boost for in-stock products
    if (product.stock > 0) {
      score += 0.5;
    }

    // Boost for highly rated products
    const rating = product.rating?.average || product.rating || 0;
    if (rating >= 4) {
      score += 0.3;
    }

    return { product, score };
  });

  // Filter by threshold and stock
  let filtered = scored.filter(item => item.score > 0);
  
  if (!includeOutOfStock) {
    // Prioritize in-stock, but include out-of-stock if not enough results
    const inStock = filtered.filter(item => item.product.stock > 0);
    if (inStock.length >= 5) {
      filtered = inStock;
    }
  }

  // Sort by score descending
  filtered.sort((a, b) => b.score - a.score);

  // Limit results
  const results = filtered.slice(0, limit).map(item => item.product);

  // Generate search suggestions
  const suggestions = generateSuggestions(query, products, results);

  return {
    results,
    suggestions,
    correctedQuery: correctedQuery !== query ? correctedQuery : null,
  };
}

/**
 * Generate search suggestions based on query and results
 */
function generateSuggestions(query, products, currentResults) {
  const suggestions = new Set();
  const queryLower = query.toLowerCase();

  // Add categories from results
  currentResults.slice(0, 10).forEach(product => {
    const category = typeof product.category === 'object' 
      ? product.category.name 
      : product.category;
    if (category && !category.toLowerCase().includes(queryLower)) {
      suggestions.add(category);
    }
  });

  // Add brands from results
  currentResults.slice(0, 10).forEach(product => {
    const brand = typeof product.brand === 'object' 
      ? product.brand.name 
      : product.brand;
    if (brand && !brand.toLowerCase().includes(queryLower)) {
      suggestions.add(`${query} ${brand}`);
    }
  });

  // Add common related searches
  const relatedSearches = getRelatedSearches(query);
  relatedSearches.forEach(search => suggestions.add(search));

  return Array.from(suggestions).slice(0, 5);
}

/**
 * Get related searches for common medical equipment
 */
function getRelatedSearches(query) {
  const related = {
    'ecg': ['ecg machine', 'ecg monitor', 'ecg electrodes', 'ecg paper'],
    'ultrasound': ['ultrasound machine', 'ultrasound probe', 'ultrasound gel'],
    'x-ray': ['x-ray machine', 'x-ray film', 'x-ray viewer'],
    'blood pressure': ['blood pressure monitor', 'bp cuff', 'sphygmomanometer'],
    'thermometer': ['digital thermometer', 'infrared thermometer', 'forehead thermometer'],
    'glucometer': ['glucose meter', 'blood sugar test strips', 'lancets'],
    'stethoscope': ['digital stethoscope', 'cardiology stethoscope'],
    'surgical': ['surgical instruments', 'surgical gloves', 'surgical masks'],
    'reagent': ['laboratory reagents', 'hba1c reagent', 'cbc reagent'],
    'syringe': ['insulin syringe', 'disposable syringe', 'syringe pump'],
  };

  const queryLower = query.toLowerCase();
  
  for (const [key, values] of Object.entries(related)) {
    if (queryLower.includes(key)) {
      return values;
    }
  }

  return [];
}

/**
 * Highlight search query in text
 */
export function highlightSearchTerm(text, query) {
  if (!text || !query) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
}
