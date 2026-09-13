/**
 * rewrite-thin-descriptions.js
 *
 * Rewrites thin / vendor-dump product descriptions with catalog-first copy
 * built ONLY from real product data (name, brand, category, specifications)
 * — no invented prices, certifications, availability, or reviews.
 * Companion to backend/scripts/audit-retail-seo.js (thin-desc + vendor-dump).
 *
 * READ-ONLY by default (dry run). Writes only with APPLY=1:
 *   node scripts/rewrite-thin-descriptions.js                      # dry run, all
 *   LIMIT=5 node scripts/rewrite-thin-descriptions.js              # dry run, first 5
 *   APPLY=1 LIMIT=5 node scripts/rewrite-thin-descriptions.js      # WRITE pilot batch
 *   ONLY_FLAG=vendor-dump node scripts/rewrite-thin-descriptions.js
 *   APPLY=1 SLUGS=excel-hbeag-rapid-test,excel-hiv-rapid-test node scripts/rewrite-thin-descriptions.js
 *
 * On APPLY it writes a rollback backup to backend/data/description-backup-<ts>.json
 * containing every original description. After applying, clear the Redis cache:
 *   node scripts/clear-product-cache.js   (site ISR also self-heals within 60s)
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../src/models/Product');
const Manufacturer = require('../src/models/Manufacturer');
const Category = require('../src/models/Category');


// Allow KEY=VALUE argv (e.g. node scripts/x.js APPLY=1 LIMIT=5) alongside env vars.
for (const a of process.argv.slice(2)) {
  const m = /^(APPLY|LIMIT|ONLY_FLAG|SLUGS)=(.*)$/.exec(a);
  if (m) process.env[m[1]] = m[2];
}

const APPLY = process.env.APPLY === '1';
const LIMIT = parseInt(process.env.LIMIT || '0', 10) || Infinity;
const ONLY_FLAG = process.env.ONLY_FLAG || '';   // 'thin' | 'vendor-dump' | ''
const SLUG_FILTER = (process.env.SLUGS || '').split(',').map((s) => s.trim()).filter(Boolean);

const THIN_DESC_MIN_CHARS = 80;   // mirrors audit-retail-seo.js
const THIN_DESC_MIN_WORDS = 20;
const VENDOR_DUMP_RE = /(Place of Origin|Product Specification|Product Name|Origin\s*\n?\s*[A-Za-z]*\s*China|Features\s*$)/i;

// Known "Key  Value" dump labels found inside vendor Feature:/Specification: blocks.
// Sorted longest-first so alternation prefers the longest key match.
const DUMP_KEYS = [
  'Instrument classification', 'Package Dimensions', 'Country of Origin', 'Package Contents',
  'Place of Origin', 'Imaging modes', 'Product Weight', 'Warranty Period', 'Model Number',
  'Touch Screen', 'Certification', 'Brand Name', 'Product Name', 'Application', 'Warranty',
  'Material', 'Dimensions', 'Origin', 'Contents', 'Screen size', 'Display', 'Battery',
  'Power', 'Certificate', 'Type', 'Feature', 'Model',
].sort((a, b) => b.length - a.length);

// Words that, mid-value, mark the start of a new sub-label rather than fact data.
const VALUE_CUT_WORDS = ['Monitor', 'Voltage', 'Anti-electroshock', 'OEM/ODM', 'Anti-shock', 'Detection Method', 'Target Volume', 'Rechargeable'];

// Dump key → spec-table key (PDP merges every specifications key into the tab).
const DUMP_KEY_TO_SPEC = {
  'Brand Name': 'Manufacturer',
  'Place of Origin': 'Country of Origin',
  'Origin': 'Country of Origin',
  'Instrument classification': 'Instrument Classification',
  'Imaging modes': 'Imaging Modes',
  'Model Number': 'Model Number',
  'Model': 'Model Number',
  'Application': 'Application',
  'Type': 'Type',
  'Material': 'Material',
  'Warranty': 'Warranty Period',
  'Warranty Period': 'Warranty Period',
  'Package Contents': 'Package Contents',
  'Package Dimensions': 'Package Dimensions',
  'Product Weight': 'Product Weight',
  'Certification': 'Certification',
  'Certificate': 'Certification',
  'Touch Screen': 'Touch Screen',
  'Screen size': 'Screen Size',
  'Display': 'Display',
};
// Values that are really the start of a prose sentence, not a fact.
const VALUE_STOPWORD_RE = /^(of|the|a|an|in|on|with|for|and|to|is|are|internally)\b/i;
const MAX_SPEC_VALUE_CHARS = 60;  // prose bleed guard
const MAX_EXTRACTED_FACTS = 8;


// Category → honest positioning line (no invented certifications/prices/claims).
const CATEGORY_LINE = {
  'laboratory reagents': 'Professional lab diagnostics for clinics, hospitals, and diagnostic centers across Bangladesh.',
  'laboratory equipment': 'Professional lab equipment for clinics, hospitals, and diagnostic centers across Bangladesh.',
  'diagnostic equipment': 'Reliable diagnostic equipment for clinics, hospitals, and point-of-care testing in Bangladesh.',
  'hospital machines': 'Hospital-grade equipment built for continuous use in wards, ICUs, and operating rooms.',
  'imaging equipment': 'Medical imaging equipment trusted by hospitals and diagnostic centers in Bangladesh.',
  'surgical instruments': 'Precision surgical instruments for operating rooms and procedure rooms across Bangladesh.',
  'patient care': 'Dependable patient-care supplies for hospitals, clinics, and home use across Bangladesh.',
  'diabetes care': 'Everyday diabetes care essentials for home monitoring and clinical use in Bangladesh.',
  'home care': 'Practical home-care equipment for comfortable at-home recovery and daily support.',
  'personal care': 'Trusted personal-care essentials for daily health and hygiene.',
  'medical consumables': 'Quality medical consumables stocked for hospitals, clinics, and diagnostic labs in Bangladesh.',
  'icu equipment': 'ICU-grade equipment supporting critical care units in hospitals across Bangladesh.',
  'monitoring equipment': 'Accurate patient-monitoring equipment for clinics, hospitals, and home use in Bangladesh.',
  'respiratory care': 'Respiratory-care equipment for hospitals, clinics, and home therapy across Bangladesh.',
  'cardiology': 'Cardiac-care equipment trusted by cardiologists, clinics, and hospitals in Bangladesh.',
};
const DEFAULT_CATEGORY_LINE = 'Quality medical equipment and supplies for clinics, hospitals, and homes across Bangladesh.';

// Specification keys worth quoting (common vendor keys), lowercase compare.
const SPEC_KEY_WHITELIST = [
  'sample', 'specimen', 'specimen type', 'sample type', 'test type', 'assay',
  'format', 'method', 'principle', 'sensitivity', 'specificity', 'result time',
  'reading time', 'pack size', 'pack', 'packing', 'package', 'size', 'length',
  'capacity', 'volume', 'parameter', 'parameters', 'channels', 'leads',
  'screen size', 'display', 'resolution', 'power', 'battery', 'type', 'model',
  'country', 'country of origin', 'made in', 'material', 'colour', 'color',
  'storage', 'shelf life', 'device type', 'machine type',
];
const MAX_SPEC_SENTENCES = 2;

/** Resolve name from a possibly-populated ObjectId ref. */
function refName(ref) {
  if (!ref) return '';
  if (typeof ref === 'string') return ref;
  return ref.name || '';
}

function descClean(d) {
  return typeof d === 'string' ? d.replace(/\s+/g, ' ').trim() : '';
}

/** Same thresholds as audit-retail-seo.js. */
function classify(desc) {
  const clean = descClean(desc);
  const flags = [];
  if (clean.length < THIN_DESC_MIN_CHARS || clean.split(/\s+/).filter(Boolean).length < THIN_DESC_MIN_WORDS) {
    flags.push('thin');
  }
  if (clean.length >= 150 && VENDOR_DUMP_RE.test(clean)) {
    flags.push('vendor-dump');
  }
  return flags;
}

/** Pick up to MAX_SPEC_SENTENCES "Key: value" facts from real specifications. */
function specSentences(specs) {
  if (!specs || typeof specs !== 'object') return [];
  const entries = specs instanceof Map ? [...specs.entries()] : Object.entries(specs);
  const out = [];
  for (const [rawKey, rawVal] of entries) {
    if (out.length >= MAX_SPEC_SENTENCES) break;
    const key = String(rawKey || '').trim();
    const val = String(rawVal || '').trim();
    if (!key || !val || val.length > 60) continue;
    if (!SPEC_KEY_WHITELIST.includes(key.toLowerCase())) continue;
    const k = key.charAt(0).toUpperCase() + key.slice(1);
    const sentence = `${k}: ${val}`;
    if (!out.includes(sentence)) out.push(sentence);
  }
  return out;
}

/**
 * Extract real "Key  Value" facts from a vendor-dump description's
 * Feature:/Specification: blocks. Returns { [specKey]: value }.
 * Guards: value ≤ 60 chars, no known-dump-key bleed, ≤ MAX_EXTRACTED_FACTS facts,
 * duplicate/redundant keys skipped (e.g. 'Product Name' == product name).
 */
function extractDumpFacts(desc, product) {
  const facts = {};
  if (typeof desc !== 'string') return facts;
  const known = new Set(DUMP_KEYS.map((k) => k.toLowerCase()));
  const alternation = DUMP_KEYS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  // Colon-form labels ("Place of Origin: Guangdong") and space-form ("Brand Mindray").
  // Trailing \b blocks matches inside words ("Origin|al", "Material|s").
  const re = new RegExp(
    `(?:^|[\\s\\u00A0]+)(${alternation})\\b\\s*:?\\s*([^\\n]+?)(?=(?:[\\s\\u00A0]+(?:${alternation})\\b\\s*:?\\s*)|$)`,
    'gi',
  );
  let m;
  const nameLower = String(product.name || '').toLowerCase();
  while ((m = re.exec(desc)) !== null && Object.keys(facts).length < MAX_EXTRACTED_FACTS) {
    const rawKey = m[1].replace(/\s+/g, ' ').trim();
    // Cut mid-value sub-labels ("Sonoline A Anti-electroshock", "TFT Monitor", "OEM/ODM Yes Certificate CE").
    let rawVal = m[2].replace(/\s+/g, ' ').trim();
    let startsWithLabel = false;
    for (const w of VALUE_CUT_WORDS) {
      const i = rawVal.indexOf(w);
      if (i === 0) { startsWithLabel = true; break; }   // the value IS a label run, not a fact
      if (i > 0) rawVal = rawVal.slice(0, i).trim();
    }
    const key = DUMP_KEYS.find((k) => k.toLowerCase() === rawKey.toLowerCase());
    if (!key) continue;
    // Skip keys whose mapped spec-table label is already present.
    const specKey = DUMP_KEY_TO_SPEC[key];
    if (!specKey || facts[specKey] !== undefined) continue;
    const lower = rawVal.toLowerCase();
    // Skip redundant echoes of the product name / brand.
    if (nameLower && (lower === nameLower || nameLower.includes(lower))) continue;
    if (nameLower && nameLower.includes(lower) && lower.split(' ').length >= 3) continue;
    // Skip boilerplate keys and prose-looking values.
    if (key === 'Feature' || startsWithLabel || VALUE_STOPWORD_RE.test(rawVal)) continue;
    if (!rawVal || rawVal.length > MAX_SPEC_VALUE_CHARS) continue;
    if (/^[&,,;.·]/.test(rawVal)) continue;      // value starts mid-sentence
    if (/\b(limited|inc\b|warranty|©|shipping|delivery|return)/i.test(rawVal)) continue; // prose markers
    if (known.has(lower)) continue;  // value is itself another label (parse bleed)
    facts[specKey] = rawVal.replace(/[;:,]+$/, '');
  }
  return facts;
}


/**
 * Build catalog-first copy from real fields only. Structure:
 *   1. Buy <name> in Bangladesh from MediportBD.
 *   2. <Real spec facts, up to 2> (optional)
 *   3. <Category positioning line>
 *   4. Genuine product, DGDA documentation available for regulated items — order online at MediportBD.
 */
function buildDescription(product) {
  const name = String(product.name || '').trim();
  const brand = refName(product.brand);
  const cat = refName(product.category);
  const catKey = cat.toLowerCase().trim();
  const categoryLine = CATEGORY_LINE[catKey] || DEFAULT_CATEGORY_LINE;

  const hasBrandPrefix = brand && name.toLowerCase().startsWith(brand.toLowerCase());
  const lead = hasBrandPrefix
    ? `${name} in Bangladesh from MediportBD.`
    : brand
      ? `${name} from ${brand} — available in Bangladesh at MediportBD.`
      : `${name} in Bangladesh from MediportBD.`;

  const facts = specSentences(product.specifications);
  const parts = [lead, ...facts, categoryLine, 'Genuine product, DGDA documentation available for regulated items — order online at MediportBD.'];
  return parts.join(' ');
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI missing — check backend/.env');
    process.exit(1);
  }
  console.log(`Mode: ${APPLY ? 'APPLY (writes enabled)' : 'DRY RUN (no writes)'}`);
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  const query = { isActive: true };
  if (SLUG_FILTER.length > 0) {
    query.slug = { $in: SLUG_FILTER };
  }
  const docs = await Product.find(query)
    .select('name slug description brand category specifications')
    .populate('brand', 'name')
    .populate('category', 'name')
    .lean();

  console.log(`Scanned ${docs.length} active products.`);

  const targets = [];
  for (const doc of docs) {
    const flags = classify(doc.description);
    if (flags.length > 0 && (!ONLY_FLAG || flags.includes(ONLY_FLAG))) {
      targets.push({ doc, flags });
    }
  }

  const byFlag = {};
  for (const t of targets) {
    for (const f of t.flags) byFlag[f] = (byFlag[f] || 0) + 1;
  }
  console.log(`Flagged for rewrite: ${targets.length}`, byFlag);

  const batch = targets.slice(0, LIMIT);
  const backup = [];
  let changed = 0;

  for (const { doc, flags } of batch) {
    const nextDesc = buildDescription(doc);
    const oldDesc = descClean(doc.description);
    if (nextDesc === oldDesc && !flags.includes('vendor-dump')) continue;

    // Rescue real facts from vendor dumps into the specifications map (PDP spec
    // table renders every key). Only additive: existing keys are never overwritten.
    let specUpdates = null;
    if (flags.includes('vendor-dump')) {
      const rescued = extractDumpFacts(doc.description, doc);
      const existing = doc.specifications instanceof Map
        ? Object.fromEntries(doc.specifications.entries())
        : (doc.specifications || {});
      const additive = {};
      for (const [k, v] of Object.entries(rescued)) {
        const cur = existing[k];
        if (cur === undefined || cur === null || String(cur).trim() === '') additive[k] = v;
      }
      if (Object.keys(additive).length > 0) specUpdates = additive;
    }

    console.log('\n────────────────────────────────────────────');
    console.log(`[${flags.join(',')}] ${doc.name}  (${doc.slug || doc._id})`);
    console.log(`  OLD (${oldDesc.length} chars): ${oldDesc.slice(0, 90)}${oldDesc.length > 90 ? '…' : ''}`);
    console.log(`  NEW (${nextDesc.length} chars): ${nextDesc.slice(0, 90)}${nextDesc.length > 90 ? '…' : ''}`);
    if (specUpdates) {
      console.log(`  + SPECS: ${Object.entries(specUpdates).map(([k, v]) => `${k}=${v}`).join(' | ')}`);
    }

    backup.push({
      _id: String(doc._id), slug: doc.slug, name: doc.name,
      oldDescription: doc.description,
      oldSpecifications: doc.specifications instanceof Map
        ? Object.fromEntries(doc.specifications.entries())
        : (doc.specifications || {}),
    });
    changed += 1;

    if (APPLY) {
      const update = { $set: { description: nextDesc } };
      if (specUpdates) {
        for (const [k, v] of Object.entries(specUpdates)) update.$set[`specifications.${k}`] = v;
      }
      await Product.updateOne({ _id: doc._id }, update);
    }
  }

  if (APPLY && backup.length > 0) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const outDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const backupPath = path.join(outDir, `description-backup-${ts}.json`);
    fs.writeFileSync(backupPath, JSON.stringify({ appliedAt: new Date().toISOString(), count: backup.length, items: backup }, null, 2));
    console.log(`\nRollback backup written: ${backupPath}`);
  }

  console.log('\n════════════════════════════════════════════');
  console.log(APPLY
    ? `Updated ${changed} product description(s).`
    : `DRY RUN — would rewrite ${changed} of ${targets.length} flagged product(s). Re-run with APPLY=1 to write.`);
  if (APPLY) {
    console.log('Next: clear Redis cache → node scripts/clear-product-cache.js');
    console.log('(Site ISR also self-heals within its revalidate window.)');
  }
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
