/**
 * ProductSchema Component
 * 
 * Generates JSON-LD structured data for product pages following Schema.org/Product spec.
 * This helps Google show rich snippets with price, availability, ratings in search results.
 * 
 * @see https://schema.org/Product
 * @see https://developers.google.com/search/docs/appearance/structured-data/product
 */

import { useMemo } from 'react';

export default function ProductSchema({ product }) {
  // Use useMemo to ensure date calculation happens once and is pure
  const schemaData = useMemo(() => {
    if (!product) return null;

    // Calculate aggregate rating if reviews exist
    const aggregateRating = product.reviews && product.reviews.length > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: product.averageRating || calculateAverageRating(product.reviews),
          reviewCount: product.reviews.length,
          bestRating: 5,
          worstRating: 1,
        }
      : null;

    // Determine availability based on stock
    const availability = product.stock > 0
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock';

    // Calculate price valid until date (90 days from now)
    const priceValidDate = new Date();
    priceValidDate.setDate(priceValidDate.getDate() + 90);
    const priceValidUntil = priceValidDate.toISOString().split('T')[0];

    // Build offer object
    const offer = {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://health-care-e-commerce-murex.vercel.app'}/products/${product._id}`,
      priceCurrency: 'BDT',
      price: product.finalPrice || product.price,
      priceValidUntil,
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'MedCore BD',
      },
    };

    // Add discount offer if product has a discount
    if (product.discount && product.discount > 0) {
      offer.priceSpecification = {
        '@type': 'UnitPriceSpecification',
        price: product.finalPrice || product.price,
        priceCurrency: 'BDT',
      };
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description || `${product.name} — ${product.brand || 'Medical Equipment'} available at MedCore BD Bangladesh. DGDA registered. Buy online with fast delivery.`,
      image: product.images?.map(img => img.url || img) || [],
      brand: product.brand
        ? {
            '@type': 'Brand',
            name: product.brand,
          }
        : undefined,
      manufacturer: product.manufacturer
        ? {
            '@type': 'Organization',
            name: product.manufacturer,
          }
        : undefined,
      sku: product.sku || product._id,
      mpn: product.mpn || product.sku || undefined,
      gtin: product.gtin || product.barcode || undefined,
      offers: offer,
      aggregateRating,
      // Additional product details
      category: product.category,
      model: product.model || undefined,
      // Medical equipment specific
      additionalProperty: product.specifications
        ? Object.entries(product.specifications).map(([name, value]) => ({
            '@type': 'PropertyValue',
            name,
            value,
          }))
        : undefined,
    };

    // Clean up undefined values
    Object.keys(schema).forEach(key => {
      if (schema[key] === undefined) {
        delete schema[key];
      }
    });

    return schema;
  }, [product]);

  if (!schemaData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData, null, 2) }}
    />
  );
}

/**
 * Calculate average rating from reviews array
 */
function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
  return (sum / reviews.length).toFixed(1);
}
