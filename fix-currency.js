/**
 * Node.js script to fix Bengali Taka currency symbol encoding
 * Replaces corrupted UTF-8 encoding with proper symbol
 */

const fs = require('fs');
const path = require('path');

const CORRUPTED_SYMBOL = 'à§³';  // Corrupted UTF-8
const CORRECT_SYMBOL = '৳';       // Bengali Taka (U+09F3)

let totalFiles = 0;
let totalReplacements = 0;

function fixFile(filePath) {
  try {
    // Read file as UTF-8
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file contains corrupted symbol
    if (content.includes(CORRUPTED_SYMBOL)) {
      // Count occurrences
      const matches = content.match(new RegExp(CORRUPTED_SYMBOL, 'g'));
      const count = matches ? matches.length : 0;
      
      // Replace all occurrences
      const newContent = content.replaceAll(CORRUPTED_SYMBOL, CORRECT_SYMBOL);
      
      // Write back with UTF-8 encoding
      fs.writeFileSync(filePath, newContent, 'utf8');
      
      console.log(`✓ Fixed ${count} occurrence(s) in: ${path.basename(filePath)}`);
      totalFiles++;
      totalReplacements += count;
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function walkDir(dir, filePattern = /\.(jsx?|tsx?)$/) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walkDir(filePath, filePattern);
      }
    } else if (filePattern.test(file)) {
      fixFile(filePath);
    }
  });
}

console.log('===============================================');
console.log('  Fix Bengali Taka Symbol Encoding');
console.log('  Replacing corrupted à§³ with proper ৳');
console.log('===============================================\n');

// Start from health-care/src directory
const srcDir = path.join(__dirname, 'health-care', 'src');

if (fs.existsSync(srcDir)) {
  walkDir(srcDir);
  
  console.log('\n===============================================');
  console.log(`  Summary`);
  console.log('===============================================');
  console.log(`Files modified: ${totalFiles}`);
  console.log(`Total replacements: ${totalReplacements}`);
  console.log('===============================================\n');
  
  if (totalFiles > 0) {
    console.log('✓ Currency symbol encoding fixed successfully!\n');
    console.log('Next steps:');
    console.log('1. Test the application: cd health-care && npm run dev');
    console.log('2. Verify ৳ displays correctly in browser');
    console.log('3. Commit changes: git add . && git commit -m "fix: correct Bengali Taka symbol UTF-8 encoding"');
  } else {
    console.log('✓ No corrupted symbols found. All files are clean!');
  }
} else {
  console.error(`✗ Directory not found: ${srcDir}`);
  process.exit(1);
}
