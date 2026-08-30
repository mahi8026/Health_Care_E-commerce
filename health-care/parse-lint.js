const fs = require('fs');
let data = fs.readFileSync(__dirname + '/lint-errors.json', 'utf8');
// Strip BOM
data = data.replace(/^\uFEFF/, '');
// Strip npm script header lines (lines starting with >)
data = data.replace(/^>.*$/gm, '');
// Trim whitespace and parse
data = data.trim();
// Find the JSON array
const startIdx = data.indexOf('[');
if (startIdx === -1) {
  console.log('No JSON array found in lint-errors.json');
  process.exit(1);
}
const json = JSON.parse(data.substring(startIdx));

// Group by error type with detailed messages
const errorTypes = {};
json.forEach(f => {
  const shortPath = f.filePath.replace(/.*\\src\\/, '');
  f.messages.forEach(m => {
    const ruleKey = m.ruleId || 'unknown';
    if (!errorTypes[ruleKey]) errorTypes[ruleKey] = { count: 0, files: new Set(), messages: [] };
    errorTypes[ruleKey].count++;
    errorTypes[ruleKey].files.add(shortPath);
    errorTypes[ruleKey].messages.push({
      file: shortPath,
      line: m.line,
      column: m.column,
      severity: m.severity,
      message: m.message.substring(0, 300),
    });
  });
});

console.log('=== DETAILED ERROR REPORT ===\n');
const severityMap = { 2: 'ERROR', 1: 'WARNING' };

Object.entries(errorTypes).sort((a, b) => b[1].count - a[1].count).forEach(([rule, info]) => {
  console.log('--- ' + rule + ' (' + info.count + ' occurrences in ' + info.files.size + ' files) ---');
  info.messages.forEach(m => {
    console.log('  [' + severityMap[m.severity] + '] ' + m.file + ':' + m.line + ':' + m.column);
    console.log('    ' + m.message.substring(0, 200).replace(/\n/g, ' '));
  });
  console.log('');
});
