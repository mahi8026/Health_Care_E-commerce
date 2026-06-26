/**
 * build-cf-fix.js
 *
 * Prepares the Cloudflare Pages _worker.js bundle.
 *
 * OpenNext builds:
 *   .open-next/worker.js           ← entry point (has dynamic imports to siblings)
 *   .open-next/assets/             ← static files
 *   .open-next/cloudflare/         ← worker deps
 *   .open-next/middleware/
 *   .open-next/server-functions/
 *   .open-next/.build/
 *
 * Cloudflare Pages _worker.js requirement:
 *   - Must be in the pages_build_output_dir (.open-next/assets/)
 *   - Must be a SINGLE self-contained file (no external imports)
 *     OR the sibling files must also be in pages_build_output_dir
 *
 * Strategy: Copy the entire .open-next/ tree INTO .open-next/assets/
 * so _worker.js and all its siblings are together in the output dir.
 */

const fs = require('fs');
const path = require('path');

const openNextDir = path.join(__dirname, '.open-next');
const assetsDir = path.join(openNextDir, 'assets');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// Directories inside .open-next/ that worker.js imports from
const workerDeps = ['cloudflare', 'middleware', 'server-functions', '.build'];

console.log('Preparing Cloudflare Pages _worker.js bundle...');

// Copy each worker dependency into .open-next/assets/
for (const dep of workerDeps) {
  const src = path.join(openNextDir, dep);
  const dest = path.join(assetsDir, dep);
  if (fs.existsSync(src)) {
    copyRecursive(src, dest);
    console.log(`  ✓ Copied .open-next/${dep}/ → .open-next/assets/${dep}/`);
  }
}

// Copy worker.js → assets/_worker.js
const workerSrc = path.join(openNextDir, 'worker.js');
const workerDest = path.join(assetsDir, '_worker.js');
if (fs.existsSync(workerSrc)) {
  fs.copyFileSync(workerSrc, workerDest);
  console.log('  ✓ Copied .open-next/worker.js → .open-next/assets/_worker.js');
} else {
  console.error('  ✗ ERROR: .open-next/worker.js not found!');
  process.exit(1);
}

// Write _routes.json to tell CF Pages which routes go to the Worker
// Without this, CF Pages serves static files directly and bypasses the Worker
const routesJson = {
  version: 1,
  include: ['/*'],
  exclude: [
    '/_next/static/*',
    '/images/*',
    '/fonts/*',
    '/icons/*',
    '/favicon.ico',
    '/manifest.json',
    '/sw.js',
    '/robots.txt',
    '/sitemap.xml',
  ],
};
fs.writeFileSync(
  path.join(assetsDir, '_routes.json'),
  JSON.stringify(routesJson, null, 2)
);
console.log('  ✓ Written .open-next/assets/_routes.json');

console.log('\n✅ Cloudflare Pages output ready in .open-next/assets/');
