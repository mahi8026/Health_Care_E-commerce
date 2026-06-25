/**
 * build-cf-fix.js
 *
 * OpenNext builds to .open-next/ with this structure:
 *   .open-next/worker.js                        ← main Worker entry
 *   .open-next/cloudflare/                      ← Worker dependencies
 *   .open-next/middleware/                      ← middleware handler
 *   .open-next/server-functions/default/        ← SSR handler
 *   .open-next/.build/durable-objects/          ← durable object handlers
 *   .open-next/assets/                          ← static files
 *
 * Cloudflare Pages expects:
 *   <output_dir>/_worker.js                     ← Worker entry point
 *   <output_dir>/cloudflare/                    ← Worker dependencies (must be siblings)
 *   <output_dir>/middleware/
 *   <output_dir>/server-functions/
 *   <output_dir>/.build/
 *   <output_dir>/<static files>
 *
 * So we need to copy ALL of .open-next/ (except assets/) INTO assets/,
 * and rename worker.js → _worker.js
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

// Directories/files inside .open-next/ to copy into assets/
// (skip 'assets' itself to avoid infinite recursion)
const items = fs.readdirSync(openNextDir).filter(item => item !== 'assets');

for (const item of items) {
  const src = path.join(openNextDir, item);
  const dest = path.join(assetsDir, item);
  console.log(`Copying .open-next/${item} → .open-next/assets/${item}`);
  copyRecursive(src, dest);
}

// Rename worker.js → _worker.js (Cloudflare Pages convention)
const workerSrc = path.join(assetsDir, 'worker.js');
const workerDest = path.join(assetsDir, '_worker.js');
if (fs.existsSync(workerSrc)) {
  fs.renameSync(workerSrc, workerDest);
  console.log('Renamed assets/worker.js → assets/_worker.js');
}

console.log('✅ Cloudflare Pages output prepared in .open-next/assets/');
