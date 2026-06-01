import { generateProductSchema } from '@/utils/structuredData';

/**
 * ProductSchema — Product JSON-LD structured data component.
 *
 * Renders a `<script type="application/ld+json">` tag with a Schema.org
 * Product schema for rich search results (price, availability, ratings).
 *
 * The actual schema generation is delegated to `generateProductSchema()` in
 * `src/utils/structuredData.js` so the logic stays in one place.
 *
 * @param {Object} props
 * @param {Object} props.product - Product data object from the API
 * @param {string} props.product.name - Product name
 * @param {string} props.product.description - Product description
 * @param {Array}  [props.product.images] - Array of image objects or URLs
 * @param {string|Object} [props.product.brand] - Brand name or populated brand object
 * @param {string} [props.product.sku] - SKU identifier
 * @param {number} [props.product.price] - Price in BDT
 * @param {boolean} [props.product.inStock] - Stock availability
 * @param {string} [props.product.slug] - URL slug (preferred over _id for canonical)
 * @param {number|Object} [props.product.rating] - Rating value or { average, count }
 * @param {number} [props.product.reviewCount] - Number of reviews
 * @param {Array<string>} [props.product.certifications] - e.g. ['DGDA', 'CE', 'ISO 13485']
 *
 * @returns {React.Element|null} JSON-LD script tag, or null if product is invalid
 *
 * Requirements: 19.3, 19.4
 *
 * @example
 * // In a product detail page (Server Component):
 * import ProductSchema from '@/components/seo/ProductSchema';
 *
 * export default async function ProductPage({ params }) {
 *   const product = await fetchProduct(params.id);
 *   return (
 *     <>
 *       <ProductSchema product={product} />
 *       <ProductDetailPage productId={params.id} />
 *     </>
 *   );
 * }
 */
export default function ProductSchema({ product }) {
  if (!product) return null;

  const schema = generateProductSchema(product);
  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
