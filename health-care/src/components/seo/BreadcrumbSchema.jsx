/**
 * BreadcrumbSchema Component
 * 
 * Generates JSON-LD structured data for breadcrumb navigation following Schema.org/BreadcrumbList spec.
 * This helps Google show breadcrumb trails in search results.
 * 
 * @see https://schema.org/BreadcrumbList
 * @see https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 * 
 * @example
 * <BreadcrumbSchema
 *   items={[
 *     { name: 'Home', url: '/' },
 *     { name: 'Products', url: '/products' },
 *     { name: 'ECG Machine', url: '/products/123' }
 *   ]}
 * />
 */

export default function BreadcrumbSchema({ items }) {
  if (!items || items.length === 0) return null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://health-care-e-commerce-murex.vercel.app';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
    />
  );
}
