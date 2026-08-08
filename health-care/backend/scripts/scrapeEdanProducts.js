#!/usr/bin/env node

/**
 * EDAN Product Scraper
 * Scrapes all EDAN products from https://bmabazar.com/brand/edan/
 * Extracts name, description, price, images, category and saves to JSON
 *
 * Usage:
 *   node scripts/scrapeEdanProducts.js
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://bmabazar.com';
const LISTING_URLS = [
  `${BASE_URL}/brand/edan/`,
  `${BASE_URL}/brand/edan/page/2/`,
];
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'edan-products.json');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

async function fetchPage(url) {
  const response = await axios.get(url, {
    headers: { 'User-Agent': USER_AGENT },
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
    if (match) url = `https://${match[1]}`;
  }
  if (url.includes('wp-content/uploads/')) return url;
  return null;
}

async function scrapeListing() {
  const products = [];

  for (const listingUrl of LISTING_URLS) {
    console.log(`Scraping listing: ${listingUrl}`);
    const $ = await fetchPage(listingUrl);

    $('.product-grid-item, .product.type-product').each((i, el) => {
      const card = $(el);
      const titleEl = card.find('.wd-entities-title a, h2 a, h3 a').first();
      const title = titleEl.text().trim();
      const productUrl = titleEl.attr('href');

      if (!title || !productUrl) return;

      const imgEl = card.find('.product-image-link img').first();
      const imgSrc =
        imgEl.attr('data-src') ||
        imgEl.attr('nitro-lazy-src') ||
        imgEl.attr('src') ||
        '';
      const image = cleanImageUrl(imgSrc);

      const priceText = card.find('.price').text().replace(/[৳\s,]/g, '').trim();

      const product = {
        name: title,
        url: productUrl.startsWith('http') ? productUrl : BASE_URL + productUrl,
        image,
        priceFromListing: priceText ? parseFloat(priceText) : null,
        categoryFromListing: null,
      };

      const catEl = card.find('.wd-product-cats a').first();
      if (catEl.length) {
        product.categoryFromListing = catEl.text().trim();
      }

      const wrapper = card.find('.product-wrapper, .product-element-top');
      const isOutOfStock = card.hasClass('outofstock') || wrapper.find('.out-of-stock').length > 0;
      const isOnBackorder = card.hasClass('onbackorder');
      product.isOutOfStock = isOutOfStock;
      product.isOnBackorder = isOnBackorder;

      products.push(product);
    });
  }

  return products;
}

async function scrapeProductPage(product) {
  console.log(`Scraping product page: ${product.name}`);
  try {
    const $ = await fetchPage(product.url);

    const jsonLd = $('script[type="application/ld+json"]');
    let ld = null;
    jsonLd.each((i, el) => {
      if (ld) return;
      const text = $(el).html() || '';
      if (text.includes('"@type":"Product"') || text.includes('"@type": "Product"')) {
        try {
          ld = JSON.parse(text);
        } catch (e) {
          try {
            const graphs = JSON.parse(text)['@graph'];
            if (graphs) {
              ld = graphs.find((g) => g['@type'] === 'Product') || null;
            }
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
    $('.woocommerce-product-gallery__image img, .woocommerce-product-gallery img').each((i, el) => {
      const src =
        $(el).attr('data-src') ||
        $(el).attr('nitro-lazy-src') ||
        $(el).attr('src') ||
        $(el).attr('data-large_image');
      const cleaned = cleanImageUrl(src);
      if (cleaned && !galleryImages.includes(cleaned)) {
        galleryImages.push(cleaned);
      }
    });

    let price = null;
    let oldPrice = null;
    const priceBlock = $('.summary .price').first();
    const del = priceBlock.find('del .woocommerce-Price-amount').first().text();
    const ins = priceBlock.find('ins .woocommerce-Price-amount').first().text();
    if (ins) {
      price = parseFloat(ins.replace(/[৳\s,]/g, ''));
    } else {
      const current = priceBlock.find('.woocommerce-Price-amount').first().text();
      price = current ? parseFloat(current.replace(/[৳\s,]/g, '')) : null;
    }
    if (del) {
      oldPrice = parseFloat(del.replace(/[৳\s,]/g, ''));
    }

    let category = null;
    const catLink = $('.posted_in a, .single-breadcrumb-wrapper .wd-breadcrumbs a').last();
    $('.posted_in a').each((i, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('/product-category/')) {
        category = $(el).text().trim();
      }
    });
    if (!category) {
      $('.single-product-breadcrumb a, .wd-breadcrumbs a').each((i, el) => {
        const href = $(el).attr('href') || '';
        if (href.includes('/product-category/')) {
          category = $(el).text().trim();
        }
      });
    }

    let inStock = true;
    const stockStatus = $('p.stock').first().text().trim().toLowerCase();
    if (stockStatus.includes('out of stock') || stockStatus.includes('backorder') === false) {
      if (stockStatus.includes('out of stock')) inStock = false;
    }

    const tags = [];
    $('.tagged_as a').each((i, el) => tags.push($(el).text().trim()));

    product.description = description;
    product.price = price;
    product.oldPrice = oldPrice;
    product.category = category;
    product.galleryImages = galleryImages;
    product.inStock = inStock;
    product.tags = tags;
  } catch (error) {
    console.error(`  ✗ Failed to scrape ${product.name}: ${error.message}`);
    product.error = error.message;
  }
  return product;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  EDAN Product Scraper - bmabazar.com');
  console.log('═══════════════════════════════════════════════════════════\n');

  let products = await scrapeListing();
  console.log(`\nFound ${products.length} products in listing(s)\n`);

  for (let i = 0; i < products.length; i++) {
    console.log(`${i + 1}/${products.length}`);
    await scrapeProductPage(products[i]);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2), 'utf-8');
  console.log(`\n✓ Saved ${products.length} products to ${OUTPUT_FILE}\n`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
