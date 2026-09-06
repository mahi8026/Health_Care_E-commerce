/**
 * Bengali Language Content for Bangladesh Market
 * 
 * Key Bengali terms for medical equipment (both formal and colloquial)
 * Used for metadata, content, and SEO optimization
 */

export const BENGALI_TERMS = {
  // Medical Equipment Terms
  medicalEquipment: {
    bn: 'চিকিৎসা সরঞ্জাম',
    romanized: 'Chikitsha Soronjan',
    colloquial: 'hospital er jontropati',
  },
  
  hospital: {
    bn: 'হাসপাতাল',
    romanized: 'Hospital',
    colloquial: 'hospital',
  },
  
  price: {
    bn: 'দাম',
    romanized: 'Dam',
    colloquial: 'dam / price',
  },
  
  buy: {
    bn: 'কিনুন',
    romanized: 'Kinun',
    colloquial: 'kinen / buy korun',
  },
  
  free: {
    bn: 'বিনামূল্যে',
    romanized: 'Binamulye',
    colloquial: 'free',
  },
  
  delivery: {
    bn: 'ডেলিভারি',
    romanized: 'Delivery',
    colloquial: 'delivery / pochanor bebostha',
  },
  
  // Product Categories
  ecgMachine: {
    bn: 'ইসিজি মেশিন',
    romanized: 'ECG Machine',
    colloquial: 'ecg machine / hridostrondoner jontro',
  },
  
  ultrasound: {
    bn: 'আল্ট্রাসাউন্ড',
    romanized: 'Ultrasound',
    colloquial: 'ultrasound / sonography machine',
  },
  
  bloodPressure: {
    bn: 'রক্তচাপ মাপার যন্ত্র',
    romanized: 'Roktochap Mapar Jontro',
    colloquial: 'BP machine / pressure machine',
  },
  
  glucoseMeter: {
    bn: 'গ্লুকোজ মিটার',
    romanized: 'Glucose Meter',
    colloquial: 'sugar machine / diabetes er machine',
  },
  
  nebulizer: {
    bn: 'নেবুলাইজার',
    romanized: 'Nebulizer',
    colloquial: 'nebulizer / shasher machine',
  },
  
  wheelchair: {
    bn: 'হুইলচেয়ার',
    romanized: 'Wheelchair',
    colloquial: 'wheelchair / chakar chair',
  },
  
  // Common Phrases
  certified: {
    bn: 'সার্টিফাইড',
    romanized: 'Certified',
    colloquial: 'certified / license ache',
  },
  
  warranty: {
    bn: 'ওয়ারেন্টি',
    romanized: 'Warranty',
    colloquial: 'warranty / guarantee',
  },
  
  installation: {
    bn: 'ইনস্টলেশন',
    romanized: 'Installation',
    colloquial: 'installation / bosanor bebostha',
  },
  
  callNow: {
    bn: 'এখনই কল করুন',
    romanized: 'Ekhoni Call Korun',
    colloquial: 'call korun / phone korun',
  },
  
  dhaka: {
    bn: 'ঢাকা',
    romanized: 'Dhaka',
    colloquial: 'dhaka',
  },
  
  bangladesh: {
    bn: 'বাংলাদেশ',
    romanized: 'Bangladesh',
    colloquial: 'bangladesh / BD',
  },
};

// Bengali SEO Keywords (high search volume in Bangladesh)
export const BENGALI_SEO_KEYWORDS = [
  // Bengali script keywords
  'চিকিৎসা সরঞ্জাম বাংলাদেশ',
  'হাসপাতাল সরঞ্জাম ঢাকা',
  'মেডিকেল ইকুইপমেন্ট এর দাম',
  'ইসিজি মেশিনের দাম বাংলাদেশ',
  'আল্ট্রাসাউন্ড মেশিন বাংলাদেশ',
  'রক্তচাপ মাপার যন্ত্র এর দাম',
  'নেবুলাইজার মেশিনের দাম কত',
  'থেরাপি মেশিনের দাম কত',
  'লাইফ সাপোর্ট মেশিন',
  
  // Romanized Bengali (Banglish) - very high search volume
  'medical equipment er dam bangladesh',
  'ecg machine er dam bd',
  'ultrasound machine price bangladesh',
  'bp machine dam bangladesh',
  'nebulizer machine er dam',
  'hospital jontropati dam',
  'diagnostic machine price dhaka',
  'glucose machine dam',
  'wheelchair dam bangladesh',
  'surgical instruments dam bd',
  
  // Common misspellings (include for SEO coverage)
  'medical equipment dam',
  'ecg masin price',
  'ultrasound masin',
  'nebulizer masin',
  'therapy machine dam',
];

// Bengali content for meta descriptions (converts to Bengali)
export const BENGALI_META_TEMPLATES = {
  product: (productBn, price) => 
    `${productBn} বাংলাদেশে কিনুন মাত্র ৳${price} টাকায়। ✓ DGDA সার্টিফাইড ✓ ঢাকায় ফ্রি ডেলিভারি ✓ ওয়ারেন্টি। কল: ০১৬৪৬-৮৮৬৭৯৫`,
  
  category: (categoryBn) =>
    `${categoryBn} বাংলাদেশে কিনুন সেরা দামে। ✓ DGDA অনুমোদিত ✓ ফ্রি ডেলিভারি ✓ ইনস্টলেশন সেবা। কল: ০১৬৪৬-৮৮৬৭৯৫`,
    
  location: (cityBn) =>
    `${cityBn} এ চিকিৎসা সরঞ্জাম সরবরাহকারী। ✓ DGDA রেজিস্টার্ড ✓ দ্রুত ডেলিভারি ✓ ইনস্টলেশন সেবা। কল: ০১৬৪৬-৮৮৬৭৯৫`,
};

// Bengali number formatting
export const formatBengaliNumber = (number) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(number)
    .split('')
    .map(digit => /\d/.test(digit) ? bengaliDigits[parseInt(digit)] : digit)
    .join('');
};

// Phone number in Bengali
export const PHONE_BENGALI = '০১৬৪৬-৮৮৬৭৯৫';
export const PHONE_ENGLISH = '01646-886795';

// Common Bengali FAQs
export const BENGALI_FAQS = [
  {
    questionBn: 'বাংলাদেশে চিকিৎসা সরঞ্জাম কোথায় কিনবো?',
    questionEn: 'Where to buy medical equipment in Bangladesh?',
    answerBn: 'MediportBD থেকে বাংলাদেশের যেকোনো জায়গায় চিকিৎসা সরঞ্জাম কিনতে পারবেন। ঢাকায় ফ্রি ডেলিভারি। কল করুন: ০১৬৪৬-৮৮৬৭৯৫',
    answerEn: 'You can buy medical equipment anywhere in Bangladesh from MediportBD. Free delivery in Dhaka. Call: 01646-886795',
  },
  {
    questionBn: 'মেডিকেল ইকুইপমেন্ট এর দাম কত?',
    questionEn: 'What is the price of medical equipment?',
    answerBn: 'চিকিৎসা সরঞ্জামের দাম ৳৫০০ থেকে ৳৫০ লাখ পর্যন্ত। বাল্ক অর্ডারে ৮-৩০% ছাড়। মূল্য জানতে কল করুন: ০১৬৪৬-৮৮৬৭৯৫',
    answerEn: 'Medical equipment prices range from ৳500 to ৳50 lakh. 8-30% discount on bulk orders. Call for pricing: 01646-886795',
  },
  {
    questionBn: 'ঢাকায় কি ফ্রি ডেলিভারি আছে?',
    questionEn: 'Is there free delivery in Dhaka?',
    answerBn: 'হ্যাঁ, ঢাকায় ৳৫০,০০০ টাকার উপরে অর্ডারে ফ্রি ডেলিভারি। সারাদেশে ডেলিভারি সুবিধা আছে।',
    answerEn: 'Yes, free delivery in Dhaka for orders above ৳50,000. Nationwide delivery available.',
  },
];

// Bengali product categories
export const BENGALI_CATEGORIES = {
  'Diagnostic Equipment': 'ডায়াগনস্টিক যন্ত্রপাতি',
  'Surgical Instruments': 'সার্জিক্যাল যন্ত্র',
  'Laboratory Reagents': 'ল্যাবরেটরি রিএজেন্ট',
  'Hospital Machines': 'হাসপাতাল মেশিন',
  'Medical Supplies': 'চিকিৎসা সরবরাহ',
  'PPE & Safety': 'পিপিই এবং সুরক্ষা',
  'Diabetes Care': 'ডায়াবেটিস কেয়ার',
  'Mobility Aids': 'মোবিলিটি এইডস',
};

// Bengali city names
export const BENGALI_CITIES = {
  'Dhaka': 'ঢাকা',
  'Chittagong': 'চট্টগ্রাম',
  'Sylhet': 'সিলেট',
  'Rajshahi': 'রাজশাহী',
  'Khulna': 'খুলনা',
  'Barisal': 'বরিশাল',
  'Rangpur': 'রংপুর',
  'Mymensingh': 'ময়মনসিংহ',
};

export default {
  BENGALI_TERMS,
  BENGALI_SEO_KEYWORDS,
  BENGALI_META_TEMPLATES,
  BENGALI_FAQS,
  BENGALI_CATEGORIES,
  BENGALI_CITIES,
  formatBengaliNumber,
  PHONE_BENGALI,
  PHONE_ENGLISH,
};
