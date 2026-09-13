/**
 * merchant-gaps-report.js — read-only companion to audit-retail-seo.js.
 * Turns the audit's no-price / no-image / out-of-stock flags into a
 * per-merchant action list (CSV + console) for the ops team.
 *   node scripts/merchant-gaps-report.js [auditJsonPath]
 */
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const auditPath = process.argv[2]
  || fs.readdirSync(dataDir).filter((f) => f.startsWith('retail-seo-audit-') && f.endsWith('.json')).sort().pop();
if (!auditPath) { console.error('No audit file found in', dataDir); process.exit(1); }

const audit = JSON.parse(fs.readFileSync(path.resolve(dataDir, auditPath), 'utf8'));
const rows = [];
for (const flag of ['noPrice', 'missingImage', 'outOfStock']) {
  for (const p of audit[flag] || []) {
    rows.push({
      flag,
      name: p.name,
      slug: p.slug,
      brand: p.brand || '-',
      category: p.category || '-',
      sku: p.sku || '-',
      price: p.price ?? '',
      stock: p.stock ?? '',
      viewCount: p.viewCount ?? 0,
      soldCount: p.soldCount ?? 0,
    });
  }
}
rows.sort((a, b) => (b.viewCount + b.soldCount * 10) - (a.viewCount + a.soldCount * 10));

const out = path.join(dataDir, `merchant-gaps-${audit.generatedAt.slice(0, 10)}.csv`);
const header = 'flag,brand,category,sku,name,price,stock,views,sold,slug';
const csv = [header, ...rows.map((r) => [r.flag, r.brand, r.category, r.sku,
  `"${String(r.name).replace(/"/g, '""')}"`, r.price, r.stock, r.viewCount, r.soldCount, r.slug].join(','))].join('\n');
fs.writeFileSync(out, csv, 'utf8');

console.log(`Audit: ${auditPath}`);
console.log(`Priority-ordered action rows: ${rows.length}  (high-traffic first)\n`);
for (const r of rows.slice(0, 15)) {
  console.log(`[${r.flag}] ${r.brand} — ${r.name}`);
  console.log(`    views=${r.viewCount} sold=${r.soldCount} price=${r.price || '—'} slug=${r.slug}`);
}
if (rows.length > 15) console.log(`… and ${rows.length - 15} more`);
console.log(`\nFull list written: ${out}`);
