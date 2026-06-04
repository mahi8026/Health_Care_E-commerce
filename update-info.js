#!/usr/bin/env node

/**
 * Automated Real Information Updater for MedCore BD
 * 
 * This script helps update placeholder information across the entire project.
 * 
 * Usage:
 *   node update-info.js
 * 
 * Follow the prompts to enter your real information, and the script will
 * update all necessary files automatically.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${prompt}${colors.reset}`, (answer) => {
      resolve(answer.trim());
    });
  });
}

// File paths
const FILES = {
  apiConstants: path.join(__dirname, 'health-care', 'src', 'constants', 'api.js'),
  seoConfig: path.join(__dirname, 'health-care', 'src', 'config', 'seo.js'),
  envLocal: path.join(__dirname, 'health-care', '.env.local'),
  envProduction: path.join(__dirname, 'health-care', '.env.production'),
  backendEnv: path.join(__dirname, 'health-care', 'backend', '.env'),
};

// Backup function
function backupFile(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup`;
    fs.copyFileSync(filePath, backupPath);
    log(`✓ Backed up: ${path.basename(filePath)} → ${path.basename(backupPath)}`, 'green');
  }
}

// Update functions
function updateApiConstants(data) {
  const filePath = FILES.apiConstants;
  if (!fs.existsSync(filePath)) {
    log(`✗ File not found: ${filePath}`, 'red');
    return false;
  }

  backupFile(filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  // Update CONTACT object
  content = content.replace(
    /whatsapp: process\.env\.NEXT_PUBLIC_WHATSAPP_NUMBER \|\| '[^']+'/,
    `whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '${data.whatsapp}'`
  );
  content = content.replace(
    /phone: '[^']+'/,
    `phone: '${data.phone}'`
  );
  content = content.replace(
    /email: '[^']+'/,
    `email: '${data.email}'`
  );
  content = content.replace(
    /supportEmail: '[^']+'/,
    `supportEmail: '${data.supportEmail}'`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  log(`✓ Updated: ${path.basename(filePath)}`, 'green');
  return true;
}

function updateSeoConfig(data) {
  const filePath = FILES.seoConfig;
  if (!fs.existsSync(filePath)) {
    log(`✗ File not found: ${filePath}`, 'red');
    return false;
  }

  backupFile(filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  // Update SITE_CONFIG
  if (data.companyName) {
    content = content.replace(
      /name:\s+'[^']+',\s+\/\/ MedCore BD/,
      `name:         '${data.companyName}',`
    );
  }
  if (data.companyFullName) {
    content = content.replace(
      /fullName:\s+'[^']+',/,
      `fullName:     '${data.companyFullName}',`
    );
  }
  if (data.siteUrl) {
    content = content.replace(
      /url:\s+process\.env\.NEXT_PUBLIC_SITE_URL \|\| '[^']+'/,
      `url:          process.env.NEXT_PUBLIC_SITE_URL || '${data.siteUrl}'`
    );
  }
  if (data.phone) {
    content = content.replace(
      /phone:\s+'[^']+',/,
      `phone:        '${data.phone}',`
    );
  }
  if (data.email) {
    content = content.replace(
      /email:\s+'[^']+',/,
      `email:        '${data.email}',`
    );
  }
  if (data.street) {
    content = content.replace(
      /street:\s+'[^']+',/,
      `street:     '${data.street}',`
    );
  }
  if (data.city) {
    content = content.replace(
      /city:\s+'[^']+',/,
      `city:       '${data.city}',`
    );
  }
  if (data.postalCode) {
    content = content.replace(
      /postalCode: '[^']+'/,
      `postalCode: '${data.postalCode}'`
    );
  }
  if (data.facebook) {
    content = content.replace(
      /https:\/\/www\.facebook\.com\/medcorebd/,
      data.facebook
    );
  }
  if (data.linkedin) {
    content = content.replace(
      /https:\/\/www\.linkedin\.com\/company\/medcorebd/,
      data.linkedin
    );
  }
  if (data.twitter) {
    content = content.replace(
      /twitterHandle: '@medcorebd'/,
      `twitterHandle: '${data.twitter}'`
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  log(`✓ Updated: ${path.basename(filePath)}`, 'green');
  return true;
}

function updateEnvFile(filePath, data, isProduction = false) {
  backupFile(filePath);
  
  let content = '';
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf8');
  }

  const updates = {
    'NEXT_PUBLIC_SITE_URL': data.siteUrl || 'https://medcorebd.com',
    'NEXT_PUBLIC_WHATSAPP_NUMBER': data.whatsapp || '8801646886795',
    'NEXT_PUBLIC_PHONE': data.phone || '+880 1646-886795',
    'NEXT_PUBLIC_EMAIL': data.email || 'info@medcorebd.com',
  };

  if (isProduction && data.apiUrl) {
    updates['NEXT_PUBLIC_API_URL'] = data.apiUrl;
  }

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (content.match(regex)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(filePath, content.trim() + '\n', 'utf8');
  log(`✓ Updated: ${path.basename(filePath)}`, 'green');
  return true;
}

function updateBackendEnv(data) {
  const filePath = FILES.backendEnv;
  if (!fs.existsSync(filePath)) {
    log(`✗ File not found: ${filePath}`, 'yellow');
    return false;
  }

  backupFile(filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  const updates = {
    'COMPANY_NAME': data.companyFullName,
    'COMPANY_EMAIL': data.email,
    'COMPANY_PHONE': data.phone,
    'COMPANY_ADDRESS': data.fullAddress,
    'WHATSAPP_BUSINESS_PHONE': data.whatsapp,
  };

  for (const [key, value] of Object.entries(updates)) {
    if (value) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (content.match(regex)) {
        content = content.replace(regex, `${key}=${value}`);
      } else {
        content += `\n${key}=${value}`;
      }
    }
  }

  fs.writeFileSync(filePath, content.trim() + '\n', 'utf8');
  log(`✓ Updated: ${path.basename(filePath)}`, 'green');
  return true;
}

// Main interactive flow
async function main() {
  log('\n╔════════════════════════════════════════════════════════╗', 'bright');
  log('║   MedCore BD - Real Information Updater              ║', 'bright');
  log('╚════════════════════════════════════════════════════════╝\n', 'bright');

  log('This script will update placeholder information across your project.', 'cyan');
  log('Press Ctrl+C at any time to cancel.\n', 'yellow');

  const data = {};

  // Collect information
  log('\n📞 CONTACT INFORMATION', 'bright');
  log('═══════════════════════\n', 'bright');

  data.phone = await question('Main phone number (e.g., +880 1XXX-XXXXXX): ');
  data.whatsapp = await question('WhatsApp number (e.g., 8801XXXXXXXXX): ');
  data.email = await question('Main email address: ');
  data.supportEmail = await question('Support email address: ');

  log('\n🏢 COMPANY INFORMATION', 'bright');
  log('═══════════════════════\n', 'bright');

  data.companyName = await question('Company short name (e.g., MedCore BD): ');
  data.companyFullName = await question('Company full name: ');
  
  log('\n📍 ADDRESS', 'bright');
  log('═══════════\n', 'bright');

  data.street = await question('Street address: ');
  data.city = await question('City: ');
  data.postalCode = await question('Postal code: ');
  data.fullAddress = `${data.street}, ${data.city} ${data.postalCode}, Bangladesh`;

  log('\n🌐 WEBSITE & DOMAIN', 'bright');
  log('═══════════════════\n', 'bright');

  data.siteUrl = await question('Website URL (e.g., https://yourcompany.com): ');
  const hasBackend = await question('Do you have a separate backend URL? (y/n): ');
  if (hasBackend.toLowerCase() === 'y') {
    data.apiUrl = await question('Backend API URL: ');
  }

  log('\n📱 SOCIAL MEDIA', 'bright');
  log('═══════════════\n', 'bright');

  data.facebook = await question('Facebook page URL: ');
  data.linkedin = await question('LinkedIn page URL: ');
  data.twitter = await question('Twitter handle (e.g., @yourcompany): ');

  // Confirm before updating
  log('\n\n📋 SUMMARY OF CHANGES', 'bright');
  log('═══════════════════════\n', 'bright');

  log(`Company Name:     ${data.companyName}`, 'cyan');
  log(`Phone:            ${data.phone}`, 'cyan');
  log(`WhatsApp:         ${data.whatsapp}`, 'cyan');
  log(`Email:            ${data.email}`, 'cyan');
  log(`Website:          ${data.siteUrl}`, 'cyan');
  log(`Address:          ${data.fullAddress}`, 'cyan');

  const confirm = await question('\n\nProceed with updates? (yes/no): ');
  
  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    log('\n✗ Update cancelled.', 'yellow');
    rl.close();
    return;
  }

  // Perform updates
  log('\n\n🔄 UPDATING FILES', 'bright');
  log('═══════════════════\n', 'bright');

  let successCount = 0;
  let totalFiles = 0;

  totalFiles++;
  if (updateApiConstants(data)) successCount++;

  totalFiles++;
  if (updateSeoConfig(data)) successCount++;

  totalFiles++;
  if (updateEnvFile(FILES.envLocal, data, false)) successCount++;

  totalFiles++;
  if (updateEnvFile(FILES.envProduction, data, true)) successCount++;

  totalFiles++;
  if (updateBackendEnv(data)) successCount++;

  // Summary
  log('\n\n✅ UPDATE COMPLETE', 'bright');
  log('═══════════════════\n', 'bright');

  log(`Successfully updated ${successCount}/${totalFiles} files`, 'green');
  log('\nBackup files created with .backup extension', 'yellow');
  
  log('\n\n📝 NEXT STEPS:', 'bright');
  log('═══════════════\n', 'bright');
  log('1. Review the changes in updated files', 'cyan');
  log('2. Test the application locally', 'cyan');
  log('3. Upload your logo files to health-care/public/images/', 'cyan');
  log('4. Commit and deploy to production', 'cyan');
  log('5. Set up external services (Google Analytics, Cloudinary, etc.)', 'cyan');
  
  log('\n\n💡 TIP:', 'yellow');
  log('Run "git diff" to see all changes before committing.', 'yellow');
  log('\nIf you need to revert changes, restore from .backup files.\n', 'yellow');

  rl.close();
}

// Run the script
main().catch((error) => {
  log(`\n✗ Error: ${error.message}`, 'red');
  rl.close();
  process.exit(1);
});
