/**
 * AggregateRatingSchema — Google Rich Results for Product Ratings
 * 
 * Displays star ratings in Google search results for products with reviews.
 * Increases trust and click-through rate.
 * 
 * Note: This is typically included within ProductSchema, but can be used
 * standalone for pages that aren't full product pages (e.g., category pages
 * with product snippets).
 * 
 * @see https://schema.org/AggregateRating
 * @see https://developers.google.com/search/docs/appearance/structured-data/review-snippet
 */

export default function AggregateRatingSchema({ 
  itemName, 
  ratingValue, 
  reviewCount,
  bestRating = 5,
  worstRating = 1
}) {
  // Must have at least 1 review to show aggregate rating
  if (!reviewCount || reviewCount < 1 || !ratingValue) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: itemName,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: ratingValue.toString(),
      reviewCount: reviewCount.toString(),
      bestRating: bestRating.toString(),
      worstRating: worstRating.toString()
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
 * ReviewSchema — Individual review structured data
 * 
 * Displays individual reviews in Google search results.
 * Can be used for customer testimonials or detailed product reviews.
 */
export function ReviewSchema({ review, product }) {
  if (!review) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Product',
      name: product?.name || 'Medical Equipment',
      image: product?.images?.[0] || undefined
    },
    author: {
      '@type': 'Person',
      name: review.userName || review.user?.name || 'Customer'
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: (review.rating || 5).toString(),
      bestRating: '5',
      worstRating: '1'
    },
    reviewBody: review.comment || review.review || '',
    datePublished: review.createdAt || new Date().toISOString(),
    publisher: {
      '@type': 'Organization',
      name: 'MediportBD'
    }
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

/**
 * Helper function to calculate aggregate rating from reviews array
 */
export function calculateAggregateRating(reviews) {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return null;
  }

  const totalRating = reviews.reduce((sum, review) => {
    const rating = review.rating || 0;
    return sum + rating;
  }, 0);

  const averageRating = totalRating / reviews.length;

  return {
    ratingValue: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    reviewCount: reviews.length,
    bestRating: 5,
    worstRating: 1
  };
}
