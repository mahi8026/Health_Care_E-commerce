const fs = require('fs');
const content = fs.readFileSync('C:\\Projects\\Health Care\\.kiro\\specs\\project-wide-optimization\\tasks.md', 'utf8');
const tasks = [];
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const match = line.match(/^\s*- \[([ x~-])\] (\d+\.\d+)/);
  if (match) {
    tasks.push({ 
      id: match[2], 
      status: match[1], 
      line: line.trim() 
    });
  }
}

const completed = tasks.filter(t => t.status === 'x');
const incomplete = tasks.filter(t => t.status === ' ' || t.status === '-');
const checkpoints = tasks.filter(t => t.status === '~');

console.log(`\n=== TASK SUMMARY ===`);
console.log(`Total: ${tasks.length}`);
console.log(`Completed: ${completed.length}`);
console.log(`Incomplete: ${incomplete.length}`);
console.log(`Checkpoints: ${checkpoints.length}`);

console.log(`\n=== NEXT 10 INCOMPLETE TASKS ===`);
incomplete.slice(0, 10).forEach(t => {
  const status = t.status === ' ' ? 'READY' : 'BLOCKED';
  console.log(`${t.id} [${status}]`);
});
