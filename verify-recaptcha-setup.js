/**
 * Quick verification script for reCAPTCHA configuration
 * Run with: node verify-recaptcha-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verifying reCAPTCHA Setup...\n');

let allGood = true;

// Check Frontend .env.local
const frontendEnvPath = path.join(__dirname, 'health-care', '.env.local');
if (fs.existsSync(frontendEnvPath)) {
  const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
  
  if (frontendEnv.includes('NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LdVrXAtAAAAAMNOH94w6PscYbNyCPbsQ8wGty97')) {
    console.log('✅ Frontend: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is configured');
  } else if (frontendEnv.includes('NEXT_PUBLIC_RECAPTCHA_SITE_KEY=')) {
    console.log('⚠️  Frontend: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is set but may be different');
  } else {
    console.log('❌ Frontend: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is missing');
    allGood = false;
  }
} else {
  console.log('❌ Frontend: .env.local file not found');
  allGood = false;
}

// Check Backend .env
const backendEnvPath = path.join(__dirname, 'health-care', 'backend', '.env');
if (fs.existsSync(backendEnvPath)) {
  const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
  
  if (backendEnv.includes('RECAPTCHA_SECRET_KEY=6LdVrXAtAAAAAPaPI-7Z1cSZoZYCNoIAK7jxtHdF')) {
    console.log('✅ Backend: RECAPTCHA_SECRET_KEY is configured');
  } else if (backendEnv.includes('RECAPTCHA_SECRET_KEY=') && !backendEnv.includes('RECAPTCHA_SECRET_KEY=\n')) {
    console.log('⚠️  Backend: RECAPTCHA_SECRET_KEY is set but may be different');
  } else {
    console.log('❌ Backend: RECAPTCHA_SECRET_KEY is missing or empty');
    allGood = false;
  }
  
  if (backendEnv.includes('RECAPTCHA_THRESHOLD=0.5')) {
    console.log('✅ Backend: RECAPTCHA_THRESHOLD is set to 0.5');
  } else {
    console.log('⚠️  Backend: RECAPTCHA_THRESHOLD may need adjustment');
  }
  
  if (backendEnv.includes('SKIP_CAPTCHA_DEV=false')) {
    console.log('✅ Backend: SKIP_CAPTCHA_DEV is set to false (CAPTCHA enabled)');
  } else if (backendEnv.includes('SKIP_CAPTCHA_DEV=true')) {
    console.log('⚠️  Backend: SKIP_CAPTCHA_DEV is true (CAPTCHA bypassed for dev)');
  }
} else {
  console.log('❌ Backend: .env file not found');
  allGood = false;
}

// Check hook implementation
const hookPath = path.join(__dirname, 'health-care', 'src', 'hooks', 'useRecaptcha.js');
if (fs.existsSync(hookPath)) {
  console.log('✅ Frontend: useRecaptcha hook exists');
} else {
  console.log('❌ Frontend: useRecaptcha hook is missing');
  allGood = false;
}

// Check RegisterPage integration
const registerPagePath = path.join(__dirname, 'health-care', 'src', 'views', 'RegisterPage.jsx');
if (fs.existsSync(registerPagePath)) {
  const registerPage = fs.readFileSync(registerPagePath, 'utf8');
  if (registerPage.includes('useRecaptcha') && registerPage.includes('executeRecaptcha')) {
    console.log('✅ Frontend: RegisterPage has reCAPTCHA integration');
  } else {
    console.log('❌ Frontend: RegisterPage missing reCAPTCHA integration');
    allGood = false;
  }
} else {
  console.log('❌ Frontend: RegisterPage.jsx not found');
  allGood = false;
}

console.log('\n' + '='.repeat(60));
if (allGood) {
  console.log('✅ All checks passed! Your reCAPTCHA setup looks good.');
  console.log('\n📝 Next steps:');
  console.log('   1. Start backend: cd health-care/backend && npm run dev');
  console.log('   2. Start frontend: cd health-care && npm run dev');
  console.log('   3. Test registration at: http://localhost:3000/register');
  console.log('   4. Look for reCAPTCHA badge in bottom-right corner');
} else {
  console.log('⚠️  Some issues found. Please review the messages above.');
}
console.log('='.repeat(60) + '\n');
