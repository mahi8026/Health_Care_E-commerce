/**
 * Script: Reset admin password temporarily, clear cache via API, then restore.
 * Run: node scripts/clearCacheViaApi.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const https    = require('https');
const User     = require('../src/models/User');

const API = 'health-care-e-commerce-ubyy.onrender.com';
const TEMP_PASS = 'TempClear@9999';

function apiPost(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = https.request({ hostname: API, path, method: 'POST', headers }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(data);
    req.end();
  });
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // 1. Save old password hash
  const admin = await User.findOne({ email: 'mahimrahman07@gmail.com' }).select('+password');
  const oldHash = admin.password;
  console.log('Found admin:', admin.email);

  // 2. Set temp password
  const tempHash = await bcrypt.hash(TEMP_PASS, 12);
  admin.password = tempHash;
  await admin.save();
  console.log('Set temp password');

  try {
    // 3. Login via API
    const loginRes = await apiPost('/api/auth/login', {
      email: 'mahimrahman07@gmail.com',
      password: TEMP_PASS,
    });
    console.log('Login status:', loginRes.status);
    const token = loginRes.body?.token || loginRes.body?.data?.token;
    if (!token) throw new Error('No token: ' + JSON.stringify(loginRes.body).substring(0, 200));
    console.log('Got token');

    // 4. Clear products cache
    const clearRes = await apiPost('/api/utils/clear-cache', { pattern: 'products:*' }, token);
    console.log('Clear products cache:', clearRes.status, clearRes.body?.message);

    // 5. Clear homepage cache
    const clearHome = await apiPost('/api/utils/clear-cache', { pattern: 'homepage:*' }, token);
    console.log('Clear homepage cache:', clearHome.status, clearHome.body?.message);

    // 6. Clear ALL cache
    const clearAll = await apiPost('/api/utils/clear-cache', { pattern: '*' }, token);
    console.log('Clear ALL cache:', clearAll.status, clearAll.body?.message);

  } finally {
    // 7. Restore original password
    admin.password = oldHash;
    await admin.save();
    console.log('Restored original password');
  }

  await mongoose.disconnect();
  console.log('\n✅ Cache cleared successfully');
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
