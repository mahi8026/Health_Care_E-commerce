/**
 * Product Scraper Utility
 * Fetches product data from external e-commerce sites and imports to MediportBD
 */

const axios = require('axios');
const cheerio = require('cheerio');
const slugify = require('slugify');
const logger = require('./logger');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Manufacturer = require('../models/Manufacturer');
const cloudinary = require('cloudinary').v2;

/**
 * Parse price string to number (handles ৳, BDT, commas)
 */
function parsePrice(priceStr) {
  if (!priceStr) {
return null;
}
  
  // Remove currency symbols and commas
  const cleaned = priceStr
    .replace(/[৳$,BDT\s]/gi, '')
    .replace(/tk/gi, '')
    .trim();
  
  const price = parseFloat(cleaned);
  return isNaN(price) ? null : price;
}

/**
 * Download image and upload to Cloudinary
 */
async function uploadImageToCloudinary(imageUrl, _productName) {
  try {
    // Handle relative URLs
    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl;
    } else if (imageUrl.startsWith('/')) {
      throw new Error('Relative path provided - need full domain');
    }

    logger.info(`Uploading image to Cloudinary: ${imageUrl}`);

    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'Mediport/products',
      resource_type: 'auto',
      timeout: 60000,
      transformation: [
        { width: 1000, height: 1000, crop: 'limit', quality: 'auto:good' },
      ],
    });

    return result.secure_url;
  } catch (error) {
    logger.error(`Failed to upload image: ${imageUrl}`, error);
    return null;
  }
}

/**
 * Find or create manufacturer by name
 */
async function findOrCreateManufacturer(brandName) {
  if (!brandName) {
return null;
}

  const slug = slugify(brandName, { lower: true, strict: true });

  let manufacturer = await Manufacturer.findOne({
    $or: [{ name: new RegExp(`^${brandName}$`, 'i') }, { slug }],
  });

  if (!manufacturer) {
    manufacturer = await Manufacturer.create({
      name: brandName,
      slug,
      description: `${brandName} - Medical Equipment Manufacturer`,
      isActive: true,
    });
    logger.info(`Created new manufacturer: ${brandName}`);
  }

  return manufacturer._id;
}

/**
 * Find or create category by name
 */
async function findOrCreateCategory(categoryName) {
  if (!categoryName) {
return null;
}

  const slug = slugify(categoryName, { lower: true, strict: true });

  let category = await Category.findOne({
    $or: [{ name: new RegExp(`^${categoryName}$`, 'i') }, { slug }],
  });

  if (!category) {
    category = await Category.create({
      name: categoryName,
      slug,
      description: `${categoryName} - Medical equipment and supplies`,
      isActive: true,
    });
    logger.info(`Created new category: ${categoryName}`);
  }

  return category._id;
}

/**
 * Generic scraper - attempts to extract product data from HTML
 */
async function scrapeProductPage(url) {
  try {
    logger.info(`Scraping product page: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const baseUrl = new URL(url).origin;

    // Try to extract product data using common selectors
    const productData = {
      name: null,
      price: null,
      compareAtPrice: null,
      description: null,
      images: [],
      brand: null,
      category: null,
      stock: null,
      sku: null,
      specifications: {},
    };

    // Extract name (try multiple selectors)
    productData.name =
      $('h1.product-title').first().text().trim() ||
      $('h1[itemprop="name"]').first().text().trim() ||
      $('h1.product_title').first().text().trim() ||
      $('.product-name h1').first().text().trim() ||
      $('h1').first().text().trim();

    // Extract price
    const priceText =
      $('.product-price .price').first().text() ||
      $('[itemprop="price"]').first().attr('content') ||
      $('.price ins').first().text() ||
      $('.woocommerce-Price-amount').first().text() ||
      $('.product-price').first().text();
    productData.price = parsePrice(priceText);

    // Extract compare at price (original price)
    const comparePriceText =
      $('.price del').first().text() ||
      $('.regular-price').first().text() ||
      $('.was-price').first().text();
    if (comparePriceText) {
      productData.compareAtPrice = parsePrice(comparePriceText);
    }

    // Extract description
    productData.description =
      $('.product-description').text().trim() ||
      $('[itemprop="description"]').text().trim() ||
      $('.product-details').text().trim() ||
      $('.description').text().trim() ||
      $('.product-content').text().trim();

    // Extract images
    const imageSelectors = [
      '.product-gallery img',
      '.product-images img',
      '[itemprop="image"]',
      '.woocommerce-product-gallery__image img',
      '.product-image img',
    ];

    imageSelectors.forEach((selector) => {
      $(selector).each((i, el) => {
        let src =
          $(el).attr('src') ||
          $(el).attr('data-src') ||
          $(el).attr('data-lazy-src');

        if (src) {
          // Convert relative URLs to absolute
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            src = baseUrl + src;
          }

          // Remove query parameters for cleaner URLs
          src = src.split('?')[0];

          // Avoid thumbnails
          if (!src.includes('thumbnail') && !src.includes('-150x150')) {
            if (!productData.images.includes(src)) {
              productData.images.push(src);
            }
          }
        }
      });
    });

    // Extract brand
    productData.brand =
      $('.product-brand').text().trim() ||
      $('[itemprop="brand"]').text().trim() ||
      $('.brand').text().trim();

    // Extract category
    productData.category =
      $('.product-category a').first().text().trim() ||
      $('.breadcrumb a').last().text().trim() ||
      $('[rel="tag"]').first().text().trim();

    // Extract SKU
    productData.sku =
      $('.sku').text().trim() ||
      $('[itemprop="sku"]').text().trim() ||
      $('.product-sku').text().trim();

    // Extract stock status
    const stockText =
      $('.stock').text().toLowerCase() ||
      $('.availability').text().toLowerCase();
    if (stockText.includes('in stock') || stockText.includes('available')) {
      productData.stock = 100; // Default stock
    } else if (stockText.includes('out of stock')) {
      productData.stock = 0;
    }

    // Extract specifications/attributes
    $('.product-attributes tr, .shop_attributes tr').each((i, row) => {
      const label = $(row).find('th, .label').text().trim();
      const value = $(row).find('td, .value').text().trim();
      if (label && value) {
        productData.specifications[label] = value;
      }
    });

    logger.info(`Scraped product: ${productData.name}`);
    return productData;
  } catch (error) {
    logger.error(`Failed to scrape product page: ${url}`, error);
    throw error;
  }
}

/**
 * Scrape product listing page to get multiple product URLs
 */
async function scrapeProductListing(listingUrl, brandFilter = null) {
  try {
    logger.info(`Scraping listing page: ${listingUrl}`);

    const response = await axios.get(listingUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const baseUrl = new URL(listingUrl).origin;
    const productUrls = [];

    // Try multiple common selectors for product links
    const linkSelectors = [
      '.product a.product-link',
      '.product-item a.product-title',
      '.products .product a',
      '.product-grid a.woocommerce-LoopProduct-link',
      'article.product a',
      '.product-card a',
    ];

    linkSelectors.forEach((selector) => {
      $(selector).each((i, el) => {
        let href = $(el).attr('href');
        if (href) {
          // Convert to absolute URL
          if (href.startsWith('/')) {
            href = baseUrl + href;
          }

          // Filter by brand if specified
          if (brandFilter) {
            const productText = $(el).text().toLowerCase();
            if (productText.includes(brandFilter.toLowerCase())) {
              if (!productUrls.includes(href)) {
                productUrls.push(href);
              }
            }
          } else {
            if (!productUrls.includes(href)) {
              productUrls.push(href);
            }
          }
        }
      });
    });

    logger.info(`Found ${productUrls.length} product URLs`);
    return productUrls;
  } catch (error) {
    logger.error(`Failed to scrape listing page: ${listingUrl}`, error);
    throw error;
  }
}

/**
 * Import product to database
 */
async function importProduct(productData, options = {}) {
  try {
    const {
      brandName = null,
      categoryName = 'Medical Equipment',
      uploadImages = true,
      skipExisting = true,
    } = options;

    // Check if product already exists
    if (skipExisting && productData.name) {
      const existingProduct = await Product.findOne({
        name: new RegExp(`^${productData.name}$`, 'i'),
      });

      if (existingProduct) {
        logger.info(`Product already exists: ${productData.name}`);
        return { success: false, reason: 'already_exists', product: null };
      }
    }

    // Upload images to Cloudinary
    const uploadedImages = [];
    if (uploadImages && productData.images && productData.images.length > 0) {
      logger.info(`Uploading ${productData.images.length} images...`);

      for (const imageUrl of productData.images.slice(0, 5)) {
        // Limit to 5 images
        const cloudinaryUrl = await uploadImageToCloudinary(
          imageUrl,
          productData.name
        );
        if (cloudinaryUrl) {
          uploadedImages.push(cloudinaryUrl);
        }
      }
    }

    // Find or create manufacturer
    const manufacturerId = await findOrCreateManufacturer(
      brandName || productData.brand
    );

    // Find or create category
    const categoryId = await findOrCreateCategory(
      categoryName || productData.category
    );

    // Generate slug
    const baseSlug = slugify(productData.name || 'product', {
      lower: true,
      strict: true,
    });
    let slug = baseSlug;
    let counter = 1;

    // Ensure unique slug
    while (await Product.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Format images array - convert strings to objects if needed
    let formattedImages = [];
    if (uploadedImages.length > 0) {
      formattedImages = uploadedImages;
    } else if (productData.images && productData.images.length > 0) {
      formattedImages = productData.images.map((img, index) => {
        if (typeof img === 'string') {
          return {
            url: img,
            publicId: '',
            isPrimary: index === 0,
            alt: productData.name || 'Product image',
          };
        }
        return img; // Already an object
      });
    }

    // Create product document
    const newProduct = await Product.create({
      name: productData.name,
      slug,
      description: productData.description,
      price: productData.price || 0,
      compareAtPrice: productData.compareAtPrice,
      images: formattedImages,
      brand: manufacturerId,
      category: categoryId,
      stock: productData.stock || 0,
      sku: productData.sku,
      technicalSpecs: productData.specifications,
      isActive: true,
      isFeatured: false,
      dgdaInfo: {
        registered: false,
        registrationNumber: '',
      },
    });

    logger.info(`Successfully imported product: ${newProduct.name} (${newProduct._id})`);
    return { success: true, product: newProduct };
  } catch (error) {
    logger.error(`Failed to import product: ${productData.name}`, error);
    return { success: false, reason: error.message, product: null };
  }
}

/**
 * Main scraping function - scrape and import products
 */
async function scrapeAndImport(url, options = {}) {
  const {
    brandFilter = null,
    categoryName = 'Medical Equipment',
    isListingPage = false,
    maxProducts = 50,
    uploadImages = true,
  } = options;

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    products: [],
    errors: [],
  };

  try {
    let productUrls = [];

    if (isListingPage) {
      // Scrape listing page to get product URLs
      productUrls = await scrapeProductListing(url, brandFilter);
      productUrls = productUrls.slice(0, maxProducts); // Limit
    } else {
      // Single product page
      productUrls = [url];
    }

    results.total = productUrls.length;
    logger.info(`Starting import of ${productUrls.length} products...`);

    for (const productUrl of productUrls) {
      try {
        // Scrape product data
        const productData = await scrapeProductPage(productUrl);

        // Filter by brand if specified
        if (brandFilter) {
          const productBrand = productData.brand || '';
          if (!productBrand.toLowerCase().includes(brandFilter.toLowerCase())) {
            logger.info(`Skipping product (brand mismatch): ${productData.name}`);
            results.skipped++;
            continue;
          }
        }

        // Import product
        const importResult = await importProduct(productData, {
          brandName: brandFilter,
          categoryName,
          uploadImages,
          skipExisting: true,
        });

        if (importResult.success) {
          results.success++;
          results.products.push(importResult.product);
        } else if (importResult.reason === 'already_exists') {
          results.skipped++;
        } else {
          results.failed++;
          results.errors.push({
            url: productUrl,
            error: importResult.reason,
          });
        }

        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`Failed to process product: ${productUrl}`, error);
        results.failed++;
        results.errors.push({
          url: productUrl,
          error: error.message,
        });
      }
    }

    logger.info(
      `Import complete: ${results.success} success, ${results.failed} failed, ${results.skipped} skipped`
    );
    return results;
  } catch (error) {
    logger.error('Scraping and import failed', error);
    throw error;
  }
}

module.exports = {
  scrapeProductPage,
  scrapeProductListing,
  importProduct,
  scrapeAndImport,
  parsePrice,
  uploadImageToCloudinary,
  findOrCreateManufacturer,
  findOrCreateCategory,
};
