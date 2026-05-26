import { SITE_CONFIG } from '@/config/seo';

/**
 * FAQSchema — FAQPage JSON-LD for product detail pages.
 *
 * Generates four specific FAQ entries for SEO optimization:
 * 1. Price in Bangladesh
 * 2. DGDA registration status
 * 3. Warranty terms
 * 4. Where to buy in Bangladesh
 *
 * Eligible for Google FAQ rich results.
 *
 * @param {{ product: Object }} props
 */
export default function FAQSchema({ product }) {
  if (!product) return null;

  // Determine price display
  const priceDisplay = product.price && product.price > 0
    ? `৳${product.price.toLocaleString()}`
    : 'Contact for Price';

  // Determine warranty information
  let warrantyInfo = '1 year manufacturer warranty';
  if (product.variants?.warranty && Array.isArray(product.variants.warranty) && product.variants.warranty.length > 0) {
    warrantyInfo = product.variants.warranty.join(', ');
  } else if (product.variants?.warranty && typeof product.variants.warranty === 'string') {
    warrantyInfo = product.variants.warranty;
  }

  const faqs = [
    {
      question: `What is the price of ${product.name} in Bangladesh?`,
      answer: product.price && product.price > 0
        ? `The price of ${product.name} in Bangladesh is ${priceDisplay}. B2B customers receive discounts up to 30%. Contact MedCore BD at ${SITE_CONFIG.phone} for bulk pricing.`
        : `Please contact MedCore BD at ${SITE_CONFIG.phone} or email ${SITE_CONFIG.email} for pricing information on ${product.name}.`,
    },
    {
      question: `Is ${product.name} DGDA registered?`,
      answer: `Yes, ${product.name} sold by MedCore BD is DGDA registered and certified for use in Bangladesh. All products meet regulatory requirements for medical equipment in Bangladesh.${product.certifications?.includes('CE') ? ' This product is also CE certified.' : ''}${product.certifications?.includes('ISO 13485') ? ' ISO 13485 quality management standards are maintained.' : ''}`,
    },
    {
      question: `What is the warranty for ${product.name}?`,
      answer: `${product.name} comes with ${warrantyInfo}. MedCore BD provides full after-sales support and service for all products. Contact us at ${SITE_CONFIG.phone} for warranty details.`,
    },
    {
      question: `Where can I buy ${product.name} in Bangladesh?`,
      answer: `You can buy ${product.name} from MedCore BD, an authorized medical equipment supplier in Bangladesh. We offer free delivery in Dhaka metro area on orders over ৳50,000 and nationwide shipping to Chittagong, Sylhet, Rajshahi, Khulna and other cities. Order online at ${SITE_CONFIG.url} or call ${SITE_CONFIG.phone}.`,
    },
  ];

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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
