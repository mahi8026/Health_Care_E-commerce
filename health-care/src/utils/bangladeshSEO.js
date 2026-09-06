/**
 * Bangladesh SEO Utility Functions
 * 
 * Helper functions for implementing Bangladesh-specific SEO optimizations
 * including Bengali alt text, meta descriptions, and structured data
 */

import { 
  BENGALI_TERMS, 
  BENGALI_META_TEMPLATES,
  BENGALI_CATEGORIES,
  BENGALI_CITIES,
  formatBengaliNumber,
  PHONE_BENGALI,
  PHONE_ENGLISH
} from '@/config/bengali-content';

import {
  BANGLADESH_CONTENT_TEMPLATES,
  BANGLADESH_TRUST_SIGNALS,
  BANGLADESH_KEYWORDS
} from '@/config/bangladesh-seo';

/**
 * Generate SEO-optimized alt text for product images (bilingual)
 * Includes product name, brand, price, and Bangladesh keyword
 */
export function generateProductAltText(product, imageType = 'main') {
  const { name, brand, price, category } = product;
  
  // Get Bengali category name if available
  const categoryBn = BENGALI_CATEGORIES[category] || category;
  
  // Format price in BDT
  const priceFormatted = price ? `৳${price.toLocaleString('en-BD')}` : '';
  
  // Image type specific text
  const imageTypeText = {
    main: '',
    gallery: 'front view',
    side: 'side view',
    detail: 'detailed view',
    packaging: 'packaging',
  };
  
  const typeText = imageTypeText[imageType] || '';
  
  // English alt text (primary)
  const altTextEn = [
    name,
    brand && `by ${brand}`,
    typeText,
    priceFormatted && `Price ${priceFormatted}`,
    'Bangladesh',
    '— MediportBD'
  ].filter(Boolean).join(' ');
  
  // Bengali category for additional SEO value
  const altTextBn = categoryBn ? ` (${categoryBn})` : '';
  
  return `${altTextEn}${altTextBn}`;
}

/**
 * Generate category image alt text (bilingual)
 */
export function generateCategoryAltText(category, location = 'Bangladesh') {
  const categoryBn = BENGALI_CATEGORIES[category] || category;
  
  return `${category} supplier ${location} — MediportBD (${categoryBn})`;
}

/**
 * Generate location-specific alt text
 */
export function generateLocationAltText(city, imageType = 'hero') {
  const cityBn = BENGALI_CITIES[city] || city;
  
  const imageTypes = {
    hero: `Medical equipment supplier in ${city} — MediportBD (${cityBn})`,
    delivery: `Free delivery in ${city} (${cityBn}) — Fast medical equipment delivery`,
    hospital: `${city} hospitals trust MediportBD — Medical equipment supplier`,
  };
  
  return imageTypes[imageType] || imageTypes.hero;
}

/**
 * Generate Bangladesh-optimized meta description
 * Includes trust signals, pricing, and local keywords
 */
export function generateBangladeshMetaDescription(data) {
  const { type, name, price, category, city } = data;
  
  switch (type) {
    case 'product':
      return `Buy ${name} in Bangladesh at ${price ? `৳${price.toLocaleString('en-BD')}` : 'best price'}. ✓ DGDA certified ✓ Free delivery Dhaka ✓ Warranty ✓ Installation. Best ${category} supplier. Call: ${PHONE_ENGLISH}`;
    
    case 'category':
      return `Buy ${name} in Bangladesh ✓ 350+ products ✓ DGDA certified ✓ Free delivery Dhaka ✓ 8-30% B2B discount ✓ EMI available. Call: ${PHONE_ENGLISH}`;
    
    case 'location':
      return `Medical equipment supplier in ${city} Bangladesh ✓ DGDA registered ✓ Free delivery ✓ Installation service ✓ 500+ hospitals trust us. Call: ${PHONE_ENGLISH}`;
    
    case 'b2b':
      return `B2B medical equipment supplier Bangladesh ✓ 8-30% bulk discount ✓ 30-90 day credit ✓ DGDA certified ✓ 500+ hospitals served. Call: ${PHONE_ENGLISH}`;
    
    default:
      return `Medical equipment supplier Bangladesh ✓ DGDA certified ✓ 350+ products ✓ Free delivery Dhaka ✓ Warranty. Call: ${PHONE_ENGLISH}`;
  }
}

/**
 * Generate bilingual meta description (English + Bengali hint)
 */
export function generateBilingualMetaDescription(data) {
  const englishMeta = generateBangladeshMetaDescription(data);
  
  // Add Bengali phone for better CTR from Bengali speakers
  return `${englishMeta} | কল করুন: ${PHONE_BENGALI}`;
}

/**
 * Generate Bangladesh-optimized page title
 */
export function generateBangladeshTitle(data) {
  const { type, name, price, category, city } = data;
  
  switch (type) {
    case 'product':
      if (price) {
        return `${name} Price ৳${price.toLocaleString('en-BD')} | Buy in Bangladesh | MediportBD`;
      }
      return `${name} | Buy in Bangladesh | DGDA Certified | MediportBD`;
    
    case 'category':
      return `${name} Bangladesh — 350+ Products | Buy Online | Fast Delivery`;
    
    case 'location':
      return `Medical Equipment ${city} | Supplier in ${city} Bangladesh | MediportBD`;
    
    case 'b2b':
      return `B2B Medical Equipment BD — 8-30% Discount | Hospital Supplier Dhaka`;
    
    case 'reagent':
      return `Lab Reagents Bangladesh — HbA1c, CBC, Troponin | Cold Chain | Dhaka`;
    
    default:
      return `Medical Equipment Bangladesh — 350+ Products | DGDA Certified | Free Delivery`;
  }
}

/**
 * Add Bangladesh trust signals to content
 */
export function getBangladeshTrustSignals() {
  return [
    '✓ DGDA Registered',
    '✓ 500+ Hospitals Trust Us',
    '✓ Free Delivery Dhaka',
    '✓ 5+ Years in Bangladesh',
    '✓ 24/7 Support',
    '✓ ISO 13485 Certified',
  ];
}

/**
 * Get Bangladesh payment methods
 */
export function getBangladeshPaymentMethods() {
  return [
    { name: 'Cash on Delivery', icon: '💵', usage: '60%' },
    { name: 'bKash', icon: '📱', usage: '25%' },
    { name: 'Nagad', icon: '💳', usage: '8%' },
    { name: 'Bank Transfer', icon: '🏦', usage: '5%' },
    { name: 'Credit Card', icon: '💳', usage: '2%' },
  ];
}

/**
 * Format price for Bangladesh market
 * Shows both ৳ symbol and formatted number
 */
export function formatBangladeshPrice(price) {
  if (!price) return null;
  
  const formatted = price.toLocaleString('en-BD');
  return `৳${formatted}`;
}

/**
 * Get city delivery information
 */
export function getCityDeliveryInfo(city) {
  const deliveryInfo = {
    'Dhaka': {
      time: 'Same-day delivery',
      cost: 'Free for orders above ৳50,000',
      areas: 'All areas covered',
      bengali: 'ঢাকা — একই দিনে ডেলিভারি',
    },
    'Chittagong': {
      time: '1-2 days delivery',
      cost: 'Free for orders above ৳75,000',
      areas: 'City and port areas',
      bengali: 'চট্টগ্রাম — ১-২ দিনে ডেলিভারি',
    },
    'Sylhet': {
      time: '2-3 days delivery',
      cost: 'Free for orders above ৳1,00,000',
      areas: 'City center and suburbs',
      bengali: 'সিলেট — ২-৩ দিনে ডেলিভারি',
    },
    default: {
      time: '2-5 days delivery',
      cost: 'Delivery charges apply',
      areas: 'Nationwide coverage',
      bengali: 'সারাদেশে ডেলিভারি',
    },
  };
  
  return deliveryInfo[city] || deliveryInfo.default;
}

/**
 * Get Bangladesh-specific keywords for a page
 */
export function getBangladeshKeywords(type, category = null, city = null) {
  const baseKeywords = BANGLADESH_KEYWORDS.primary;
  
  let specificKeywords = [];
  
  if (city) {
    specificKeywords = [
      `medical equipment ${city.toLowerCase()}`,
      `hospital equipment ${city.toLowerCase()}`,
      `medical supply ${city.toLowerCase()}`,
    ];
  }
  
  if (category) {
    specificKeywords.push(
      `${category.toLowerCase()} bangladesh`,
      `buy ${category.toLowerCase()} online bd`,
      `${category.toLowerCase()} price bangladesh`,
    );
  }
  
  // Add Banglish keywords for better coverage
  const banglishKeywords = BANGLADESH_KEYWORDS.banglish;
  
  return [...baseKeywords, ...specificKeywords, ...banglishKeywords].slice(0, 20);
}

/**
 * Generate breadcrumb with Bengali support
 */
export function generateBilingualBreadcrumb(items) {
  return items.map(item => ({
    name: item.name,
    nameBn: BENGALI_CATEGORIES[item.name] || BENGALI_CITIES[item.name] || null,
    url: item.url,
  }));
}

/**
 * Check if content should include Bengali
 * Based on user location, language preference, or URL parameter
 */
export function shouldIncludeBengali(request = null) {
  // Server-side: check accept-language header or URL param
  if (request) {
    const acceptLanguage = request.headers.get('accept-language') || '';
    if (acceptLanguage.includes('bn')) return true;
    
    const url = new URL(request.url);
    if (url.searchParams.get('lang') === 'bn') return true;
  }
  
  // Client-side: check localStorage or browser language
  if (typeof window !== 'undefined') {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang === 'bn') return true;
    
    const browserLang = navigator.language;
    if (browserLang.startsWith('bn')) return true;
  }
  
  // Default: include Bengali hints for all Bangladesh pages
  return true;
}

/**
 * Get FAQ data for Bangladesh market (bilingual)
 */
export function getBangladeshFAQs(category = 'general') {
  const faqs = {
    general: [
      {
        question: 'Where to buy medical equipment in Bangladesh?',
        questionBn: 'বাংলাদেশে চিকিৎসা সরঞ্জাম কোথায় কিনবো?',
        answer: 'You can buy medical equipment from MediportBD online or visit our office in Dhaka. We deliver nationwide with free delivery in Dhaka for orders above ৳50,000.',
        answerBn: 'MediportBD থেকে অনলাইনে অর্ডার করুন বা ঢাকার অফিসে আসুন। ৳৫০,০০০ টাকার উপরে ঢাকায় ফ্রি ডেলিভারি।',
      },
      {
        question: 'Are your products DGDA certified?',
        questionBn: 'আপনার পণ্য কি DGDA সার্টিফাইড?',
        answer: 'Yes, all our medical equipment is DGDA registered and certified. We only sell products that meet Bangladesh regulatory standards.',
        answerBn: 'হ্যাঁ, আমাদের সকল চিকিৎসা সরঞ্জাম DGDA রেজিস্টার্ড এবং সার্টিফাইড। আমরা শুধুমাত্র বাংলাদেশের নিয়মকানুন মেনে পণ্য বিক্রয় করি।',
      },
      {
        question: 'Do you provide installation service?',
        questionBn: 'আপনারা কি ইনস্টলেশন সেবা দেন?',
        answer: 'Yes, we provide free installation and training in Dhaka for diagnostic equipment. Outside Dhaka, installation charges may apply.',
        answerBn: 'হ্যাঁ, ঢাকায় ডায়াগনস্টিক যন্ত্রপাতির জন্য ফ্রি ইনস্টলেশন এবং ট্রেনিং দিই। ঢাকার বাইরে ইনস্টলেশন চার্জ প্রযোজ্য।',
      },
    ],
    payment: [
      {
        question: 'What payment methods do you accept?',
        questionBn: 'আপনারা কোন পেমেন্ট মেথড নেন?',
        answer: 'We accept bKash, Nagad, cash on delivery, bank transfer, and credit/debit cards through SSL Commerz.',
        answerBn: 'আমরা bKash, Nagad, ক্যাশ অন ডেলিভারি, ব্যাংক ট্রান্সফার এবং SSL Commerz এর মাধ্যমে কার্ড পেমেন্ট নিই।',
      },
    ],
    delivery: [
      {
        question: 'How long does delivery take?',
        questionBn: 'ডেলিভারি কত দিনে হয়?',
        answer: 'Dhaka: Same-day delivery. Other cities: 2-5 business days depending on location.',
        answerBn: 'ঢাকা: একই দিনে। অন্যান্য শহর: ২-৫ কার্যদিবস (স্থান অনুসারে)।',
      },
    ],
  };
  
  return faqs[category] || faqs.general;
}

export default {
  generateProductAltText,
  generateCategoryAltText,
  generateLocationAltText,
  generateBangladeshMetaDescription,
  generateBilingualMetaDescription,
  generateBangladeshTitle,
  getBangladeshTrustSignals,
  getBangladeshPaymentMethods,
  formatBangladeshPrice,
  getCityDeliveryInfo,
  getBangladeshKeywords,
  generateBilingualBreadcrumb,
  shouldIncludeBengali,
  getBangladeshFAQs,
};
