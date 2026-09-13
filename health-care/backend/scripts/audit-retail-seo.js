/**
 * audit-retail-seo.js
 *
 * Reads the ACTIVE retail catalog from the public products API and surfaces
 * data-quality gaps that block retail rankings & rich results (see
 * RETAIL_SEO_AUDIT_2026_09_13.md, P0 #2):
 *   • no-price            — no Offer, no price SERP snippet (the 0.00 rich-result bug)
 *   • thin-desc           — < 80 chars / < 20 words; can't rank, feeds "not indexed"
 *   • vendor-dump         — pasted spec-sheet copy (Origin China / Product Spec...)
 *   • out-of-stock        — noindex candidate or BackOrder cleanup
 *   • no-image / no-slug  — no gallery / not canonically indexable
 *   • has-rating          — AggregateRating + review rich-result candidates
 *
 * READ-ONLY: makes NO writes to the database. Outputs a Markdown report and a
 * raw JSON dump (for cross-referencing against GSC exports in a spreadsheet).
 *
 * Usage (from backend/):
 *   node scripts/audit-retail-seo.js                    # production default
 *   API_BASE=https://your-api/api node scripts/audit-retail-seo.js
 */

const fs = require('fs');
const path = require('path');

const API_BASE = (process.env.API_BASE || 'https://health-care-e-commerce-ubyy.onrender.com/api').replace(/\/+$/, '');
const PAGE_LIMIT = 100;          // products per page request
const MAX_PAGES = 200;           // hard safety cap on pages scanned
const MAX_RETRIES = 3;           // backend cold starts can take 10-20s
const MAX_PRIORITY_ROWS = 60;    // rows per section in the Markdown report

const THIN_DESC_MIN_CHARS = 80;
const THIN_DESC_MIN_WORDS = 20;
const VENDOR_DUMP_RE = /(Place of Origin|Product Specification|Product Name|Origin\s*\n?\s*[A-Za-z]*\s*China|Features\s*$)/i;

/** Collapse whitespace in a description for length/pattern checks. */
function descClean(d) {
  return typeof d === 'string' ? d.replace(/\s+/g, ' ').trim() : '';
}

/** Parse a price that may be number, numeric string, or junk → NaN when unusable. */
function parsePrice(p) {
  if (typeof p === 'number') {
return Number.isFinite(p) ? p : NaN;
}
  if (typeof p === 'string' && p.trim() !== '') {
    const v = parseFloat(p);
    return Number.isFinite(v) ? v : NaN;
  }
  return NaN;
}

async function retryableFetch(url) {
  let attempts = 0;
  while (attempts < MAX_RETRIES) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: undefined,
      });
      if (!res.ok) {
throw new Error(`HTTP ${res.status}`);
}
      return await res.json();
    } catch (err) {
      attempts += 1;
      if (attempts >= MAX_RETRIES) {
throw err;
}
      // Backend on Render free tier cold-starts on demand — back off between retries.
      await new Promise((r) => setTimeout(r, 5000 * attempts));
    }
  }
}

/** Page through /api/products until the last page. */
async function fetchAllProducts() {
  const products = [];
  let page = 1;
  let total = null;

  while (page <= MAX_PAGES) {
    const url = `${API_BASE}/products?limit=${PAGE_LIMIT}&page=${page}`;
    const body = await retryableFetch(url);
    if (!body || body.success !== true) {
throw new Error('API returned an error envelope');
}

    const data = body.data || [];
    const pag = body.pagination || {};
    total = pag.total;
    products.push(...data);

    const hasNext = pag.hasNext === true || page < Math.ceil((pag.total || 0) / (pag.limit || PAGE_LIMIT));
    if (!hasNext || data.length === 0) {
break;
}
    page += 1;
  }

  return { products, total, pagesFetched: page };
}

function hasImages(imgs) {
  return Array.isArray(imgs) && imgs.length > 0;
}

/** Classify a single product against retail-quality flags. */
function analyze(product) {
  const price = parsePrice(product.price);
  const desc = descClean(product.description);
  const imgs = product.images;
  const brand = (typeof product.brand === 'object') ? product.brand?.name : product.brand;
  const cat = (typeof product.category === 'object') ? product.category?.name : product.category;
  const rating = product.rating;

  const outOfStock = product.isOutOfStock === true
    || (typeof product.stock === 'number' && product.stock <= 0);

  const hasRating = !!(rating
    && Number(rating.average || rating) > 0
    && Number(rating.count || 0) > 0);

  const isVendorDump = desc.length >= 150 && VENDOR_DUMP_RE.test(desc);
  const isThin = desc.length < THIN_DESC_MIN_CHARS || desc.split(/\s+/).length < THIN_DESC_MIN_WORDS;

  const flags = [];
  if (!Number.isFinite(price) || price <= 0) {
flags.push('no-price');
}
  if (isThin) {
flags.push('thin-desc');
}
  if (isVendorDump) {
flags.push('vendor-dump');
}
  if (outOfStock) {
flags.push('out-of-stock');
}
  if (!hasImages(imgs)) {
flags.push('no-image');
}
  if (!product.slug) {
flags.push('no-slug');
}
  if (hasRating) {
flags.push('has-rating');
}

  return {
    id: product._id,
    name: product.name,
    slug: product.slug,
    url: product.slug ? `https://www.mediportbd.com/products/${product.slug}` : null,
    brand,
    category: cat || 'Uncategorised',
    price: Number.isFinite(price) ? price : null,
    stock: product.stock,
    sku: product.sku,
    imageCount: hasImages(imgs) ? imgs.length : 0,
    descLen: desc.length,
    viewCount: product.viewCount || 0,
    soldCount: product.soldCount || 0,
    flags,
  };
}

// ---------------------------------------------------------------------------
// Reporting helpers
// ---------------------------------------------------------------------------

function byPopularity(list) {
  return [...list].sort((a, b) => (b.viewCount + b.soldCount) - (a.viewCount + a.soldCount));
}

function flagCounts(items) {
  const counts = {};
  for (const item of items) {
    for (const f of item.flags) {
counts[f] = (counts[f] || 0) + 1;
}
  }
  return counts;
}

function categoryBreaks(items, flag) {
  const map = {};
  for (const item of items) {
    if (item.flags.includes(flag)) {
map[item.category] = (map[item.category] || 0) + 1;
}
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

function pad(s, n) {
  const str = String(s ?? '');
  return str.length > n ? str.slice(0, n - 1) + '…' : str.padEnd(n, ' ');
}

/** Render a Markdown table for a list of analyzed products. */
function markdownTable(items, columns) {
  if (items.length === 0) {
return '_None_';
}
  const head = columns.map((c) => `| ${c.label} `).join('') + '|';
  const sep = columns.map(() => '| --- ').join('') + '|';
  const rows = items.map((it) => `${columns.map((c) => `| ${c.render(it)} `).join('')}|`);
  return [head, sep, ...rows].join('\n');
}

/** Write a Markdown report + raw JSON dump next to the existing data dumps. */
function writeOutputs(mdText, jsonObj) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(outDir)) {
fs.mkdirSync(outDir, { recursive: true });
}
  const mdPath = path.join(outDir, `retail-seo-audit-${ts}.md`);
  const jsonPath = path.join(outDir, `retail-seo-audit-${ts}.json`);
  fs.writeFileSync(mdPath, mdText);
  fs.writeFileSync(jsonPath, JSON.stringify(jsonObj, null, 2));
  return { mdPath, jsonPath };
}

function summarize(flagCountsObj, total) {
  const lines = [`Total active products fetched: ${total}`, 'Flag counts (a product may carry several):'];
  for (const [flag, n] of Object.entries(flagCountsObj).sort((a, b) => b[1] - a[1])) {
    lines.push(`  • ${flag}: ${n}`);
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Fetching active products from ${API_BASE} ...`);
  const { products, total, pagesFetched } = await fetchAllProducts();
  console.log(`Fetched ${products.length} products across ${pagesFetched} page(s).`);

  const analyzed = products.map(analyze).filter((p) => p.flags.length > 0);
  const by = (flag) => byPopularity(analyzed.filter((p) => p.flags.includes(flag)));

  const noPrice = by('no-price');
  const thinDesc = by('thin-desc');
  const vendorDump = by('vendor-dump');
  const outOfStock = by('out-of-stock').filter((p) => !p.flags.includes('no-price') && !p.flags.includes('thin-desc'));
  const missingImage = by('no-image');
  const missingSlug = by('no-slug');

  const fCounts = flagCounts(analyzed);
  const report = {
    generatedAt: new Date().toISOString(),
    apiBase: API_BASE,
    totalProducts: total,
    fetched: products.length,
    pagesFetched,
    flagCounts: fCounts,
    categoryNoPrice: categoryBreaks(analyzed, 'no-price'),
    categoryThinDesc: categoryBreaks(analyzed, 'thin-desc'),
    noPrice: noPrice.slice(0, MAX_PRIORITY_ROWS),
    thinDesc: thinDesc.slice(0, MAX_PRIORITY_ROWS),
    vendorDump: vendorDump.slice(0, MAX_PRIORITY_ROWS),
    outOfStock: outOfStock.slice(0, MAX_PRIORITY_ROWS),
    missingImage: missingImage.slice(0, MAX_PRIORITY_ROWS),
    missingSlug: missingSlug.slice(0, MAX_PRIORITY_ROWS),
  };

  const L = (it, n) => (it.url ? `[${pad(it.name, n)}](${it.url})` : pad(it.name, n));
  const md = [];
  md.push('# Retail SEO Catalog Audit');
  md.push('');
  md.push(`> Read-only scan of **${total}** active products from \`${API_BASE}\` — prioritised by popularity (views + sales). Companion to \`RETAIL_SEO_AUDIT_2026_09_13.md\` (P0 #2).`);
  md.push('');
  md.push('## Summary');
  md.push('');
  for (const [flag, n] of Object.entries(fCounts).sort((a, b) => b[1] - a[1])) {
md.push(`- **${flag}**: ${n}`);
}
  md.push('');
  md.push('## Null / zero price (no Offer, no price SERP snippet)');
  md.push('');
  md.push(markdownTable(report.noPrice, [
    { label: 'Product', render: (it) => L(it, 40) },
    { label: 'Brand', render: (it) => pad(it.brand, 16) },
    { label: 'Category', render: (it) => pad(it.category, 20) },
    { label: 'Stock', render: (it) => pad(it.stock, 6) },
    { label: 'Views', render: (it) => it.viewCount },
  ]));
  md.push('');
  md.push('## Thin descriptions (< 80 chars)');
  md.push('');
  md.push(markdownTable(report.thinDesc, [
    { label: 'Product', render: (it) => L(it, 40) },
    { label: 'Len', render: (it) => it.descLen },
    { label: 'Category', render: (it) => pad(it.category, 20) },
  ]));
  md.push('');
  md.push(`## Out of stock (${report.outOfStock.length})`);
  md.push('');
  md.push(markdownTable(report.outOfStock, [
    { label: 'Product', render: (it) => L(it, 40) },
    { label: 'Stock', render: (it) => it.stock },
    { label: 'Brand', render: (it) => pad(it.brand, 16) },
  ]));
  md.push('');
  md.push('## Missing image');
  md.push('');
  md.push(markdownTable(report.missingImage, [
    { label: 'Product', render: (it) => L(it, 40) },
    { label: 'Category', render: (it) => pad(it.category, 20) },
  ]));
  md.push('');
  md.push('## Missing slug (not canonically indexable)');
  md.push('');
  md.push(markdownTable(report.missingSlug, [
    { label: 'Product', render: (it) => it.name },
    { label: 'ID', render: (it) => it.id },
  ]));
  md.push('');
  md.push('## Category breakdown — no-price');
  md.push('');
  md.push(markdownTable(report.categoryNoPrice.map((c) => ({ name: c[0], n: c[1] })), [
    { label: 'Category', render: (it) => it.name },
    { label: 'Count', render: (it) => it.n },
  ]));

  const { mdPath, jsonPath } = writeOutputs(md.join('\n'), report);

  console.log('');
  console.log(summarize(fCounts, total));
  console.log('');
  console.log('Reports written:');
  console.log(`  ${mdPath}`);
  console.log(`  ${jsonPath}`);
}

main().catch((err) => {
  console.error('Audit failed:', err.message);
  process.exit(1);
});