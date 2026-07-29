/**
 * BreadcrumbSchema — Google Rich Results for Breadcrumb Navigation
 * 
 * Displays breadcrumb navigation in Google search results for better UX.
 * Shows the page hierarchy: Home → Category → Subcategory → Product
 * 
 * @see https://schema.org/BreadcrumbList
 * @see https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 */

import { escapeJsonLd } from '@/utils/helpers';

export default function BreadcrumbSchema({ items }) {
  if (!items || !Array.isArray(items) || items.length === 0) return null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://MediportBD.com';

  // Build breadcrumb list
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: escapeJsonLd(item.name || item.label),
      item: item.url?.startsWith('http') 
        ? item.url 
        : `${baseUrl}${item.url || item.path || '/'}`
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Helper function to generate breadcrumb items for product pages
 * 
 * @param {Object} product - Product object
 * @returns {Array} Breadcrumb items array
 * 
 * @example
 * const breadcrumbs = generateProductBreadcrumbs(product);
 * <BreadcrumbSchema items={breadcrumbs} />
 */
export function generateProductBreadcrumbs(product) {
  const items = [
    { name: 'Home', url: '/' }
  ];

  // Add category if available
  if (product.category) {
    const categoryName = typeof product.category === 'object' 
      ? product.category.name 
      : product.category;
    const categorySlug = typeof product.category === 'object'
      ? product.category.slug
      : product.category.toLowerCase().replace(/\s+/g, '-');

    items.push({
      name: categoryName,
      url: `/products?category=${categorySlug}`
    });
  }

  // Add subcategory if available
  if (product.subcategory) {
    const subcategoryName = typeof product.subcategory === 'object'
      ? product.subcategory.name
      : product.subcategory;
    
    items.push({
      name: subcategoryName,
      url: `/products?category=${product.category?.slug || ''}&subcategory=${product.subcategory?.slug || ''}`
    });
  }

  // Add product as final item
  items.push({
    name: product.name,
    url: `/products/${product._id || product.slug}`
  });

  return items;
}

/**
 * Helper function to generate breadcrumb items for category pages
 * 
 * @param {string} categoryName - Category name
 * @param {string} categorySlug - Category slug
 * @returns {Array} Breadcrumb items array
 */
export function generateCategoryBreadcrumbs(categoryName, categorySlug) {
  return [
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: categoryName, url: `/products?category=${categorySlug}` }
  ];
}

/**
 * Helper function to generate breadcrumb items for search pages
 * 
 * @param {string} query - Search query
 * @returns {Array} Breadcrumb items array
 */
export function generateSearchBreadcrumbs(query) {
  return [
    { name: 'Home', url: '/' },
    { name: 'Search', url: '/search' },
    { name: `Results for "${query}"`, url: `/search?q=${encodeURIComponent(query)}` }
  ];
}
