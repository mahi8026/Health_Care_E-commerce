/**
 * CollectionPageSchema — Google Rich Results for Category/Collection Pages
 * 
 * Displays collection information in Google search results.
 * Shows the collection of products in a category with metadata.
 * 
 * @see https://schema.org/CollectionPage
 * @see https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 */

export default function CollectionPageSchema({ 
  name, 
  description, 
  numberOfItems,
  category,
  url 
}) {
  if (!name) return null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medcorebd.com';
  const collectionUrl = url || `${baseUrl}/products?category=${category || ''}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description: description || `Browse ${name} at MedCore BD. Wide selection of medical equipment and supplies in Bangladesh.`,
    url: collectionUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: numberOfItems || 0,
      itemListElement: [] // Products will be added dynamically if needed
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
          name,
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
 * ItemListSchema — For product listings with specific products
 * 
 * Use this when you want to list specific products in search results
 */
export function ItemListSchema({ items, listName, numberOfItems }) {
  if (!items || items.length === 0) return null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medcorebd.com';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName || 'Products',
    numberOfItems: numberOfItems || items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: item.name,
        image: item.images?.[0] || item.image,
        url: `${baseUrl}/products/${item._id || item.slug}`,
        offers: item.price ? {
          '@type': 'Offer',
          price: item.price.toString(),
          priceCurrency: 'BDT',
          availability: item.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
        } : undefined
      }
    }))
  };

  // Clean undefined values
  const cleanSchema = JSON.parse(JSON.stringify(schema));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanSchema) }}
    />
  );
}
