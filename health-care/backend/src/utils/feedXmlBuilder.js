// health-care/backend/src/utils/feedXmlBuilder.js

/**
 * feedXmlBuilder — pure functions for building the Google Merchant Center
 * XML product feed (RSS 2.0 + g: namespace).
 *
 * Kept free of database/models so it can be unit-tested in isolation.
 */

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html) {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value, maxLength) {
  const s = String(value ?? '').trim();
  return s.length > maxLength ? s.slice(0, maxLength - 1) + '\u2026' : s;
}

function formatBdt(amount) {
  return `${Number(amount || 0).toFixed(2)} BDT`;
}

function googleAvailability(product) {
  return Number(product.stock || 0) > 0 ? 'in stock' : 'out of stock';
}

function validGtin(product) {
  const raw = String(product.barcode || '').replace(/\D/g, '');
  return /^(8|12|13|14)$/.test(String(raw.length)) ? raw : null;
}

function buildProductXml(product, baseUrl) {
  const slug = product.slug || product._id;
  const images = Array.isArray(product.images) ? product.images : [];
  const primaryImage = images.find((img) => img && img.isPrimary) || images[0];
  const brandName = (product.brand && product.brand.name) || 'MediportBD';
  const categoryName = (product.category && product.category.name) || '';
  const gtin = validGtin(product);

  const lines = ['<item>'];
  lines.push(`<g:id>${escapeXml(product.sku)}</g:id>`);
  lines.push(`<g:title>${escapeXml(truncate(product.name, 150))}</g:title>`);
  lines.push(`<g:description>${escapeXml(truncate(stripHtml(product.description), 5000))}</g:description>`);
  lines.push(`<g:link>${escapeXml(`${baseUrl}/products/${slug}`)}</g:link>`);
  if (primaryImage && primaryImage.url) {
    lines.push(`<g:image_link>${escapeXml(primaryImage.url)}</g:image_link>`);
  }
  lines.push(`<g:availability>${googleAvailability(product)}</g:availability>`);
  lines.push(`<g:price>${formatBdt(product.price)}</g:price>`);
  lines.push('<g:condition>new</g:condition>');
  lines.push(`<g:brand>${escapeXml(brandName)}</g:brand>`);
  if (gtin) {
    lines.push(`<g:gtin>${gtin}</g:gtin>`);
  }
  lines.push(`<g:mpn>${escapeXml(product.sku)}</g:mpn>`);
  if (categoryName) {
    lines.push(`<g:product_type>${escapeXml(categoryName)}</g:product_type>`);
  }
  lines.push('</item>');
  return lines.join('\n');
}

function buildGoogleFeedXml(products, baseUrl) {
  const url = String(baseUrl || 'https://www.mediportbd.com').replace(/\/+$/, '');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '<channel>',
    '<title>MediportBD</title>',
    `<link>${escapeXml(url)}</link>`,
    '<description>Medical equipment, surgical instruments, laboratory reagents, and hospital supplies in Bangladesh.</description>',
    ...products.map((product) => buildProductXml(product, url)),
    '</channel>',
    '</rss>',
  ].join('\n');
}

module.exports = {
  escapeXml,
  stripHtml,
  truncate,
  formatBdt,
  googleAvailability,
  validGtin,
  buildProductXml,
  buildGoogleFeedXml,
};