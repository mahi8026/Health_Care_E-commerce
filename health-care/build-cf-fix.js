/**
 * build-cf-fix.js
 *
 * Prepares the Cloudflare Pages output directory.
 *
 * OpenNext builds to .open-next/ with:
 *   .open-next/worker.js                          ← Worker entry (references siblings)
 *   .open-next/cloudflare/                        ← Worker deps
 *   .open-next/middleware/                        ← middleware handler
 *   .open-next/server-functions/default/          ← SSR handler
 *   .open-next/.build/durable-objects/            ← durable objects
 *   .open-next/assets/                            ← static files (_next/, public files)
 *
 * Cloudflare Pages with _worker.js support expects the output dir to contain:
 *   <output>/_worker.js      ← Worker entry
 *   <output>/cloudflare/     ← sibling deps (same level as _worker.js)
 *   <output>/middleware/
 *   <output>/server-functions/
 *   <output>/.build/
 *   <output>/<static files>  ← _next/, images, etc. also at root
 *
 * Strategy: use .open-next/ as the Pages output dir (not .open-next/assets/).
 * Copy static assets UP from .open-next/assets/ to .open-next/, 
 * and rename worker.js → _worker.js at .open-next/ root.
 */

const fs = require('fs');
const path = require('path');

const openNextDir = path.join(__dirname, '.open-next');
const assetsDir = path.join(openNextDir, 'assets');

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Step 1: Copy static assets from .open-next/assets/ UP to .open-next/
console.log('Copying static assets from .open-next/assets/ → .open-next/...');
if (fs.existsSync(assetsDir)) {
  for (const item of fs.readdirSync(assetsDir)) {
    const src = path.join(assetsDir, item);
    const dest = path.join(openNextDir, item);
    // Don't overwrite Worker deps (cloudflare/, middleware/, etc.)
    if (!fs.existsSync(dest)) {
      copyRecursive(src, dest);
      console.log(`  Copied: assets/${item} → .open-next/${item}`);
    }
  }
}

// Step 2: Rename worker.js → _worker.js at .open-next/ root
const workerSrc = path.join(openNextDir, 'worker.js');
const workerDest = path.join(openNextDir, '_worker.js');
if (fs.existsSync(workerSrc) && !fs.existsSync(workerDest)) {
  fs.renameSync(workerSrc, workerDest);
  console.log('Renamed .open-next/worker.js → .open-next/_worker.js');
}

console.log('✅ Cloudflare Pages output prepared in .open-next/');
