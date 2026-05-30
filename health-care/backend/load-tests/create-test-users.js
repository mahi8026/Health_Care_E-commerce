/**
 * Create Test Users for Load Testing
 * Run this script before running authenticated or B2B load tests
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

const testUsers = [
  {
    name: 'Load Test User',
    email: 'loadtest@medcorebd.com',
    password: 'LoadTest123!',
    phone: '+8801700000000',
    accountType: 'retail',
    description: 'Regular authenticated user for load testing'
  },
  {
    name: 'B2B Hospital',
    email: 'b2b@hospital.com',
    password: 'B2BTest123!',
    phone: '+8801800000000',
    accountType: 'b2b',
    companyName: 'Test Hospital Ltd',
    description: 'B2B user for bulk order testing'
  },
  {
    name: 'B2B Clinic',
    email: 'b2b@clinic.com',
    password: 'B2BTest123!',
    phone: '+8801900000000',
    accountType: 'b2b',
    companyName: 'Test Clinic',
    description: 'Additional B2B user for testing'
  }
];

async function createTestUser(user) {
  try {
    console.log(`\n📝 Creating user: ${user.email}...`);
    
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      name: user.name,
      email: user.email,
      password: user.password,
      phone: user.phone,
      accountType: user.accountType,
      companyName: user.companyName
    });

    if (response.status === 201 || response.status === 200) {
      console.log(`✅ Successfully created: ${user.email}`);
      console.log(`   Type: ${user.accountType}`);
      console.log(`   Description: ${user.description}`);
      return true;
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      console.log(`ℹ️  User already exists: ${user.email}`);
      console.log(`   You can use this user for testing`);
      return true;
    } else {
      console.error(`❌ Failed to create ${user.email}:`);
      console.error(`   ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}

async function verifyBackend() {
  try {
    console.log(`🔍 Checking backend at ${API_URL}...`);
    const response = await axios.get(`${API_URL}/api/health`, { timeout: 5000 });
    console.log(`✅ Backend is running`);
    return true;
  } catch (error) {
    console.error(`❌ Backend is not accessible at ${API_URL}`);
    console.error(`   Make sure the backend is running: npm run dev`);
    return false;
  }
}

async function main() {
  console.log('🚀 Artillery Load Test - User Creation Script');
  console.log('='.repeat(50));
  console.log(`Target API: ${API_URL}`);
  
  // Verify backend is running
  const backendRunning = await verifyBackend();
  if (!backendRunning) {
    console.log('\n💡 Start the backend first:');
    console.log('   cd health-care/backend');
    console.log('   npm run dev');
    process.exit(1);
  }

  // Create test users
  console.log('\n📋 Creating test users...');
  let successCount = 0;
  let failCount = 0;

  for (const user of testUsers) {
    const success = await createTestUser(user);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  
  if (successCount > 0) {
    console.log('\n🎉 Test users are ready!');
    console.log('\n📝 User Credentials:');
    console.log('\n   Regular User:');
    console.log('   Email: loadtest@medcorebd.com');
    console.log('   Password: LoadTest123!');
    console.log('\n   B2B User:');
    console.log('   Email: b2b@hospital.com');
    console.log('   Password: B2BTest123!');
    console.log('\n🚀 You can now run:');
    console.log('   npm run load-test:auth    # Test authenticated flows');
    console.log('   npm run load-test:b2b     # Test B2B flows');
  }

  if (failCount > 0) {
    console.log('\n⚠️  Some users failed to create. Check the errors above.');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('\n❌ Unexpected error:', error.message);
  process.exit(1);
});
