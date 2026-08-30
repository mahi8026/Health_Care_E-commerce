#!/usr/bin/env node

/**
 * Excel Brand (M/S. Patwary Enterprise) Rapid Diagnostic Test scraper
 * Scrapes product pages from https://excelbrandbgd.com
 * Extracts: name, description, gallery images, procedure images
 *
 * Usage:
 *   node scripts/scrapeExcelProducts.js [--out FILE]
 *
 * Output: data/excel-products.json
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const BASE = 'https://excelbrandbgd.com';

// The 11 products requested, with their slugs on excelbrandbgd.com
const PRODUCTS = [
  { slug: 'hcg-pregnancy-rapid-tests-copy-copy', siteName: 'hCG Pregnancy Rapid Tests', name: 'Excel hCG Pregnancy Rapid Test' },
  { slug: 'hbsag-rapid-tests', siteName: 'HBsAg Rapid Tests', name: 'Excel HBsAg Rapid Test' },
  { slug: 'hcv-rapid-tests', siteName: 'HCV Rapid Tests', name: 'Excel HCV Rapid Test' },
  { slug: 'hiv-rapid-tests', siteName: 'HIV Rapid Tests', name: 'Excel HIV Rapid Test' },
  { slug: 'dengue-ns1-rapid-tests', siteName: 'Dengue NS1 Rapid Tests', name: 'Excel Dengue NS1 Rapid Test' },
  { slug: 'dengue-igg-igm-rapid-tests', siteName: 'Dengue IgG/IgM Rapid Tests', name: 'Excel Dengue IgG/IgM Rapid Test' },
  { slug: 'h-pylori-rapid-tests', siteName: 'H.pylori Rapid Tests', name: 'Excel H. pylori Rapid Test' },
  { slug: 'syphilis-rapid-tests', siteName: 'Syphilis Rapid Tests', name: 'Excel Syphilis Rapid Test' },
  { slug: 'malaria-rapid-tests', siteName: 'Malaria Rapid Tests', name: 'Excel Malaria Rapid Test' },
  { slug: 'hav-rapid-tests', siteName: 'HAV Rapid Tests', name: 'Excel HAV IgM Rapid Test' },
  { slug: 'hbeag-rapid-tests', siteName: 'HBeAg Rapid Tests', name: 'Excel HBeAg Rapid Test' },
];

function parseArgs() {
  const args = process.argv.slice(2);
  let out = null;
  const outIdx = args.indexOf('--out');
  if (outIdx !== -1) out = args[outIdx + 1];
  return { out };
}

async function fetchPage(url) {
  const response = await axios.get(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    timeout: 60000,
  });
  return cheerio.load(response.data);
}

function decodeLazy($, el) {
  const $el = $(el);
  const src = $el.attr('data-large_image') || $el.attr('data-src') || $el.attr('src') || '';
  if (src.startsWith('data:')) return '';
  return src;
}

function collectGalleryImages($) {
  const urls = [];
  $('.woocommerce-product-gallery__image').each((i, el) => {
    const $el = $(el);
    const link = $el.find('a[href*="/wp-content/uploads/"]').attr('href');
    const img = $el.find('img').first();
    const u = link || decodeLazy($, img);
    if (u && !urls.includes(u)) urls.push(u);
  });
  return urls;
}

function collectProcedureImages($, html) {
  const urls = [];
  const regex = /data-src="(https:\/\/excelbrandbgd\.com\/wp-content\/uploads\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    if (!urls.includes(m[1])) urls.push(m[1]);
  }
  return urls;
}

function cleanDescription(html) {
  const $ = cheerio.load('<div>' + html + '</div>');
  $('script, style').remove();
  return $('div')
    .first()
    .text()
    .replace(/\s+/g, ' ')
    .trim();
}

async function scrapeProduct(p) {
  const url = BASE + '/product/' + p.slug;
  console.log('\n→ Scraping: ' + p.name + ' (' + url + ')');
  const $ = await fetchPage(url);
  const html = $.html();

  const title = $('h1.product_title').first().text().trim() || p.siteName;

  // Gallery images
  const gallery = collectGalleryImages($);
  console.log('   Gallery images: ' + gallery.length);

  // Procedure tab images (useful additional product images)
  const procPanel = $('#tab-procedure').html() || '';
  const procImages = collectProcedureImages($, procPanel);
  console.log('   Procedure images: ' + procImages.length);

  // Description
  const descRaw = $('#tab-description').html() || '';
  const description = cleanDescription(descRaw);
  console.log('   Description: ' + (description ? description.substring(0, 80) + '...' : '(none)'));

  return {
    slug: p.slug,
    name: p.name,
    siteName: title,
    sourceUrl: url,
    description,
    images: gallery,
    procedureImages: procImages,
  };
}

async function main() {
  const { out } = parseArgs();
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  EXCEL BRAND Rapid Diagnostic Test Scraper (excelbrandbgd.com)');
  console.log('═══════════════════════════════════════════════════════════');

  const results = [];
  for (const p of PRODUCTS) {
    try {
      const data = await scrapeProduct(p);
      results.push(data);
    } catch (e) {
      console.error('   ✗ Failed: ' + e.message);
      results.push({ slug: p.slug, name: p.name, siteName: p.siteName, sourceUrl: BASE + '/product/' + p.slug, error: e.message, images: [], procedureImages: [] });
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  const outPath = out || path.join(__dirname, '..', 'data', 'excel-products.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');

  const ok = results.filter((r) => !r.error).length;
  console.log('\n───────────────────────────────────────────────────────────');
  console.log('Scraped ' + ok + '/' + results.length + ' products');
  console.log('Saved to: ' + outPath);
  console.log('───────────────────────────────────────────────────────────\n');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
