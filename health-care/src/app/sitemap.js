/**
 * Sitemap Generator for MedCore BD
 *
 * Next.js App Router convention: this file is automatically picked up
 * and served at /sitemap.xml by the framework.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.6
 */

import { siteConfig } from '@/config/seo'
import { API } from '@/constants/api';

// Inline fetch helper — replaces the deleted serverFetch utility
async function fetchProducts() {
  const res = await fetch(`${API}/products?limit=200&page=1`, {
    next: { revalidate: 3600 }, // revalidate every hour
  });
  if (!res.ok) throw new Error(`Products fetch failed: ${res.status}`);
  const data = await res.json();
  return data.products || data.data?.products || [];
}

/**
 * Generate sitemap entries for all public pages.
 *
 * Includes:
 *  - Static pages with fixed priority and changeFrequency values
 *  - Dynamic product detail pages fetched from the database
 *
 * If the product fetch fails, only static pages are returned so the
 * sitemap is always available (Requirement 7.1, error-handling per design).
 *
 * @returns {Promise<Array<{url: string, lastModified?: Date, changeFrequency: string, priority: number}>>}
 */
export default async function sitemap() {
  const baseUrl = siteConfig.url

  // Static pages — always included regardless of database availability
  const staticPages = [
    {
      url: baseUrl,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/reagent-store`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/mobile-app`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/register`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  // Dynamic product pages — fetched from the database
  try {
    const products = await fetchProducts()

    const productPages = products.map((product) => ({
      url: `${baseUrl}/products/${product._id}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    return [...staticPages, ...productPages]
  } catch (error) {
    // Gracefully degrade — return static pages only so the sitemap is
    // always accessible even when the database is unavailable.
    console.error('[sitemap] Failed to fetch products for sitemap:', error.message)
    return staticPages
  }
}
