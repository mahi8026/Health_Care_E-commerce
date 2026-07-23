const fs = require('fs');
const path = require('path');

// Replacement map (specific to most general)
const replacements = [
  { old: /MedCore Bangladesh Ltd\./g, new: 'Mediport Bangladesh Ltd.' },
  { old: /MedCore Bangladesh/g, new: 'Mediport Bangladesh' },
  { old: /MedCoreBD/g, new: 'MediportBD' },
  { old: /MedCore BD/g, new: 'MediportBD' },
  { old: /medcorebd\.com/g, new: 'mediportbd.com' },
  { old: /medcore-bd/g, new: 'mediport-bd' },
  { old: /medcorebd/g, new: 'mediportbd' },
  { old: /MedCore/g, new: 'Mediport' },
  { old: /medcore/g, new: 'mediport' },
  { old: /MEDCORE/g, new: 'MEDIPORT' }
];

// Files/dirs to exclude
const excludeDirs = ['node_modules', '.next', '.git', 'coverage', 'dist', 'build'];
const includeExts = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.html', '.css', '.txt', '.yml', '.yaml', '.env'];

let filesUpdated = 0;
let totalReplacements = 0;

function shouldProcessFile(filePath) {
  // Check exclude dirs
  for (const dir of excludeDirs) {
    if (filePath.includes(`${path.sep}${dir}${path.sep}`) || filePath.includes(`${path.sep}${dir}`)) {
      return false;
    }
  }
  // Check file extension
  const ext = path.extname(filePath);
  return includeExts.includes(ext) || filePath.endsWith('.env.example') || filePath.endsWith('.env.local');
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let replacementCount = 0;

    for (const { old, new: newText } of replacements) {
      const matches = (content.match(old) || []).length;
      if (matches > 0) {
        content = content.replace(old, newText);
        modified = true;
        replacementCount += matches;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesUpdated++;
      totalReplacements += replacementCount;
      console.log(`✓ ${filePath} (${replacementCount} replacements)`);
    }
  } catch (error) {
    console.log(`✗ Skipped: ${filePath} (${error.message})`);
  }
}

function walkDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Check if directory should be excluded
          if (!excludeDirs.includes(file)) {
            walkDir(filePath);
          }
        } else if (stat.isFile() && shouldProcessFile(filePath)) {
          processFile(filePath);
        }
      } catch (error) {
        // Skip files that can't be accessed
      }
    }
  } catch (error) {
    console.log(`✗ Cannot access directory: ${dir}`);
  }
}

console.log('Starting MedCore BD → MediportBD brand rename...\n');

// Process health-care directory (most important)
console.log('Processing health-care directory...');
walkDir('./health-care');

// Process docs directory
console.log('\nProcessing docs directory...');
walkDir('./docs');

console.log('\n' + '='.repeat(60));
console.log(`Brand rename complete!`);
console.log(`Files updated: ${filesUpdated}`);
console.log(`Total replacements: ${totalReplacements}`);
console.log('='.repeat(60));
