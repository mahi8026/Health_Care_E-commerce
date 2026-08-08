#!/usr/bin/env node

/**
 * Generic BMA Bazar Brand Scraper
 * Scrapes all products for a brand from https://bmabazar.com/brand/<brand>/
 * Auto-discovers pagination and scrapes each product detail page.
 *
 * Usage:
 *   node scripts/scrapeBrandProducts.js <brand-slug> [--limit N]
 *
 * Examples:
 *   node scripts/scrapeBrandProducts.js mindray
 *   node scripts/scrapeBrandProducts.js contec
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const BASE = 'https://bmabazar.com';

function parseArgs() {
  const args = process.argv.slice(2);
  const brand = args[0];
  let limit = null;
  let out = null;
  const limitIdx = args.indexOf('--limit');
  if (limitIdx !== -1) limit = parseInt(args[limitIdx + 1], 10);
  const outIdx = args.indexOf('--out');
  if (outIdx !== -1) out = args[outIdx + 1];
  if (!brand) {
    console.error('Usage: node scripts/scrapeBrandProducts.js <brand-slug> [--limit N] [--out FILE]');
    process.exit(1);
  }
  return { brand, limit, out };
}

async function fetchPage(url) {
  const response = await axios.get(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    timeout: 60000,
  });
  return cheerio.load(response.data);
}

function cleanImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('//')) url = 'https:' + url;
  if (url.startsWith('data:')) return null;
  if (url.includes('.nitrocdn.com')) {
    const match = url.match(/nitrocdn\.com\/[^/]+\/assets\/images\/optimized\/rev-[^/]+\/(.+)$/);
    if (match) url = 'https://' + match[1];
  }
  if (url.includes('wp-content/uploads/')) return url;
  return null;
}

function stripSizeSuffix(url) {
  if (!url) return url;
  return url.replace(/-[0-9]+x[0-9]+\.(jpg|jpeg|png|webp|gif)$/i, '.$1');
}

function parsePrice(text) {
  if (!text) return null;
  const cleaned = text.replace(/[৳$,\s]/gi, '').replace(/BDT/gi, '');
  const price = parseFloat(cleaned);
  return isNaN(price) ? null : price;
}

async function discoverListingUrls(brand) {
  const base = BASE + '/brand/' + brand + '/';
  const urls = [base];
  console.log('Discovering listing pages for "' + brand + '"...');
  const $ = await fetchPage(base);

  const resultText = $('.woocommerce-result-count').first().text().trim();
  console.log('  Result count text: ' + JSON.stringify(resultText));

  const pageNums = new Set();
  $('.woocommerce-pagination a.page-numbers, .woocommerce-pagination .page-numbers a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('/brand/' + brand + '/page/')) {
      const m = href.match(/\/page\/([0-9]+)\//);
      if (m && m[1]) pageNums.add(parseInt(m[1], 10));
    }
  });

  const lastPage = pageNums.size ? Math.max(...pageNums) : 1;
  for (let p = 2; p <= lastPage; p++) urls.push(base + 'page/' + p + '/');
  console.log('Found ' + urls.length + ' listing page(s): ' + urls.join(' '));
  return urls;
}

async function scrapeListing(url) {
  console.log('Scraping listing: ' + url);
  const $ = await fetchPage(url);
  const products = [];

  $('.product-grid-item, .product.type-product').each((i, el) => {
    const card = $(el);
    const titleEl = card.find('.wd-entities-title a, h2 a').first();
    const title = titleEl.text().trim();
    const productUrl = titleEl.attr('href');
    if (!title || !productUrl) return;

    let image = null;
    const imgEl = card.find('.product-image-link img, .product-element-top img').first();
    let attr =
      imgEl.attr('nitro-lazy-src') ||
      imgEl.attr('data-src') ||
      imgEl.attr('src') ||
      '';
    if (!attr) {
      const srcset = imgEl.attr('nitro-lazy-srcset') || imgEl.attr('srcset') || '';
      if (srcset) attr = srcset.split(',')[0].trim().split(/\s+/)[0];
    }
    image = cleanImageUrl(attr);
    if (image) image = stripSizeSuffix(image);

    let price = null;
    let oldPrice = null;
    const del = parsePrice(card.find('del .woocommerce-Price-amount').first().text());
    const ins = parsePrice(card.find('ins .woocommerce-Price-amount').first().text());
    if (ins) {
      price = ins;
      oldPrice = del || null;
    } else {
      price = parsePrice(card.find('.price .woocommerce-Price-amount').first().text());
    }

    let category = null;
    const catEl = card.find('.wd-product-cats a').first();
    if (catEl.length) category = catEl.text().trim();

    const isOutOfStock = card.hasClass('outofstock') || card.find('.out-of-stock').length > 0;
    const isOnBackorder = card.hasClass('onbackorder');
    const isOnSale = card.hasClass('sale') || card.find('.onsale').length > 0;

    products.push({
      name: title,
      url: productUrl.startsWith('http') ? productUrl : BASE + productUrl,
      image,
      price,
      oldPrice,
      isOutOfStock,
      isOnBackorder,
      isOnSale,
      categoryFromListing: category,
    });
  });

  return products;
}

async function scrapeProductPage(product) {
  console.log('Scraping product page: ' + product.name);
  try {
    const $ = await fetchPage(product.url);

    let ld = null;
    $('script[type="application/ld+json"]').each((i, el) => {
      if (ld) return;
      const text = $(el).html() || '';
      if (text.includes('"@type":"Product"') || text.includes('"@type": "Product"')) {
        try {
          ld = JSON.parse(text);
        } catch (e) {
          try {
            const graphs = JSON.parse(text)['@graph'];
            if (graphs) ld = graphs.find((g) => g['@type'] === 'Product') || null;
          } catch (e2) {
            ld = null;
          }
        }
      }
    });

    const shortDesc = $('.woocommerce-product-details__short-description').first().text().trim();
    const tabDesc = $('#tab-description').first().text().trim();

    let description = '';
    if (shortDesc && tabDesc) {
      description = shortDesc + '\n\n' + tabDesc;
    } else if (shortDesc) {
      description = shortDesc;
    } else if (tabDesc) {
      description = tabDesc;
    } else if (ld && ld.description) {
      description = ld.description;
    }

    const galleryImages = [];
    $('.woocommerce-product-gallery__image img, .woocommerce-product-gallery img, .wd-product-gallery img').each((i, el) => {
      const src =
        $(el).attr('data-src') ||
        $(el).attr('nitro-lazy-src') ||
        $(el).attr('src') ||
        $(el).attr('data-large_image') ||
        '';
      const cleaned = cleanImageUrl(src);
      if (cleaned) galleryImages.push(stripSizeSuffix(cleaned));
    });

    const unique = [...new Set(galleryImages)];
    const full = unique.filter((u) => !/-[0-9]+x[0-9]+\.(jpg|jpeg|png|webp|gif)$/.test(u));
    const thumbs = unique.filter((u) => /-[0-9]+x[0-9]+\.(jpg|jpeg|png|webp|gif)$/.test(u));
    product.galleryImages = (full.length ? full : unique).slice(0, 8);

    let price = product.price;
    let oldPrice = product.oldPrice;
    if (price === null) {
      const del = parsePrice($('.summary del .woocommerce-Price-amount').first().text());
      const ins = parsePrice($('.summary ins .woocommerce-Price-amount').first().text());
      if (ins) {
        price = ins;
        oldPrice = del || null;
      } else {
        price = parsePrice($('.summary .woocommerce-Price-amount').first().text());
      }
      if (price === null && ld && ld.offers) {
        const off = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;
        const p = parseFloat(off && off.price);
        if (!isNaN(p)) price = p;
      }
    }

    let category = product.categoryFromListing;
    $('.posted_in a').each((i, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('/product-category/')) category = $(el).text().trim();
    });

    product.description = description;
    product.price = price;
    product.oldPrice = oldPrice;
    product.category = category;
  } catch (error) {
    console.error('  Failed to scrape ' + product.name + ': ' + error.message);
    product.error = error.message;
  }
  return product;
}

async function main() {
  const args = parseArgs();
  const outlet = args.out;
  console.log('\nBMA Bazar brand scraper: ' + args.brand);
  const listingUrls = await discoverListingUrls(args.brand);
  let products = [];

  for (const url of listingUrls) {
    const found = await scrapeListing(url);
    products = products.concat(found);
  }

  if (args.limit && products.length > args.limit) {
    products = products.slice(0, args.limit);
  }
  console.log('\nFound ' + products.length + ' products. Scraping details...\n');

  for (let i = 0; i < products.length; i++) {
    console.log('  [' + (i + 1) + '/' + products.length + ']');
    await scrapeProductPage(products[i]);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  const outFile = outlet || path.join(__dirname, '..', 'data', args.brand + '-products.json');
  const dataDir = path.dirname(outFile);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(products, null, 2), 'utf-8');
  console.log('\nSaved ' + products.length + ' products to ' + outFile + '\n');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});