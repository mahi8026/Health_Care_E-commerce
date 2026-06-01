#!/usr/bin/env node

/**
 * Generate secure random secrets for JWT tokens
 * Run: node generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 Generating Secure Secrets for Production\n');
console.log('═'.repeat(60));

// Generate JWT Secret (64 bytes = 128 hex characters)
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('\n📝 JWT_SECRET:');
console.log(jwtSecret);

// Generate JWT Refresh Secret (64 bytes = 128 hex characters)
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
console.log('\n📝 JWT_REFRESH_SECRET:');
console.log(jwtRefreshSecret);

// Generate Session Secret (32 bytes = 64 hex characters)
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('\n📝 SESSION_SECRET (optional):');
console.log(sessionSecret);

console.log('\n' + '═'.repeat(60));
console.log('\n✅ Copy these values to your Render environment variables');
console.log('⚠️  NEVER commit these secrets to version control!\n');

// Also save to a file for reference (add to .gitignore)
const fs = require('fs');
const secretsFile = '.secrets.txt';

const content = `
# Generated Secrets - ${new Date().toISOString()}
# ⚠️ DO NOT COMMIT THIS FILE TO VERSION CONTROL
# Add this file to .gitignore

JWT_SECRET=${jwtSecret}
JWT_REFRESH_SECRET=${jwtRefreshSecret}
SESSION_SECRET=${sessionSecret}

# Instructions:
# 1. Copy these values to Render.com environment variables
# 2. Delete this file after copying
# 3. Never share these secrets
`;

fs.writeFileSync(secretsFile, content.trim());
console.log(`💾 Secrets also saved to: ${secretsFile}`);
console.log(`🗑️  Delete this file after copying to Render!\n`);
