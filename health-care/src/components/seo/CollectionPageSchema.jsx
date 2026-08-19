import { escapeJsonLd } from '@/utils/helpers';
import { SITE_CONFIG } from '@/config/seo';

export default function CollectionPageSchema({
  name,
  description,
  numberOfItems,
  category,
  url
}) {
  if (!name) return null;

  const baseUrl = SITE_CONFIG.url;
  const collectionUrl = url || `${baseUrl}/products?category=${category || ''}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: escapeJsonLd(name),
    description: escapeJsonLd(description || `Browse ${name} at MediportBD. Wide selection of medical equipment and supplies in Bangladesh.`),
    url: collectionUrl,
    mainEntity: {
      '@type': 'ItemList',
      ...(numberOfItems > 0 && { numberOfItems }),
      itemListElement: []
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

export function ItemListSchema({ items, listName, numberOfItems }) {
  if (!items || items.length === 0) return null;

  const baseUrl = SITE_CONFIG.url;

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
        name: escapeJsonLd(item.name),
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

  const cleanSchema = JSON.parse(JSON.stringify(schema));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanSchema) }}
    />
  );
}
