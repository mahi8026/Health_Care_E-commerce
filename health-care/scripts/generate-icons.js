/**
 * PWA Icon Generator
 * 
 * This script creates placeholder PWA icons until you provide actual brand assets.
 * 
 * To use:
 * 1. npm install sharp
 * 2. node scripts/generate-icons.js
 * 
 * For production icons:
 * - Use your actual logo file
 * - Visit https://www.pwabuilder.com/imageGenerator
 * - Upload logo and download icon pack
 * - Replace generated icons with downloaded ones
 */

const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes to generate
const sizes = [
  72, 96, 128, 144, 152, 192, 384, 512
];

// Generate SVG-based placeholder icons
function generatePlaceholderIcon(size, filename) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#0B2545"/>
  
  <!-- Medical cross -->
  <g transform="translate(${size/2}, ${size/2})">
    <rect x="${-size*0.08}" y="${-size*0.25}" width="${size*0.16}" height="${size*0.5}" fill="white" rx="${size*0.02}"/>
    <rect x="${-size*0.25}" y="${-size*0.08}" width="${size*0.5}" height="${size*0.16}" fill="white" rx="${size*0.02}"/>
  </g>
  
  <!-- Text -->
  <text x="${size/2}" y="${size*0.75}" 
        font-family="Arial, sans-serif" 
        font-size="${size*0.12}" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle">MedCore</text>
</svg>`;

  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`✓ Generated ${filename}`);
}

// Generate maskable icons (with safe zone padding)
function generateMaskableIcon(size, filename) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background (must be opaque for maskable icons) -->
  <rect width="${size}" height="${size}" fill="#0B2545"/>
  
  <!-- Content within safe zone (center 80%) -->
  <g transform="translate(${size/2}, ${size/2})">
    <!-- Medical cross (smaller for safe zone) -->
    <rect x="${-size*0.06}" y="${-size*0.18}" width="${size*0.12}" height="${size*0.36}" fill="white" rx="${size*0.015}"/>
    <rect x="${-size*0.18}" y="${-size*0.06}" width="${size*0.36}" height="${size*0.12}" fill="white" rx="${size*0.015}"/>
  </g>
  
  <!-- Text in safe zone -->
  <text x="${size/2}" y="${size*0.7}" 
        font-family="Arial, sans-serif" 
        font-size="${size*0.1}" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle">MedCore</text>
</svg>`;

  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`✓ Generated ${filename} (maskable)`);
}

// Generate shortcut icons
function generateShortcutIcon(name, emoji, color) {
  const size = 96;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${color}" rx="12"/>
  <text x="${size/2}" y="${size/2 + 12}" 
        font-size="40" 
        text-anchor="middle">${emoji}</text>
</svg>`;

  fs.writeFileSync(path.join(iconsDir, `shortcut-${name}.png.svg`), svg);
  console.log(`✓ Generated shortcut-${name}.png.svg`);
}

console.log('🎨 Generating PWA icons...\n');

// Generate standard icons
sizes.forEach(size => {
  generatePlaceholderIcon(size, `icon-${size}x${size}.png.svg`);
});

console.log('');

// Generate maskable icons
generateMaskableIcon(192, 'icon-192x192-maskable.png.svg');
generateMaskableIcon(512, 'icon-512x512-maskable.png.svg');

console.log('');

// Generate shortcut icons
generateShortcutIcon('products', '🛒', '#0B2545');
generateShortcutIcon('reagents', '🧪', '#0B2545');
generateShortcutIcon('b2b', '🏢', '#0B2545');
generateShortcutIcon('track', '📦', '#0B2545');

console.log('\n✅ All icons generated!');
console.log('\n⚠️  NOTE: These are PLACEHOLDER icons.');
console.log('For production, replace with actual brand assets.');
console.log('See PWA-ICON-GENERATION.md for instructions.\n');
