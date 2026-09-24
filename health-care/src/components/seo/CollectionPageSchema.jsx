import { escapeJsonLd } from '@/utils/helpers';
import { SITE_CONFIG } from '@/config/seo';

/**
 * Positive-price guard shared by every ItemList producer in this module.
 *
 * Only a real, finite, strictly positive price may become an Offer: "0",
 * "0.00", "", null, negative and junk strings are all rejected, so quote-only
 * / price-less products never receive a zero-price Offer in structured data.
 *
 * @param {unknown} price - raw price value from a listing payload
 * @returns {number|null} the price to publish, or null when no Offer is allowed
 */
function toOfferPrice(price) {
  const value = typeof price === 'number'
    ? price
    : (typeof price === 'string' && price.trim() !== '') ? parseFloat(price) : NaN;
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * @param {unknown} item - a product row from the server-rendered listing
 * @param {string} baseUrl - canonical site origin
 * @returns {string|null} canonical /products/<slug> URL, or null when the item
 *          has no usable slug (never an ID-based, self or invalid URL)
 */
function canonicalProductUrl(item, baseUrl) {
  const slug = typeof item?.slug === 'string' ? item.slug.trim() : '';
  if (!slug) return null;
  return `${baseUrl}/products/${slug}`;
}

/**
 * @param {unknown} item - a product row from the server-rendered listing
 * @returns {string|null} a usable image URL, or null when no valid image data
 *          exists (the key is then omitted entirely)
 */
function usableImage(item) {
  const raw = item?.images?.[0] ?? item?.image;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed || null;
  }
  if (raw && typeof raw === 'object' && typeof raw.url === 'string') {
    const trimmed = raw.url.trim();
    return trimmed || null;
  }
  return null;
}

/**
 * Single source of truth for ItemList `itemListElement` entries.
 *
 * Used by BOTH CollectionPage.mainEntity (category landing pages) and the
 * standalone ItemListSchema — there is deliberately no second implementation.
 * Ordering is deterministic: entries keep the supplied listing order (the API
 * order the category page renders server-side), positions are contiguous 1..n,
 * duplicate URLs are collapsed, and items without a slug or name are skipped.
 *
 * @param {unknown[]} items - products exactly as supplied to the page grid
 * @param {string} [baseUrl=SITE_CONFIG.url] - canonical site origin
 * @returns {Object[]} schema.org ListItem entries
 */
export function buildItemListElements(items, baseUrl = SITE_CONFIG.url) {
  if (!Array.isArray(items)) return [];

  const seen = new Set();
  const elements = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const name = typeof item.name === 'string' ? item.name.trim() : '';
    if (!name) continue;

    const url = canonicalProductUrl(item, baseUrl);
    if (!url || seen.has(url)) continue;
    seen.add(url);

    const image = usableImage(item);
    const price = toOfferPrice(item.price);

    elements.push({
      '@type': 'ListItem',
      position: elements.length + 1,
      item: {
        '@type': 'Product',
        name: escapeJsonLd(name),
        ...(image && { image }),
        url,
        ...(price !== null && {
          offers: {
            '@type': 'Offer',
            price: price.toString(),
            priceCurrency: 'BDT',
            availability: item.stock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          },
        }),
      },
    });
  }

  return elements;
}

/**
 * CollectionPage + BreadcrumbList for category landing pages.
 *
 * @param {Object}   props
 * @param {string}   props.name            - collection name (required)
 * @param {string}   [props.description]   - meta description
 * @param {number}   [props.numberOfItems] - fallback count when no items given
 * @param {string}   [props.category]      - fallback query-string category name
 * @param {string}   [props.url]           - canonical collection URL
 * @param {Object[]} [props.items]         - products rendered by this page;
 *                                           they populate mainEntity.ItemList so
 *                                           the schema describes the actual
 *                                           server-rendered listing (max 20 rows)
 */
export default function CollectionPageSchema({
  name,
  description,
  numberOfItems,
  category,
  url,
  items
}) {
  if (!name) return null;

  const baseUrl = SITE_CONFIG.url;
  const collectionUrl = url || `${baseUrl}/products?category=${category || ''}`;
  const itemListElement = buildItemListElements(items, baseUrl);
  // With items supplied, numberOfItems is the emitted count (never an invented
  // catalogue total); without items the legacy prop value is preserved.
  const declaredCount = itemListElement.length > 0 ? itemListElement.length : numberOfItems;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: escapeJsonLd(name),
    description: escapeJsonLd(description || `Browse ${name} at MediportBD. Wide selection of medical equipment and supplies in Bangladesh.`),
    url: collectionUrl,
    mainEntity: {
      '@type': 'ItemList',
      ...(declaredCount > 0 && { numberOfItems: declaredCount }),
      itemListElement
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Products',
          item: `${baseUrl}/products`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: escapeJsonLd(name),
          item: collectionUrl
        }
      ]
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Standalone ItemList (kept for API compatibility; emits nothing when empty).
 *
 * Shares {@link buildItemListElements} with CollectionPageSchema so both
 * produce identical entries — no duplicated schema logic.
 */
export function ItemListSchema({ items, listName, numberOfItems }) {
  const itemListElement = buildItemListElements(items);
  if (itemListElement.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName || 'Products',
    numberOfItems: numberOfItems || itemListElement.length,
    itemListElement
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
