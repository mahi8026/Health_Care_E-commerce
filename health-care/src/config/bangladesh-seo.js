/**
 * Bangladesh Market-Specific SEO Configuration
 * 
 * Optimized for Bangladesh healthcare market targeting:
 * - Dhaka, Chittagong, Sylhet, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh
 * - Bengali + English bilingual users
 * - Mobile-first (80% mobile traffic in Bangladesh)
 * - Price-conscious buyers (emphasis on affordability)
 * - Government hospitals, private clinics, diagnostic centers
 */

export const BANGLADESH_LOCATIONS = {
  divisions: [
    { name: 'Dhaka', slug: 'dhaka', priority: 1, population: '9M+' },
    { name: 'Chittagong', slug: 'chittagong', priority: 2, population: '8.4M+' },
    { name: 'Sylhet', slug: 'sylhet', priority: 3, population: '3.5M+' },
    { name: 'Rajshahi', slug: 'rajshahi', priority: 4, population: '2.7M+' },
    { name: 'Khulna', slug: 'khulna', priority: 5, population: '1.8M+' },
    { name: 'Barisal', slug: 'barisal', priority: 6, population: '370K+' },
    { name: 'Rangpur', slug: 'rangpur', priority: 7, population: '300K+' },
    { name: 'Mymensingh', slug: 'mymensingh', priority: 8, population: '576K+' },
  ],
  
  majorCities: [
    'Dhaka', 'Chittagong', 'Gazipur', 'Narayanganj', 'Sylhet', 
    'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Comilla',
    'Mymensingh', 'Cox\'s Bazar', 'Jessore', 'Bogra', 'Dinajpur'
  ],
  
  medicalHubs: [
    { name: 'Dhaka Medical College Hospital', area: 'Dhaka' },
    { name: 'Bangabandhu Sheikh Mujib Medical University', area: 'Shahbag, Dhaka' },
    { name: 'Chittagong Medical College', area: 'Chittagong' },
    { name: 'Sir Salimullah Medical College', area: 'Mitford, Dhaka' },
    { name: 'Sylhet MAG Osmani Medical College', area: 'Sylhet' },
  ]
};

// Bangladesh-specific search terms (both English and Romanized Bengali)
export const BANGLADESH_KEYWORDS = {
  primary: [
    'medical equipment bangladesh',
    'medical equipment dhaka',
    'hospital equipment bangladesh',
    'diagnostic machine bangladesh',
    'medical supply dhaka',
    'hospital supply bangladesh',
    'medical device bangladesh',
    'healthcare equipment bd',
  ],
  
  // Common Banglish (Bengali written in English) terms
  banglish: [
    'hospital er somboraho', // hospital equipment
    'medical jontropati', // medical equipment
    'diagnostic machine er dam', // diagnostic machine price
    'ecg machine er dam bangladesh', // ECG machine price
  ],
  
  // Local terminology
  localTerms: [
    'medical equipment dhokar dam', // medical equipment Dhaka price
    'hospital e bebohrito jontro', // equipment used in hospitals
    'swasthyo kendrer jontropati', // health center equipment
  ],
  
  // Price-focused (Bangladeshi buyers are price-conscious)
  priceFocused: [
    'medical equipment price bangladesh',
    'hospital equipment dam bangladesh', // dam = price in Bengali
    'ecg machine dam bd',
    'diagnostic machine price dhaka',
    'sasta medical equipment', // cheap medical equipment
    'affordable medical equipment bangladesh',
    'medical equipment wholesale price bd',
  ],
  
  // City-specific
  citySpecific: [
    'medical equipment supplier dhaka',
    'hospital equipment chittagong',
    'medical supply sylhet',
    'diagnostic equipment rajshahi',
    'hospital supplier khulna',
    'medical equipment shop in dhaka',
  ],
  
  // B2B focused
  b2b: [
    'hospital medical equipment supplier bangladesh',
    'bulk medical equipment bangladesh',
    'medical equipment for clinics',
    'diagnostic center equipment bd',
    'hospital tender medical equipment',
    'government hospital supplier bangladesh',
  ],
  
  // Mobile/Online focused (80% mobile users in BD)
  online: [
    'buy medical equipment online bangladesh',
    'medical equipment online shop bd',
    'online medical supply dhaka',
    'order medical equipment bangladesh',
    'home delivery medical equipment dhaka',
  ]
};

// Bangladesh healthcare market insights
export const BANGLADESH_MARKET = {
  demographics: {
    population: '170M+',
    internetPenetration: '~40%',
    mobileUsers: '~180M (110% penetration)',
    smartphone: '~50M users',
    urbanPopulation: '~40%',
  },
  
  searchBehavior: {
    preferredLanguage: 'Bengali (40%) + English (35%) + Mixed (25%)',
    peakSearchTimes: ['10 AM - 12 PM', '3 PM - 5 PM', '8 PM - 11 PM'],
    devicePreference: 'Mobile (80%), Desktop (15%), Tablet (5%)',
    avgSessionDuration: '2-3 minutes',
    bounceRate: '~60-70% (mobile)',
  },
  
  buyingBehavior: {
    priceComparison: 'Very High (90% compare prices)',
    trustFactors: ['DGDA certification', 'Warranty', 'After-sales service', 'Brand reputation'],
    paymentPreference: ['Cash on Delivery (60%)', 'bKash (25%)', 'Bank Transfer (10%)', 'Card (5%)'],
    deliveryExpectation: 'Same-day Dhaka, 2-5 days nationwide',
  },
  
  healthcareInfrastructure: {
    governmentHospitals: '~250',
    privateClinics: '~5,000+',
    diagnosticCenters: '~3,000+',
    pharmacies: '~100,000+',
    medicalColleges: '~100+',
  }
};

// Competitor landscape (for benchmarking)
export const BANGLADESH_COMPETITORS = {
  major: [
    'Healthcare Pharmaceuticals Ltd.',
    'Square Hospitals',
    'Apollo Hospitals Dhaka',
    'Ibn Sina Trust',
    'Popular Diagnostic Centre',
  ],
  
  online: [
    'Medex.com.bd',
    'Healthaid.com.bd',
    'Various Facebook marketplace sellers',
  ],
  
  // Competitive advantages to emphasize
  ourAdvantages: [
    'DGDA registered supplier (compliance)',
    'B2B bulk discounts (8-30% vs 5-15% competitors)',
    'Free installation Dhaka (competitors charge)',
    'Cold chain delivery for reagents (unique)',
    '30-90 day credit terms (competitors: 15-30 days)',
    'Online ordering with live chat (24/7)',
  ]
};

// Bangladesh-specific trust signals
export const BANGLADESH_TRUST_SIGNALS = {
  certifications: [
    'DGDA Registered',
    'ISO 13485:2016 Certified',
    'CE Certified Products',
    'WHO GMP Compliant',
    'FDA Approved (USA)',
  ],
  
  localCredibility: [
    '500+ Hospitals Trust Us',
    '5+ Years in Bangladesh',
    'Authorized Distributor',
    'Official Importer',
    '24/7 Bangladesh Support',
  ],
  
  paymentSecurity: [
    'SSL Secure Checkout',
    'bKash Official Partner',
    'Nagad Verified Merchant',
    'Cash on Delivery Available',
  ],
  
  deliveryTrust: [
    'Free Delivery Dhaka',
    'Same-Day Dispatch',
    'Nationwide Coverage',
    'Track Your Order',
    'Cold Chain Maintained',
  ]
};

// SEO content templates for Bangladesh market
export const BANGLADESH_CONTENT_TEMPLATES = {
  // Location-based title templates
  locationTitle: (product, city) => 
    `${product} Price in ${city} | Buy ${product} ${city} Bangladesh`,
  
  // Price-focused title (Bangladeshi buyers love prices in titles)
  priceTitle: (product, price) => 
    `${product} Price ৳${price} | Buy in Bangladesh | Free Delivery Dhaka`,
  
  // B2B title
  b2bTitle: (product) => 
    `${product} Wholesale Price Bangladesh | B2B Supplier | 8-30% Discount`,
  
  // Meta description template
  metaDescription: (product, price, category) => 
    `Buy ${product} in Bangladesh at ৳${price}. ✓ DGDA certified ✓ Free delivery Dhaka ✓ Warranty ✓ EMI available. Best ${category} supplier in Dhaka. Call: 01646-886795`,
  
  // Bengali meta description
  metaDescriptionBn: (product, price) => 
    `${product} বাংলাদেশে কিনুন মাত্র ৳${price} টাকায়। ✓ DGDA সার্টিফাইড ✓ ঢাকায় ফ্রি ডেলিভারি ✓ ওয়ারেন্টি। কল: ০১৬৪৬-৮৮৬৭৯৫`,
};

// Local business schema for Bangladesh
export const BANGLADESH_LOCAL_BUSINESS = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  name: 'Mediport Bangladesh Ltd.',
  alternateName: 'MediportBD',
  description: 'Leading medical equipment supplier in Bangladesh. DGDA registered. Serving 500+ hospitals and clinics nationwide.',
  
  address: {
    '@type': 'PostalAddress',
    streetAddress: '17/2/A Azad Tower, Shop-08 (Beside BMA Bhaban), Topkhana Road',
    addressLocality: 'Dhaka',
    addressRegion: 'Dhaka Division',
    postalCode: '1000',
    addressCountry: 'BD',
  },
  
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 23.7275,  // Approximate - update with actual coordinates
    longitude: 90.4089,
  },
  
  telephone: '+8801646886795',
  email: 'mediportbdofficial@gmail.com',
  url: 'https://www.mediportbd.com',
  
  priceRange: '৳৳৳', // Mid to high range
  currenciesAccepted: 'BDT',
  paymentAccepted: ['Cash', 'bKash', 'Nagad', 'Bank Transfer', 'Credit Card'],
  
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '18:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Sunday',
      opens: '10:00',
      closes: '14:00',
    }
  ],
  
  areaServed: [
    { '@type': 'City', name: 'Dhaka' },
    { '@type': 'City', name: 'Chittagong' },
    { '@type': 'City', name: 'Sylhet' },
    { '@type': 'City', name: 'Rajshahi' },
    { '@type': 'Country', name: 'Bangladesh' },
  ],
  
  serviceArea: {
    '@type': 'GeoCircle',
    geoMidpoint: {
      '@type': 'GeoCoordinates',
      latitude: 23.8103,  // Center of Bangladesh
      longitude: 90.4125,
    },
    geoRadius: '500000', // 500km covers all Bangladesh
  },
  
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.7',
    reviewCount: '250',
    bestRating: '5',
    worstRating: '1',
  },
  
  slogan: 'Bangladesh\'s Most Trusted Medical Equipment Supplier',
};

export default {
  BANGLADESH_LOCATIONS,
  BANGLADESH_KEYWORDS,
  BANGLADESH_MARKET,
  BANGLADESH_COMPETITORS,
  BANGLADESH_TRUST_SIGNALS,
  BANGLADESH_CONTENT_TEMPLATES,
  BANGLADESH_LOCAL_BUSINESS,
};
