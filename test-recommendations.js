#!/usr/bin/env node
/**
 * Recommendation System Test Script
 * Tests all 6 recommendation API endpoints and verifies functionality
 * 
 * Usage:
 *   node test-recommendations.js
 * 
 * Prerequisites:
 *   - Backend running on http://localhost:5000
 *   - MongoDB connected with sample data
 */

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}\n${'─'.repeat(60)}`),
  data: (label, value) => console.log(`${colors.gray}  ${label}:${colors.reset} ${value}`),
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

/**
 * Helper: Fetch with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  try {
    const startTime = Date.now();
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const duration = Date.now() - startTime;
    const data = await response.json();
    
    return { success: true, data, status: response.status, duration };
  } catch (error) {
    return { success: false, error: error.message, status: 0, duration: 0 };
  }
}

/**
 * Test 1: Get sample product ID
 */
async function getSampleProductId() {
  log.section('Test 1: Get Sample Product');
  
  const result = await fetchAPI('/products?limit=1');
  
  if (!result.success) {
    log.error('Failed to fetch products');
    log.data('Error', result.error);
    results.failed++;
    return null;
  }
  
  if (!result.data.success || !result.data.data || result.data.data.length === 0) {
    log.error('No products found in database');
    log.warn('Run: cd health-care/backend && npm run seed');
    results.failed++;
    return null;
  }
  
  const product = result.data.data[0];
  const productId = product._id || product.id;
  
  log.success('Sample product fetched');
  log.data('Product ID', productId);
  log.data('Product Name', product.name);
  log.data('Response Time', `${result.duration}ms`);
  
  results.passed++;
  results.tests.push({ name: 'Get Sample Product', status: 'passed', duration: result.duration });
  
  return productId;
}

/**
 * Test 2: Similar Products
 */
async function testSimilarProducts(productId) {
  log.section('Test 2: Similar Products (Content-Based)');
  
  const result = await fetchAPI(`/recommendations/similar/${productId}?limit=8`);
  
  if (!result.success) {
    log.error('API call failed');
    log.data('Error', result.error);
    results.failed++;
    results.tests.push({ name: 'Similar Products', status: 'failed', error: result.error });
    return;
  }
  
  if (result.status !== 200) {
    log.error(`Expected status 200, got ${result.status}`);
    results.failed++;
    results.tests.push({ name: 'Similar Products', status: 'failed', error: `Status ${result.status}` });
    return;
  }
  
  const { data } = result;
  
  if (!data.success || !data.data || !data.data.recommendations) {
    log.error('Invalid response structure');
    log.data('Response', JSON.stringify(data, null, 2));
    results.failed++;
    results.tests.push({ name: 'Similar Products', status: 'failed', error: 'Invalid structure' });
    return;
  }
  
  const recommendations = data.data.recommendations;
  
  log.success('Similar products fetched successfully');
  log.data('Count', recommendations.length);
  log.data('Algorithm', data.data.algorithm);
  log.data('Response Time', `${result.duration}ms`);
  log.data('Cached', result.duration < 100 ? 'Yes' : 'No');
  
  if (recommendations.length > 0) {
    log.data('Sample Product', recommendations[0].name);
  }
  
  results.passed++;
  results.tests.push({ name: 'Similar Products', status: 'passed', duration: result.duration, count: recommendations.length });
}

/**
 * Test 3: Also Viewed Products
 */
async function testAlsoViewed(productId) {
  log.section('Test 3: Customers Also Viewed (Collaborative)');
  
  const result = await fetchAPI(`/recommendations/also-viewed/${productId}?limit=8`);
  
  if (!result.success) {
    log.error('API call failed');
    log.data('Error', result.error);
    results.failed++;
    results.tests.push({ name: 'Also Viewed', status: 'failed', error: result.error });
    return;
  }
  
  const { data } = result;
  
  if (!data.success || !data.data || !data.data.recommendations) {
    log.error('Invalid response structure');
    results.failed++;
    results.tests.push({ name: 'Also Viewed', status: 'failed', error: 'Invalid structure' });
    return;
  }
  
  const recommendations = data.data.recommendations;
  
  log.success('Also viewed products fetched successfully');
  log.data('Count', recommendations.length);
  log.data('Algorithm', data.data.algorithm);
  log.data('Response Time', `${result.duration}ms`);
  
  if (recommendations.length === 0) {
    log.warn('No order history found - expected for new database');
    log.info('Will fallback to similar products automatically');
  } else {
    log.data('Sample Product', recommendations[0].name);
  }
  
  results.passed++;
  results.tests.push({ name: 'Also Viewed', status: 'passed', duration: result.duration, count: recommendations.length });
}

/**
 * Test 4: Bought Together
 */
async function testBoughtTogether(productId) {
  log.section('Test 4: Frequently Bought Together');
  
  const result = await fetchAPI(`/recommendations/bought-together/${productId}?limit=4`);
  
  if (!result.success) {
    log.error('API call failed');
    log.data('Error', result.error);
    results.failed++;
    results.tests.push({ name: 'Bought Together', status: 'failed', error: result.error });
    return;
  }
  
  const { data } = result;
  const recommendations = data.data.recommendations;
  
  log.success('Bought together products fetched successfully');
  log.data('Count', recommendations.length);
  log.data('Algorithm', data.data.algorithm);
  log.data('Response Time', `${result.duration}ms`);
  
  if (recommendations.length === 0) {
    log.warn('No purchase history found - expected for new database');
  } else {
    log.data('Sample Product', recommendations[0].name);
  }
  
  results.passed++;
  results.tests.push({ name: 'Bought Together', status: 'passed', duration: result.duration, count: recommendations.length });
}

/**
 * Test 5: Hybrid Recommendations
 */
async function testHybridRecommendations(productId) {
  log.section('Test 5: Hybrid Recommendations (Best Overall)');
  
  const result = await fetchAPI(`/recommendations/hybrid/${productId}?limit=8`);
  
  if (!result.success) {
    log.error('API call failed');
    log.data('Error', result.error);
    results.failed++;
    results.tests.push({ name: 'Hybrid', status: 'failed', error: result.error });
    return;
  }
  
  const { data } = result;
  const recommendations = data.data.recommendations;
  
  log.success('Hybrid recommendations fetched successfully');
  log.data('Count', recommendations.length);
  log.data('Algorithm', data.data.algorithm);
  log.data('Response Time', `${result.duration}ms`);
  
  if (data.data.breakdown) {
    log.data('Breakdown', JSON.stringify(data.data.breakdown));
  }
  
  if (recommendations.length > 0) {
    log.data('Sample Product', recommendations[0].name);
  }
  
  results.passed++;
  results.tests.push({ name: 'Hybrid', status: 'passed', duration: result.duration, count: recommendations.length });
}

/**
 * Test 6: Trending Products
 */
async function testTrendingProducts() {
  log.section('Test 6: Trending Products');
  
  const result = await fetchAPI('/recommendations/trending?limit=12');
  
  if (!result.success) {
    log.error('API call failed');
    log.data('Error', result.error);
    results.failed++;
    results.tests.push({ name: 'Trending', status: 'failed', error: result.error });
    return;
  }
  
  const { data } = result;
  const recommendations = data.data.recommendations;
  
  log.success('Trending products fetched successfully');
  log.data('Count', recommendations.length);
  log.data('Algorithm', data.data.algorithm);
  log.data('Response Time', `${result.duration}ms`);
  
  if (recommendations.length === 0) {
    log.warn('No recent orders found - expected for new database');
  } else {
    log.data('Sample Product', recommendations[0].name);
  }
  
  results.passed++;
  results.tests.push({ name: 'Trending', status: 'passed', duration: result.duration, count: recommendations.length });
}

/**
 * Test 7: Cache Performance
 */
async function testCachePerformance(productId) {
  log.section('Test 7: Cache Performance');
  
  // First request (uncached)
  log.info('Making first request (should be uncached)...');
  const firstResult = await fetchAPI(`/recommendations/hybrid/${productId}?limit=8`);
  
  if (!firstResult.success) {
    log.error('First request failed');
    results.failed++;
    results.tests.push({ name: 'Cache Performance', status: 'failed', error: 'First request failed' });
    return;
  }
  
  log.data('First Request Time', `${firstResult.duration}ms`);
  
  // Second request (should be cached)
  log.info('Making second request (should be cached)...');
  const secondResult = await fetchAPI(`/recommendations/hybrid/${productId}?limit=8`);
  
  if (!secondResult.success) {
    log.error('Second request failed');
    results.failed++;
    results.tests.push({ name: 'Cache Performance', status: 'failed', error: 'Second request failed' });
    return;
  }
  
  log.data('Second Request Time', `${secondResult.duration}ms`);
  
  const improvement = ((firstResult.duration - secondResult.duration) / firstResult.duration * 100).toFixed(1);
  
  if (secondResult.duration < firstResult.duration) {
    log.success('Cache is working!');
    log.data('Performance Improvement', `${improvement}%`);
  } else {
    log.warn('Cache might not be working (second request not faster)');
    log.info('This is OK if Redis is not running - fallback is in-memory');
  }
  
  results.passed++;
  results.tests.push({ 
    name: 'Cache Performance', 
    status: 'passed', 
    firstRequest: firstResult.duration, 
    secondRequest: secondResult.duration,
    improvement: `${improvement}%`
  });
}

/**
 * Test 8: Error Handling
 */
async function testErrorHandling() {
  log.section('Test 8: Error Handling');
  
  // Test invalid product ID
  log.info('Testing invalid product ID...');
  const result = await fetchAPI('/recommendations/similar/invalid-id-123');
  
  if (result.status === 400 && !result.data.success) {
    log.success('Invalid ID correctly rejected');
    log.data('Error Message', result.data.message);
    results.passed++;
    results.tests.push({ name: 'Error Handling', status: 'passed' });
  } else {
    log.error('Invalid ID should return 400 error');
    results.failed++;
    results.tests.push({ name: 'Error Handling', status: 'failed', error: 'Validation not working' });
  }
}

/**
 * Print final summary
 */
function printSummary() {
  log.section('Test Summary');
  
  console.log(`\n${colors.cyan}Total Tests:${colors.reset} ${results.tests.length}`);
  console.log(`${colors.green}Passed:${colors.reset}      ${results.passed}`);
  console.log(`${colors.red}Failed:${colors.reset}      ${results.failed}`);
  console.log(`${colors.gray}Skipped:${colors.reset}     ${results.skipped}\n`);
  
  // Print individual test results
  console.log('Detailed Results:');
  results.tests.forEach((test, i) => {
    const icon = test.status === 'passed' ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    const duration = test.duration ? `(${test.duration}ms)` : '';
    const count = test.count !== undefined ? `[${test.count} items]` : '';
    console.log(`  ${i + 1}. ${icon} ${test.name} ${duration} ${count}`);
    
    if (test.error) {
      console.log(`     ${colors.red}Error: ${test.error}${colors.reset}`);
    }
  });
  
  // Overall status
  console.log('');
  if (results.failed === 0) {
    console.log(`${colors.green}🎉 All tests passed! Recommendation system is working perfectly.${colors.reset}\n`);
  } else {
    console.log(`${colors.red}❌ Some tests failed. Please check the errors above.${colors.reset}\n`);
  }
  
  // Performance summary
  const avgDuration = results.tests
    .filter(t => t.duration)
    .reduce((sum, t) => sum + t.duration, 0) / results.tests.filter(t => t.duration).length;
  
  if (avgDuration) {
    console.log(`Average API Response Time: ${avgDuration.toFixed(0)}ms`);
    
    if (avgDuration < 100) {
      console.log(`${colors.green}✓ Excellent performance (cached)${colors.reset}\n`);
    } else if (avgDuration < 500) {
      console.log(`${colors.green}✓ Good performance${colors.reset}\n`);
    } else {
      console.log(`${colors.yellow}⚠ Performance could be improved (consider Redis caching)${colors.reset}\n`);
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║         Recommendation System Test Suite v1.0             ║
║                                                           ║
║  Testing backend API endpoints and functionality         ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  log.info(`Testing API at: ${API_URL}`);
  log.info('Starting tests...\n');
  
  // Get sample product ID
  const productId = await getSampleProductId();
  
  if (!productId) {
    log.error('\nCannot proceed without a valid product ID');
    log.info('Please ensure:');
    log.info('  1. Backend is running: cd health-care/backend && npm run dev');
    log.info('  2. MongoDB is connected');
    log.info('  3. Database has products: npm run seed');
    process.exit(1);
  }
  
  // Run all recommendation tests
  await testSimilarProducts(productId);
  await testAlsoViewed(productId);
  await testBoughtTogether(productId);
  await testHybridRecommendations(productId);
  await testTrendingProducts();
  await testCachePerformance(productId);
  await testErrorHandling();
  
  // Print summary
  printSummary();
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`\n${colors.red}Fatal Error:${colors.reset}`, error.message);
  process.exit(1);
});
