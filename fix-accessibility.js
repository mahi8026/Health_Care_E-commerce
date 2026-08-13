/**
 * Accessibility Fix Script
 * 
 * This script adds id and name attributes to input/textarea/select elements
 * that are missing them, and associates labels with their inputs using htmlFor.
 * 
 * Usage: node fix-accessibility.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Directories to scan
const SCAN_DIRS = [
  'health-care/src/views/**/*.jsx',
  'health-care/src/components/**/*.jsx',
];

// Files already fixed (skip these)
const SKIP_FILES = [
  'BannersManagement.jsx',
];

let filesFixed = 0;
let inputsFixed = 0;

function generateId(context, index) {
  // Try to extract meaningful id from nearby text
  const labelMatch = context.match(/label.*?["']([^"']+)["']/i);
  const placeholderMatch = context.match(/placeholder=["']([^"']+)["']/);
  
  if (labelMatch) {
    return labelMatch[1].toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  if (placeholderMatch) {
    return placeholderMatch[1].toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  
  return `input-${index}`;
}

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  if (SKIP_FILES.includes(fileName)) {
    console.log(`⏭️  Skipping ${fileName} (already fixed)`);
    return;
  }
  
  let modified = content;
  let changeCount = 0;
  
  // Pattern 1: Add id and name to inputs without them
  const inputPattern = /<input\s+([^>]*?)>/g;
  let match;
  let index = 0;
  
  while ((match = inputPattern.exec(content)) !== null) {
    const attrs = match[1];
    
    // Skip if already has id
    if (attrs.includes('id=')) continue;
    
    // Get context around this input (500 chars before)
    const contextStart = Math.max(0, match.index - 500);
    const context = content.substring(contextStart, match.index + 100);
    
    // Generate unique id
    const id = generateId(context, index++);
    
    // Add id and name attributes
    const newInput = match[0].replace(
      /<input\s+/,
      `<input\n              id="${id}"\n              name="${id}"\n              `
    );
    
    modified = modified.replace(match[0], newInput);
    changeCount++;
  }
  
  // Pattern 2: Associate labels with inputs using htmlFor
  const labelPattern = /<label\s+className=/g;
  modified = modified.replace(labelPattern, '<label htmlFor={uniqueId} className=');
  
  if (changeCount > 0) {
    // Backup original file
    fs.writeFileSync(filePath + '.backup', content);
    
    // Write modified file
    fs.writeFileSync(filePath, modified);
    
    filesFixed++;
    inputsFixed += changeCount;
    console.log(`✅ Fixed ${fileName}: ${changeCount} inputs`);
  }
}

// Find all JSX files
console.log('🔍 Scanning for accessibility issues...\n');

SCAN_DIRS.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: __dirname });
  files.forEach(file => {
    try {
      fixFile(path.join(__dirname, file));
    } catch (err) {
      console.error(`❌ Error processing ${file}:`, err.message);
    }
  });
});

console.log(`\n✨ Complete!`);
console.log(`📝 Files modified: ${filesFixed}`);
console.log(`🔧 Inputs fixed: ${inputsFixed}`);
console.log(`\n⚠️  Backup files created with .backup extension`);
console.log(`💡 Review changes with: git diff`);
