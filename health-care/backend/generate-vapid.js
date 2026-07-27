/**
 * VAPID Key Generator for Push Notifications
 * 
 * Run this script ONCE to generate VAPID keys:
 * node generate-vapid.js
 * 
 * Then copy the output to:
 * - Backend: .env (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
 * - Frontend: .env.local (NEXT_PUBLIC_VAPID_PUBLIC_KEY)
 */

const webpush = require('web-push');

console.log('\n🔑 Generating VAPID Keys for Push Notifications...\n');

const keys = webpush.generateVAPIDKeys();

console.log('══════════════════════════════════════════════════════════════════');
console.log('BACKEND (.env) — Add these to health-care/backend/.env:');
console.log('══════════════════════════════════════════════════════════════════\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_EMAIL=mailto:mahimrahman07@gmail.com`);

console.log('\n══════════════════════════════════════════════════════════════════');
console.log('FRONTEND (.env.local) — Add this to health-care/.env.local:');
console.log('══════════════════════════════════════════════════════════════════\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);

console.log('\n══════════════════════════════════════════════════════════════════');
console.log('✅ VAPID keys generated successfully!');
console.log('══════════════════════════════════════════════════════════════════\n');
console.log('⚠️  IMPORTANT:');
console.log('   1. Copy the keys to .env files as shown above');
console.log('   2. Restart both backend and frontend servers');
console.log('   3. Keep these keys SECRET — never commit to Git');
console.log('   4. Use the same keys in production (Railway/Vercel env vars)');
console.log('\n');
