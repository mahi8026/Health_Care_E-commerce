#!/usr/bin/env node

/**
 * MedCore BD - Deployment Readiness Checker
 * 
 * This script checks if your project is ready for deployment
 * Run: node check-deployment-readiness.js
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`),
};

let errors = 0;
let warnings = 0;
let passed = 0;

// Check if file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

// Parse .env file
function parseEnv(content) {
  const env = {};
  if (!content) return env;
  
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
  return env;
}

// Check required environment variables
function checkEnvVar(env, varName, required = true) {
  const value = env[varName];
  
  if (!value || value === '' || value.includes('[REQUIRED') || value.includes('your_') || value.includes('xxx')) {
    if (required) {
      log.error(`${varName} is not set or has placeholder value`);
      errors++;
      return false;
    } else {
      log.warning(`${varName} is not set (optional)`);
      warnings++;
      return false;
    }
  } else {
    log.success(`${varName} is configured`);
    passed++;
    return true;
  }
}

// Main checks
async function runChecks() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     MedCore BD - Deployment Readiness Checker             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Check project structure
  log.section('📁 Checking Project Structure...');
  
  const requiredFiles = [
    'health-care/package.json',
    'health-care/next.config.mjs',
    'health-care/backend/package.json',
    'health-care/backend/src/server.js',
  ];

  for (const file of requiredFiles) {
    if (fileExists(file)) {
      log.success(`${file} exists`);
      passed++;
    } else {
      log.error(`${file} is missing`);
      errors++;
    }
  }

  // Check frontend package.json
  log.section('📦 Checking Frontend Configuration...');
  
  const frontendPkg = readFile('health-care/package.json');
  if (frontendPkg) {
    try {
      const pkg = JSON.parse(frontendPkg);
      
      if (pkg.scripts && pkg.scripts.build) {
        log.success('Build script exists');
        passed++;
      } else {
        log.error('Build script missing in package.json');
        errors++;
      }
      
      if (pkg.dependencies && pkg.dependencies.next) {
        log.success(`Next.js ${pkg.dependencies.next} installed`);
        passed++;
      } else {
        log.error('Next.js not found in dependencies');
        errors++;
      }
    } catch (error) {
      log.error('Invalid package.json format');
      errors++;
    }
  }

  // Check backend package.json
  log.section('📦 Checking Backend Configuration...');
  
  const backendPkg = readFile('health-care/backend/package.json');
  if (backendPkg) {
    try {
      const pkg = JSON.parse(backendPkg);
      
      if (pkg.scripts && pkg.scripts.start) {
        log.success('Start script exists');
        passed++;
      } else {
        log.error('Start script missing in package.json');
        errors++;
      }
      
      const requiredDeps = ['express', 'mongoose', 'jsonwebtoken', 'stripe'];
      for (const dep of requiredDeps) {
        if (pkg.dependencies && pkg.dependencies[dep]) {
          log.success(`${dep} installed`);
          passed++;
        } else {
          log.error(`${dep} not found in dependencies`);
          errors++;
        }
      }
    } catch (error) {
      log.error('Invalid package.json format');
      errors++;
    }
  }

  // Check frontend environment variables
  log.section('🔐 Checking Frontend Environment Variables...');
  
  const frontendEnv = parseEnv(readFile('health-care/.env.production'));
  
  if (Object.keys(frontendEnv).length === 0) {
    log.warning('.env.production not found or empty');
    log.info('You will need to set environment variables in Vercel Dashboard');
    warnings++;
  } else {
    checkEnvVar(frontendEnv, 'NEXT_PUBLIC_API_URL', true);
    checkEnvVar(frontendEnv, 'NEXT_PUBLIC_SITE_URL', true);
    checkEnvVar(frontendEnv, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', true);
    checkEnvVar(frontendEnv, 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', true);
    checkEnvVar(frontendEnv, 'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET', true);
    checkEnvVar(frontendEnv, 'NEXT_PUBLIC_GA4_MEASUREMENT_ID', false);
  }

  // Check backend environment variables
  log.section('🔐 Checking Backend Environment Variables...');
  
  const backendEnv = parseEnv(readFile('health-care/backend/.env.production'));
  
  if (Object.keys(backendEnv).length === 0) {
    log.warning('.env.production not found or empty');
    log.info('You will need to set environment variables in Railway/Render/Heroku');
    warnings++;
  } else {
    checkEnvVar(backendEnv, 'NODE_ENV', true);
    checkEnvVar(backendEnv, 'MONGODB_URI', true);
    checkEnvVar(backendEnv, 'JWT_SECRET', true);
    checkEnvVar(backendEnv, 'JWT_REFRESH_SECRET', true);
    checkEnvVar(backendEnv, 'FRONTEND_URL', true);
    checkEnvVar(backendEnv, 'CORS_ORIGIN', true);
    checkEnvVar(backendEnv, 'STRIPE_SECRET_KEY', true);
    checkEnvVar(backendEnv, 'CLOUDINARY_CLOUD_NAME', true);
    checkEnvVar(backendEnv, 'CLOUDINARY_API_KEY', true);
    checkEnvVar(backendEnv, 'CLOUDINARY_API_SECRET', true);
    checkEnvVar(backendEnv, 'SMTP_HOST', true);
    checkEnvVar(backendEnv, 'SMTP_USER', true);
    checkEnvVar(backendEnv, 'SMTP_PASS', true);
    checkEnvVar(backendEnv, 'REDIS_URL', false);
  }

  // Check deployment configuration files
  log.section('⚙️  Checking Deployment Configuration...');
  
  if (fileExists('health-care/vercel.json')) {
    log.success('vercel.json exists');
    passed++;
  } else {
    log.warning('vercel.json not found (optional)');
    warnings++;
  }
  
  if (fileExists('health-care/backend/Procfile')) {
    log.success('Procfile exists');
    passed++;
  } else {
    log.warning('Procfile not found (optional for Railway)');
    warnings++;
  }
  
  if (fileExists('health-care/backend/railway.json')) {
    log.success('railway.json exists');
    passed++;
  } else {
    log.warning('railway.json not found (optional)');
    warnings++;
  }

  // Check .gitignore
  log.section('🔒 Checking Security...');
  
  const gitignore = readFile('.gitignore');
  if (gitignore) {
    const hasEnv = gitignore.includes('.env');
    const hasEnvLocal = gitignore.includes('.env.local');
    const hasEnvProd = gitignore.includes('.env.production.local');
    
    if (hasEnv || hasEnvLocal || hasEnvProd) {
      log.success('.env files are in .gitignore');
      passed++;
    } else {
      log.error('.env files not in .gitignore - SECURITY RISK!');
      errors++;
    }
    
    if (gitignore.includes('node_modules')) {
      log.success('node_modules in .gitignore');
      passed++;
    } else {
      log.warning('node_modules not in .gitignore');
      warnings++;
    }
  } else {
    log.error('.gitignore not found');
    errors++;
  }

  // Check for sensitive data in code
  log.section('🔍 Checking for Sensitive Data...');
  
  const serverJs = readFile('health-care/backend/src/server.js');
  if (serverJs) {
    if (serverJs.includes('process.env')) {
      log.success('Using environment variables in server.js');
      passed++;
    } else {
      log.warning('No environment variables detected in server.js');
      warnings++;
    }
    
    // Check for hardcoded secrets (basic check)
    const suspiciousPatterns = [
      /mongodb\+srv:\/\/[^'"\s]+:[^'"\s]+@/i,
      /sk_live_[a-zA-Z0-9]+/,
      /sk_test_[a-zA-Z0-9]+/,
    ];
    
    let foundHardcoded = false;
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(serverJs)) {
        log.error('Potential hardcoded secret found in server.js!');
        errors++;
        foundHardcoded = true;
        break;
      }
    }
    
    if (!foundHardcoded) {
      log.success('No obvious hardcoded secrets in server.js');
      passed++;
    }
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    SUMMARY                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log(`${colors.green}✓ Passed:${colors.reset}   ${passed}`);
  console.log(`${colors.yellow}⚠ Warnings:${colors.reset} ${warnings}`);
  console.log(`${colors.red}✗ Errors:${colors.reset}   ${errors}\n`);

  if (errors === 0 && warnings === 0) {
    console.log(`${colors.green}🎉 Your project is ready for deployment!${colors.reset}\n`);
    console.log('Next steps:');
    console.log('  1. Review QUICK_DEPLOY_GUIDE.md');
    console.log('  2. Set up MongoDB Atlas');
    console.log('  3. Deploy backend to Railway/Render');
    console.log('  4. Deploy frontend to Vercel');
    console.log('  5. Configure Stripe webhooks\n');
    return 0;
  } else if (errors === 0) {
    console.log(`${colors.yellow}⚠️  Your project is mostly ready, but has some warnings.${colors.reset}\n`);
    console.log('Review the warnings above and fix if necessary.\n');
    return 0;
  } else {
    console.log(`${colors.red}❌ Your project has errors that need to be fixed before deployment.${colors.reset}\n`);
    console.log('Please fix the errors above and run this script again.\n');
    return 1;
  }
}

// Run the checks
runChecks().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  console.error('Error running checks:', error);
  process.exit(1);
});
