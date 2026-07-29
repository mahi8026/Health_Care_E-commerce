/**
 * FAQSchema — Google Rich Results for FAQ
 * 
 * Displays frequently asked questions in Google search results with expandable answers.
 * Increases visibility and click-through rate.
 * 
 * @see https://schema.org/FAQPage
 * @see https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */

import { escapeJsonLd } from '@/utils/helpers';

export default function FAQSchema({ faqs }) {
  if (!faqs || !Array.isArray(faqs) || faqs.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: escapeJsonLd(faq.question),
      acceptedAnswer: {
        '@type': 'Answer',
        text: escapeJsonLd(faq.answer)
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Common product FAQs for medical equipment
 * Use these when product doesn't have custom FAQs
 */
export const COMMON_PRODUCT_FAQS = [
  {
    question: 'Is this product DGDA registered?',
    answer: 'Yes, all our products are DGDA (Directorate General of Drug Administration) registered and comply with Bangladesh medical equipment regulations.'
  },
  {
    question: 'What is the warranty period?',
    answer: 'We provide manufacturer warranty ranging from 1 to 3 years depending on the product. Extended warranty options are available for most equipment.'
  },
  {
    question: 'Do you provide installation and training?',
    answer: 'Yes, we provide free installation and staff training for all diagnostic equipment in Dhaka metro area. For other locations, installation is available at nominal charges.'
  },
  {
    question: 'What is the delivery time?',
    answer: 'Delivery within Dhaka takes 1-2 business days. For other regions in Bangladesh, it takes 3-5 business days. Express delivery options are available.'
  },
  {
    question: 'Do you offer EMI or payment plans?',
    answer: 'Yes, we offer flexible EMI options for B2B customers and payment plans for purchases above ৳50,000. Contact our sales team for details.'
  },
  {
    question: 'Is technical support available after purchase?',
    answer: 'Yes, we provide 24/7 technical support for all equipment. Our trained engineers are available for on-site service and remote troubleshooting.'
  }
];

/**
 * Category-specific FAQs
 */
export const CATEGORY_FAQS = {
  'diagnostic-equipment': [
    {
      question: 'What diagnostic equipment do you supply?',
      answer: 'We supply ECG machines, ultrasound machines, X-ray systems, CT scanners, patient monitors, and other diagnostic equipment from leading brands like GE, Siemens, Philips, and Mindray.'
    },
    {
      question: 'Do you service existing equipment?',
      answer: 'Yes, we provide annual maintenance contracts (AMC) and on-demand repair services for all diagnostic equipment, regardless of where it was purchased.'
    },
    {
      question: 'Are spare parts available?',
      answer: 'Yes, we maintain stock of genuine spare parts for all equipment we sell and provide spare parts for other brands on order basis.'
    }
  ],
  'laboratory-reagents': [
    {
      question: 'How do you ensure cold chain delivery for reagents?',
      answer: 'We use temperature-controlled packaging and refrigerated vehicles for all reagent deliveries. Temperature monitoring is done throughout transit to maintain 2-8°C.'
    },
    {
      question: 'What is the shelf life of the reagents?',
      answer: 'Most reagents have 12-24 months shelf life from manufacturing date. We only supply reagents with minimum 6 months validity remaining.'
    },
    {
      question: 'Do you supply reagents for all analyzer brands?',
      answer: 'Yes, we supply reagents for all major analyzer brands including Roche, Abbott, Siemens, Beckman Coulter, and Mindray. Both original and compatible reagents available.'
    }
  ],
  'surgical-instruments': [
    {
      question: 'Are the surgical instruments autoclavable?',
      answer: 'Yes, all our surgical instruments are made from medical-grade stainless steel and are fully autoclavable at 134°C for sterilization.'
    },
    {
      question: 'Do you supply custom surgical instrument sets?',
      answer: 'Yes, we can prepare custom surgical sets based on your hospital or clinic requirements. Contact our sales team with your instrument list.'
    },
    {
      question: 'What material are the instruments made of?',
      answer: 'Our instruments are made from German or Japanese surgical-grade stainless steel (SS 304 or SS 316) with lifetime rust-free guarantee.'
    }
  ]
};

/**
 * Helper function to generate product-specific FAQs
 * Combines common FAQs with product-specific ones
 */
export function generateProductFAQs(product) {
  const faqs = [];

  // Add product-specific FAQs if available
  if (product.faqs && Array.isArray(product.faqs) && product.faqs.length > 0) {
    faqs.push(...product.faqs);
  }

  // Add category-specific FAQs
  const categorySlug = typeof product.category === 'object'
    ? product.category.slug
    : product.category?.toLowerCase().replace(/\s+/g, '-');

  if (categorySlug && CATEGORY_FAQS[categorySlug]) {
    faqs.push(...CATEGORY_FAQS[categorySlug].slice(0, 3)); // Add first 3 category FAQs
  }

  // Add common FAQs (if total is less than 6)
  const remainingSlots = 6 - faqs.length;
  if (remainingSlots > 0) {
    faqs.push(...COMMON_PRODUCT_FAQS.slice(0, remainingSlots));
  }

  return faqs;
}
