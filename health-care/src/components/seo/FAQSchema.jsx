import { SITE_CONFIG } from '@/config/seo';

/**
 * FAQSchema — FAQPage JSON-LD for product detail pages.
 *
 * Generates context-aware FAQ entries based on the product's category,
 * price, certifications and delivery info. Eligible for Google FAQ rich results.
 *
 * @param {{ product: Object }} props
 */
export default function FAQSchema({ product }) {
  if (!product) return null;

  const brandName  = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;

  const faqs = [
    {
      question: `What is the price of ${product.name} in Bangladesh?`,
      answer:   `The retail price of ${product.name} in Bangladesh is ৳${product.price?.toLocaleString()}. B2B customers get up to 30% discount. Contact MedCore BD for bulk pricing at ${SITE_CONFIG.phone}.`,
    },
    {
      question: `Is ${product.name} DGDA approved in Bangladesh?`,
      answer:   `Yes, ${product.name} sold by MedCore BD is DGDA registered and certified for use in Bangladesh.${product.certifications?.includes('CE') ? ' It is also CE certified.' : ''}${product.certifications?.includes('ISO 13485') ? ' ISO 13485 quality management standards are maintained.' : ''}`,
    },
    {
      question: `Does MedCore BD deliver ${product.name} across Bangladesh?`,
      answer:   `Yes, MedCore BD delivers ${product.name} across Bangladesh including Dhaka, Chittagong, Sylhet, Rajshahi, Khulna and other cities. Free delivery on orders over ৳50,000 in Dhaka metro area.`,
    },
    ...(categoryName === 'Diagnostic Equipment' ? [{
      question: `Is free installation included with ${product.name}?`,
      answer:   `Yes, MedCore BD provides free installation and staff training for ${product.name} in Dhaka. For other cities, installation charges apply. Contact us at ${SITE_CONFIG.phone}.`,
    }] : []),
    ...(categoryName === 'Laboratory Reagents' ? [{
      question: `What analysers is ${product.name} compatible with?`,
      answer:   product.compatibleWith?.length > 0
        ? `${product.name} is compatible with: ${product.compatibleWith.join(', ')}.`
        : `Please contact MedCore BD at ${SITE_CONFIG.phone} to confirm analyser compatibility for ${product.name}.`,
    }] : []),
    ...(brandName ? [{
      question: `Is MedCore BD an authorised distributor of ${brandName} in Bangladesh?`,
      answer:   `Yes, MedCore BD is an authorised distributor of ${brandName} products in Bangladesh. All ${brandName} products sold by MedCore BD come with full manufacturer warranty and after-sales support.`,
    }] : []),
  ];

  const schema = {
    '@context': 'https://schema.org',
    '@type':    'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name:    faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text:    faq.answer,
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
