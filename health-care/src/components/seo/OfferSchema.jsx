/**
 * OfferSchema — Google Rich Results for Special Offers & Discounts
 * 
 * Displays price drops, discounts, and special offers in Google search results.
 * Shows original price, discounted price, and validity period.
 * 
 * @see https://schema.org/Offer
 * @see https://developers.google.com/search/docs/appearance/structured-data/product#offer
 */

import { useMemo } from 'react';

export default function OfferSchema({ product, offer }) {
  if (!product || !offer) return null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medcorebd.com';
  const productUrl = `${baseUrl}/products/${product._id || product.slug}`;
  
  // Memoize default validity date to avoid impurity issues
  const defaultValidUntil = useMemo(() => {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }, []);

  // Calculate discount percentage if not provided
  const discountPercentage = offer.discountPercentage || 
    (offer.originalPrice && offer.discountedPrice
      ? Math.round(((offer.originalPrice - offer.discountedPrice) / offer.originalPrice) * 100)
      : 0);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images?.[0] || `${baseUrl}/images/placeholder-product.jpg`,
    description: product.description || product.shortDescription || product.name,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'BDT',
      price: (offer.discountedPrice || offer.price || product.price).toString(),
      priceValidUntil: offer.validUntil || defaultValidUntil,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'MedCore BD',
        url: baseUrl
      }
    }
  };

  // Add price specification for showing discount
  if (offer.originalPrice && offer.discountedPrice && offer.originalPrice > offer.discountedPrice) {
    schema.offers.priceSpecification = {
      '@type': 'UnitPriceSpecification',
      price: offer.discountedPrice.toString(),
      priceCurrency: 'BDT',
      valueAddedTaxIncluded: false
    };

    // Add original price as additional property
    schema.offers.eligibleQuantity = {
      '@type': 'QuantitativeValue',
      value: '1'
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * AggregateOfferSchema — For products with multiple offers/variants
 * 
 * Use when product has multiple pricing options (e.g., different sizes, bulk pricing)
 */
export function AggregateOfferSchema({ product, offers }) {
  if (!product || !offers || offers.length === 0) return null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medcorebd.com';
  const productUrl = `${baseUrl}/products/${product._id || product.slug}`;

  // Find lowest and highest prices
  const prices = offers.map(o => o.price || o.discountedPrice || 0);
  const lowPrice = Math.min(...prices);
  const highPrice = Math.max(...prices);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images?.[0] || `${baseUrl}/images/placeholder-product.jpg`,
    description: product.description || product.shortDescription || product.name,
    offers: {
      '@type': 'AggregateOffer',
      url: productUrl,
      priceCurrency: 'BDT',
      lowPrice: lowPrice.toString(),
      highPrice: highPrice.toString(),
      offerCount: offers.length.toString(),
      offers: offers.map(offer => ({
        '@type': 'Offer',
        price: (offer.price || offer.discountedPrice).toString(),
        priceCurrency: 'BDT',
        availability: offer.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'MedCore BD'
        }
      }))
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
 * Helper function to check if product has active discount
 */
export function hasActiveDiscount(product) {
  if (!product) return false;

  // Check if product has discount fields
  if (product.originalPrice && product.sellingPrice && product.originalPrice > product.sellingPrice) {
    return true;
  }

  // Check if product has offer object
  if (product.offer && product.offer.discountedPrice && product.offer.originalPrice) {
    const now = new Date();
    const validUntil = product.offer.validUntil ? new Date(product.offer.validUntil) : null;
    
    // Check if offer is still valid
    if (!validUntil || validUntil > now) {
      return true;
    }
  }

  // Check if product has discount percentage
  if (product.discount && product.discount > 0) {
    return true;
  }

  return false;
}

/**
 * Helper function to generate offer data from product
 */
export function generateOfferFromProduct(product) {
  if (!product) return null;

  const originalPrice = product.originalPrice || product.mrp || product.price;
  const discountedPrice = product.sellingPrice || product.discountedPrice || product.price;
  
  if (!originalPrice || !discountedPrice) return null;

  // Only return offer if there's an actual discount
  if (originalPrice <= discountedPrice) return null;

  return {
    originalPrice,
    discountedPrice,
    discountPercentage: Math.round(((originalPrice - discountedPrice) / originalPrice) * 100),
    validUntil: product.offerValidUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };
}
