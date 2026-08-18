#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Checks if Human brand products are accessible on production
 */

const https = require('https');

const PRODUCTION_API = 'https://health-care-e-commerce-ubyy.onrender.com';
const PRODUCTION_FRONTEND = 'https://health-care-e-commerce-murex.vercel.app';

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data.substring(0, 200) });
        }
      });
    }).on('error', reject);
  });
}

async function checkBackendHealth() {
  console.log('\n🔍 Checking Backend Health...');
  try {
    const result = await httpsGet(`${PRODUCTION_API}/api/health`);
    if (result.status === 200) {
      console.log('✅ Backend is healthy');
      console.log('   Status:', result.data.status || 'OK');
      return true;
    } else {
      console.log(`❌ Backend returned status ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    return false;
  }
}

async function checkHumanProducts() {
  console.log('\n🔍 Checking Human Products API...');
  try {
    const result = await httpsGet(`${PRODUCTION_API}/api/products?search=Human&limit=5`);
    if (result.status === 200 && result.data.products) {
      const humanProducts = result.data.products;
      console.log(`✅ Found ${humanProducts.length} Human products in API response`);
      console.log('\nSample products:');
      humanProducts.slice(0, 3).forEach(p => {
        console.log(`   - ${p.name}`);
        console.log(`     Price: ৳${p.price?.toLocaleString() || 'N/A'}`);
        console.log(`     Stock: ${p.stock || 0} units`);
      });
      return humanProducts.length > 0;
    } else {
      console.log(`❌ API returned status ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Products API check failed:', error.message);
    return false;
  }
}

async function checkFrontend() {
  console.log('\n🔍 Checking Frontend...');
  try {
    const result = await httpsGet(PRODUCTION_FRONTEND);
    if (result.status === 200) {
      console.log('✅ Frontend is accessible');
      return true;
    } else {
      console.log(`❌ Frontend returned status ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend check failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Human Brand Reagent Products - Deployment Verification');
  console.log('═══════════════════════════════════════════════════════════');

  const results = {
    backend: await checkBackendHealth(),
    products: await checkHumanProducts(),
    frontend: await checkFrontend(),
  };

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Verification Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Backend Health:     ${results.backend ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Human Products API: ${results.products ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Frontend:           ${results.frontend ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = results.backend && results.products && results.frontend;
  
  if (allPassed) {
    console.log('\n🎉 Deployment verification SUCCESSFUL!');
    console.log('\n📍 View products at:');
    console.log(`   ${PRODUCTION_FRONTEND}/products?brand=Human`);
    console.log(`   ${PRODUCTION_FRONTEND}/reagent-store`);
  } else {
    console.log('\n⚠️  Some checks failed. Deployment may still be in progress.');
    console.log('   Wait 5-10 minutes and try again.');
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  console.error('\n❌ Verification script error:', error);
  process.exit(1);
});
