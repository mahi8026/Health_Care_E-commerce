/**
 * Google Merchant Center Product Feed
 * 
 * Generates an RSS/XML feed of all products for Google Shopping.
 * Automatically updates every time Google fetches it.
 * 
 * Feed URL: https://www.mediportbd.com/api/merchant-feed
 */

import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.mediportbd.com/api';
const SITE_URL = 'https://www.mediportbd.com';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateProductXml(product) {
  const productUrl = `${SITE_URL}/products/${product.slug || product._id}`;
  const imageUrl = product.images?.[0] || product.image || `${SITE_URL}/Mediport_Logo.png`;
  const price = product.price || 0;
  const inStock = product.stock > 0 ? 'in stock' : 'out of stock';
  const brand = product.brand || product.manufacturer || 'MediportBD';
  const category = product.category?.name || 'Medical Equipment';
  
  return `
    <item>
      <g:id>${escapeXml(product._id)}</g:id>
      <g:title>${escapeXml(product.name)}</g:title>
      <g:description>${escapeXml(product.description || product.shortDescription || product.name)}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${escapeXml(inStock)}</g:availability>
      <g:price>${price} BDT</g:price>
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:google_product_category>Health &amp; Beauty &gt; Health Care</g:google_product_category>
      <g:product_type>${escapeXml(category)}</g:product_type>
      <g:mpn>${escapeXml(product.sku || product._id)}</g:mpn>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;
}

export async function GET() {
  try {
    // Fetch all products from backend
    const response = await fetch(`${API_BASE}/products?limit=1000&fields=_id,name,slug,description,shortDescription,price,stock,images,image,brand,manufacturer,category,sku`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const data = await response.json();
    const products = data.data?.products || data.products || [];

    // Generate XML feed
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>MediportBD - Medical Equipment Bangladesh</title>
    <link>${SITE_URL}</link>
    <description>DGDA certified medical equipment, surgical instruments, laboratory reagents and hospital machines in Bangladesh. 350+ products from Siemens, GE, Roche, Abbott and more.</description>
    ${products.map(generateProductXml).join('')}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Error generating merchant feed:', error);
    
    // Return minimal valid XML on error
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>MediportBD - Medical Equipment Bangladesh</title>
    <link>${SITE_URL}</link>
    <description>Medical equipment supplier in Bangladesh</description>
  </channel>
</rss>`;

    return new NextResponse(errorXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=600',
      },
    });
  }
}
