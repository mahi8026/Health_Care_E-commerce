/**
 * ReviewSchema Component
 * 
 * Generates JSON-LD structured data for product reviews following Schema.org/Review spec.
 * This helps Google show review stars and ratings in search results.
 * 
 * @see https://schema.org/Review
 * @see https://developers.google.com/search/docs/appearance/structured-data/review-snippet
 */

export default function ReviewSchema({ reviews, productName, productId }) {
  if (!reviews || reviews.length === 0) return null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://health-care-e-commerce-murex.vercel.app';

  // Create individual review schemas
  const reviewSchemas = reviews.slice(0, 5).map((review, index) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    '@id': `${baseUrl}/products/${productId}#review-${review._id || index}`,
    itemReviewed: {
      '@type': 'Product',
      name: productName,
      url: `${baseUrl}/products/${productId}`,
    },
    author: {
      '@type': 'Person',
      name: review.userName || review.user?.name || 'Verified Buyer',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.comment || review.review,
    datePublished: review.createdAt ? new Date(review.createdAt).toISOString() : new Date().toISOString(),
    publisher: {
      '@type': 'Organization',
      name: 'MedCore BD',
    },
  }));

  // Return array of review schemas
  return (
    <>
      {reviewSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
        />
      ))}
    </>
  );
}
