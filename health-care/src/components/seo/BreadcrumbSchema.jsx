import { generateBreadcrumbSchema, StructuredData } from '@/utils/structuredData';

/**
 * BreadcrumbSchema — BreadcrumbList JSON-LD component.
 *
 * Renders a <script type="application/ld+json"> with a BreadcrumbList schema.
 * Eligible for Google breadcrumb rich results in search snippets.
 *
 * Usage:
 *   <BreadcrumbSchema
 *     items={[
 *       { name: 'Home',     url: 'https://medcorebd.com' },
 *       { name: 'Products', url: 'https://medcorebd.com/products' },
 *       { name: 'ECG Machine', url: 'https://medcorebd.com/products/siemens-ecg' },
 *     ]}
 *   />
 *
 * @param {{ items: Array<{ name: string, url: string }> }} props
 */
export default function BreadcrumbSchema({ items }) {
  if (!items?.length) return null;

  const schema = generateBreadcrumbSchema(items);
  if (!schema) return null;

  return <StructuredData schema={schema} />;
}
