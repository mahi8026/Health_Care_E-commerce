/**
 * FAQSchema Component
 * 
 * Generates JSON-LD structured data for FAQ section following Schema.org/FAQPage spec.
 * This helps Google show FAQ rich snippets in search results.
 * 
 * @see https://schema.org/FAQPage
 * @see https://developers.google.com/search/docs/appearance/structured-data/faqpage
 * 
 * @example
 * <FAQSchema
 *   faqs={[
 *     {
 *       question: 'Is this product DGDA certified?',
 *       answer: 'Yes, all our products are DGDA registered and certified.'
 *     },
 *     {
 *       question: 'What is the warranty period?',
 *       answer: '1 year manufacturer warranty with free service.'
 *     }
 *   ]}
 * />
 */

export default function FAQSchema({ faqs }) {
  if (!faqs || faqs.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
    />
  );
}
