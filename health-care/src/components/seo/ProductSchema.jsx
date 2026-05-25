import { generateProductSchema, StructuredData } from '@/utils/structuredData';

/**
 * ProductSchema — Product JSON-LD for product detail pages.
 *
 * Renders a <script type="application/ld+json"> with full Product schema
 * including AggregateRating (enables star ratings in Google search results),
 * all product images, certifications, and a properly-priced Offer block.
 *
 * Usage:
 *   <ProductSchema product={product} />
 *
 * @param {{ product: Object }} props
 */
export default function ProductSchema({ product }) {
  if (!product) return null;

  const schema = generateProductSchema(product);
  if (!schema) return null;

  return <StructuredData schema={schema} />;
}
