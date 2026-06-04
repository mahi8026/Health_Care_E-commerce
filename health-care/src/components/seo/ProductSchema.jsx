/**
 * ProductSchema — Google Rich Results for Products
 * 
 * Displays product information in Google search results with:
 * - Product name, image, description
 * - Price, currency, availability
 * - Brand, SKU, GTIN
 * - Aggregate rating (stars in search results)
 * - Seller information
 * 
 * @see https://schema.org/Product
 * @see https://developers.google.com/search/docs/appearance/structured-data/product
 */

import { useMemo } from 'react';

export default function ProductSchema({ product }) {
  if (!product) return null;

  // Calculate price valid until date (30 days from now) - memoized to avoid impurity
  const priceValidUntil = useMemo(() => {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }, []);

  // Extract product data safely
  const name = product.name || 'Medical Equipment';
  const description = product.description || product.shortDescription || name;
  const brand = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const category = typeof product.category === 'object' ? product.category?.name : product.category;
  
  // Get first image or fallback
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images.map(img => {
        const url = typeof img === 'string' ? img : img?.url;
        // Ensure absolute URLs for schema
        return url?.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://medcorebd.com'}${url}`;
      })
    : [`${process.env.NEXT_PUBLIC_SITE_URL || 'https://medcorebd.com'}/images/placeholder-product.jpg`];

  // Price and availability
  const price = product.price || product.sellingPrice || 0;
  const availability = product.stock > 0 
    ? 'https://schema.org/InStock' 
    : 'https://schema.org/OutOfStock';

  // Rating data
  const rating = typeof product.rating === 'object' 
    ? product.rating 
    : { average: product.rating || 0, count: product.reviewCount || 0 };

  // SKU and identifiers
  const sku = product.sku || product._id?.toString() || 'N/A';
  const gtin = product.gtin || product.barcode || undefined;

  // Build schema object
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: description.substring(0, 500), // Limit to 500 chars
    image: images,
    brand: brand ? {
      '@type': 'Brand',
      name: brand
    } : undefined,
    category,
    sku,
    gtin,
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://medcorebd.com'}/products/${product._id || product.slug}`,
      priceCurrency: 'BDT',
      price: price.toString(),
      availability,
      seller: {
        '@type': 'Organization',
        name: 'MedCore BD',
        url: process.env.NEXT_PUBLIC_SITE_URL || 'https://medcorebd.com'
      },
      priceValidUntil, // 30 days from now
      itemCondition: 'https://schema.org/NewCondition',
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'BD'
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          businessDays: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          },
          cutoffTime: '17:00',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 2,
            unitCode: 'DAY'
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY'
          }
        }
      }
    }
  };

  // Add aggregate rating if available
  if (rating?.count > 0 && rating?.average > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.average.toString(),
      reviewCount: rating.count.toString(),
      bestRating: '5',
      worstRating: '1'
    };
  }

  // Add review if available
  if (product.reviews && Array.isArray(product.reviews) && product.reviews.length > 0) {
    schema.review = product.reviews.slice(0, 5).map(review => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.userName || review.user?.name || 'Customer'
      },
      datePublished: review.createdAt || new Date().toISOString(),
      reviewBody: review.comment || review.review || '',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: (review.rating || 5).toString(),
        bestRating: '5',
        worstRating: '1'
      }
    }));
  }

  // Clean undefined values
  const cleanSchema = JSON.parse(JSON.stringify(schema));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanSchema) }}
    />
  );
}
