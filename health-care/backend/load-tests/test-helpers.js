/**
 * Artillery Test Helper Functions
 * Provides custom functions for load testing scenarios
 */

const searchTerms = [
  'ECG',
  'reagent',
  'surgical',
  'diagnostic',
  'HbA1c',
  'CBC',
  'ultrasound',
  'ventilator',
  'syringe',
  'gloves',
  'mask',
  'thermometer',
  'blood pressure',
  'glucose meter',
  'stethoscope'
];

const categories = [
  'Diagnostic Equipment',
  'Surgical Instruments',
  'Laboratory Reagents',
  'Hospital Machines',
  'Lab Equipment',
  'PPE & Safety',
  'Dental Equipment',
  'Implants & Ortho'
];

const brands = [
  'Siemens',
  'GE Healthcare',
  'Roche',
  'Abbott',
  'Mindray',
  'Philips',
  'Medtronic',
  'Johnson & Johnson'
];

/**
 * Set a random search term for search queries
 */
function setRandomSearchTerm(requestParams, context, ee, next) {
  context.vars.searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  return next();
}

/**
 * Set a random category
 */
function setRandomCategory(requestParams, context, ee, next) {
  context.vars.category = categories[Math.floor(Math.random() * categories.length)];
  return next();
}

/**
 * Set a random brand
 */
function setRandomBrand(requestParams, context, ee, next) {
  context.vars.brand = brands[Math.floor(Math.random() * brands.length)];
  return next();
}

/**
 * Generate random product quantity
 */
function setRandomQuantity(requestParams, context, ee, next) {
  context.vars.quantity = Math.floor(Math.random() * 5) + 1;
  return next();
}

/**
 * Log response time for debugging
 */
function logResponse(requestParams, response, context, ee, next) {
  if (response.statusCode !== 200) {
    console.log(`[ERROR] ${requestParams.url} - Status: ${response.statusCode}`);
  }
  return next();
}

/**
 * Custom metrics - track slow responses
 */
function trackSlowResponses(requestParams, response, context, ee, next) {
  const responseTime = response.timings.phases.total;
  
  if (responseTime > 1000) {
    ee.emit('counter', 'slow_responses', 1);
    console.log(`[SLOW] ${requestParams.url} - ${responseTime}ms`);
  }
  
  if (responseTime > 3000) {
    ee.emit('counter', 'very_slow_responses', 1);
    console.log(`[VERY SLOW] ${requestParams.url} - ${responseTime}ms`);
  }
  
  return next();
}

/**
 * Generate realistic user think time (1-5 seconds)
 */
function randomThinkTime(requestParams, context, ee, next) {
  context.vars.thinkTime = Math.floor(Math.random() * 4) + 1;
  return next();
}

module.exports = {
  setRandomSearchTerm,
  setRandomCategory,
  setRandomBrand,
  setRandomQuantity,
  logResponse,
  trackSlowResponses,
  randomThinkTime
};
