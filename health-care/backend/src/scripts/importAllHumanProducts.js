#!/usr/bin/env node

/**
 * Complete Import Script for ALL Human Brand Products
 * 
 * Imports all 106 products from the Human Diagnostics price list:
 * - Page 1: Clinical Chemistry, ELISA, Coagulation, Hematology
 * - Page 2: Lipase, Total Protein, TG, Urea, Uric Acid, Calibrators, Auto-Immune, ELISA, Serology, Syphilis
 * - Page 3: Albumin, Alkaline Phosphatase, Amylase, Bilirubin, Calcium, Cholesterol, Creatinine, Glucose, GOT, GPT, HDL, Hemoglobin, Iron, LDH, LDL
 * 
 * Usage:
 *   node src/scripts/importAllHumanProducts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Manufacturer = require('../models/Manufacturer');
const slugify = require('slugify');

/**
 * Professional reagent kit images from Unsplash (free to use)
 */
const REAGENT_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&h=800&fit=crop', alt: 'Laboratory reagent bottles and test kits' },
  { url: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=800&fit=crop', alt: 'Medical laboratory reagent testing equipment' },
  { url: 'https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?w=800&h=800&fit=crop', alt: 'Laboratory chemical reagent bottles' },
  { url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=800&fit=crop', alt: 'Medical diagnostic test kit' },
  { url: 'https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=800&h=800&fit=crop', alt: 'Laboratory test tubes and reagents' },
];

/**
 * ALL Human Products from Price Lists (106 products)
 */
const ALL_PRODUCTS = [
  // PAGE 3 - Clinical Chemistry (Liquicolor line)
  { code: 'HN2002', name: 'Albumin liquicolor Complete Kit', pack: '4 x 100ML/ 400T', price: 6340, group: 'Albumin', storage: 'room' },
  { code: 'HN2502', name: 'Alkaline Phosphatase liquicolor (IFCC)', pack: '10 x 10ML/ 100T', price: 6360, group: 'Alk. Phos', storage: 'cold' },
  { code: 'HN2503', name: 'Alkaline Phosphatase liquicolor (IFCC)', pack: '8 x 50ML/ 400T', price: 20000, group: 'Alk. Phos', storage: 'cold' },
  { code: 'HN2504', name: 'Alkaline Phosphatase liquicolor (IFCC)', pack: '4 x 250ML/ 1000T', price: 37800, group: 'Alk. Phos', storage: 'cold' },
  { code: 'HN3501', name: 'alpha-Amylase liquicolor', pack: '12 x 10ML/ 120T', price: 20820, group: 'alpha-Amylase', storage: 'cold' },
  { code: 'HN1501', name: 'Bilirubin liquicolor (T)', pack: '2 x 100ML/ 200T', price: 8590, group: 'Bilirubin', storage: 'cold' },
  { code: 'HN1503', name: 'auto-Bilirubin-T liquicolor (w/o Calibrator)', pack: '375ML/ 300T', price: 6720, group: 'Bilirubin', storage: 'cold' },
  { code: 'HN1502', name: 'Bilirubin D+T liquicolor', pack: '2 x 100ML/ 200T', price: 8590, group: 'Bilirubin', storage: 'cold' },
  { code: 'HN1801', name: 'Calcium liquicolor Complete Kit', pack: '2 x 100ML/ 200T', price: 14825, group: 'Calcium', storage: 'room' },
  { code: 'HN1301', name: 'Cholesterol liquicolor Complete Kit', pack: '4 x 30ML/ 120T', price: 6600, group: 'Cholesterol', storage: 'cold' },
  { code: 'HN1302', name: 'Cholesterol liquicolor Complete Kit', pack: '4 x 100ML/ 400T', price: 15620, group: 'Cholesterol', storage: 'cold' },
  { code: 'HN1303', name: 'Cholesterol liquicolor Complete Kit', pack: '3 x 250ML/ 750T', price: 24900, group: 'Cholesterol', storage: 'cold' },
  { code: 'HN1306', name: 'Cholesterol liquicolor Btl.', pack: '250ML/ 250T', price: 8300, group: 'Cholesterol', storage: 'cold' },
  { code: 'HN2602', name: 'CK NAC activated liquiUV', pack: '10 x 10ML/ 100T', price: 9950, group: 'Cholesterol', storage: 'cold' },
  { code: 'HN2703', name: 'CK-MB liquiUV', pack: '10 x 10ML/ 100T', price: 24500, group: 'Cholesterol', storage: 'cold' },
  { code: 'HN1401', name: 'Creatinine liquicolor Complete Kit', pack: '200ML/ 200T', price: 5750, group: 'Creatinine', storage: 'cold' },
  { code: 'HN3602', name: 'gamma-GT liquicolor', pack: '10 x 10ML/ 100T', price: 13840, group: 'Creatinine', storage: 'cold' },
  { code: 'HN1101', name: 'Glucose liquicolor Complete Kit', pack: '4 x 100ML/ 400T', price: 5235, group: 'Glucose', storage: 'cold' },
  { code: 'HN1105', name: 'Glucose liquicolor Reagent Btl.', pack: '1000ML/ 1000T', price: 7500, group: 'Glucose', storage: 'cold' },
  { code: 'HN1107', name: 'Glucose Standard', pack: '1 BTL (3ML)', price: 850, group: 'Glucose', storage: 'room' },
  { code: 'HN2202', name: 'GOT(ASAT) IFCC mod. liquiUV', pack: '10 x 10ML/ 100T', price: 5300, group: 'GOT', storage: 'cold' },
  { code: 'HN2203', name: 'GOT(ASAT) IFCC mod. liquiUV', pack: '8 x 50ML/ 400T', price: 17240, group: 'GOT', storage: 'cold' },
  { code: 'HN2302', name: 'GPT(ALAT) IFCC mod. liquiUV', pack: '10 x 10ML/ 100T', price: 5300, group: 'GPT', storage: 'cold' },
  { code: 'HN2303', name: 'GPT(ALAT) IFCC mod. liquiUV', pack: '8 x 50ML/ 400T', price: 17240, group: 'GPT', storage: 'cold' },
  { code: 'HN2304', name: 'GPT(ALAT) IFCC mod. liquiUV', pack: '4 x 250ML/ 1000T', price: 33820, group: 'GPT', storage: 'cold' },
  { code: 'HN1304', name: 'HDL Cholesterol liquicolor (Indirect)', pack: '4 x 80ML/ 320T', price: 12000, group: 'HDL', storage: 'cold' },
  { code: 'HN1307', name: 'HDL Cholesterol Complete Kit (Direct)', pack: '80ML/ 80T', price: 44700, group: 'HDL', storage: 'cold' },
  { code: 'HN3001', name: 'Hemoglobin liquicolor', pack: '10 x 500ML/ 1000T', price: 12250, group: 'Hemoglobin', storage: 'room' },
  { code: 'HN2801', name: 'Iron liquicolor Complete Kit', pack: '2 x 30ML/ 60T', price: 10850, group: 'Hemoglobin', storage: 'room' },
  { code: 'HN2802', name: 'Iron liquicolor Complete Kit', pack: '2 x 100ML/ 200T', price: 22290, group: 'Hemoglobin', storage: 'room' },
  { code: 'HN3202', name: 'LDH SCE mod. liquiUV', pack: '10 x 10ML/ 100T', price: 7530, group: 'LDH', storage: 'cold' },
  { code: 'HN1308', name: 'LDL Cholesterol Complete Kit (Direct)', pack: '80ML/ 80T', price: 45500, group: 'LDL', storage: 'cold' },

  // PAGE 2 - Continued Clinical Chemistry
  { code: 'HN3508', name: 'Lipase liquicolor', pack: '50ML/ 50T', price: 25275, group: 'Lipase', storage: 'cold' },
  { code: 'HN1904', name: 'Magnesium liquicolor Complete Kit', pack: '2 x 100ML/ 200T', price: 12500, group: 'Lipase', storage: 'room' },
  { code: 'HN1901', name: 'Phosphorus liquirapid (UV)', pack: '2 x 100ML/ 200T', price: 13985, group: 'Lipase', storage: 'room' },
  { code: 'HN2901', name: 'TIBC', pack: '100 Test', price: 12250, group: 'Lipase', storage: 'room' },
  { code: 'HN2102', name: 'Total Protein liquicolor Complete Kit', pack: '4 x 100ML/ 400T', price: 9630, group: 'Total Protein', storage: 'room' },
  { code: 'HN1709', name: 'Triglyceride liquicolor mono', pack: '4 x 100ML/ 400T', price: 24000, group: 'TG', storage: 'cold' },
  { code: 'HN1706', name: 'Triglyceride liquicolor mono', pack: '3 x 250ML/ 750T', price: 37545, group: 'TG', storage: 'cold' },
  { code: 'HN1704', name: 'Triglyceride liquicolor mono Btl', pack: '250ML/ 250T', price: 12515, group: 'TG', storage: 'cold' },
  { code: 'HN1710', name: 'Triglyceride liquicolor mono Btl', pack: '2 x 100 ML/ 200T', price: 5240, group: 'TG', storage: 'cold' },
  { code: 'HN1201', name: 'Urea liquicolor Complete Kit', pack: '4 x 30ML/ 120T', price: 6590, group: 'Urea', storage: 'cold' },
  { code: 'HN1602', name: 'Uric Acid liquicolor Complete Kit', pack: '4 x 100ML/ 400T', price: 14700, group: 'Uric Acid', storage: 'cold' },
  { code: 'HN1603', name: 'Uric Acid liquicolor Complete Kit', pack: '4 x 100ML/ 400T', price: 14700, group: 'Uric Acid', storage: 'cold' },

  // PAGE 2 - Calibrators & QC
  { code: 'HN3308', name: 'AUTOCAL (multi-Calibrator)', pack: '5 ML', price: 4250, group: 'Calibrator / QC', storage: 'cold' },
  { code: 'HN3303', name: 'Humatrol - N (QC-N)', pack: '5 ML', price: 1800, group: 'Calibrator / QC', storage: 'cold' },
  { code: 'HN3309', name: 'Serodos (QC-N)', pack: '5 ML', price: 4300, group: 'Calibrator / QC', storage: 'cold' },
  { code: 'HN3304', name: 'Humatrol - P (QC-Abn)', pack: '5 ML', price: 1950, group: 'Calibrator / QC', storage: 'cold' },
  { code: 'HN3307', name: 'Serodos Plus (QC-Abn)', pack: '5 ML', price: 4300, group: 'Calibrator / QC', storage: 'cold' },

  // PAGE 2 - Instrument Consumables
  { code: 'HN6007', name: 'HumaStar 200, Special Wash Soln.', pack: '12 x 30ML', price: 10800, group: 'Inst. Consumables', storage: 'room' },
  { code: 'HN7701', name: 'Washing Soln for Humalyzer', pack: '100 ML', price: 2500, group: 'Inst. Consumables', storage: 'room' },

  // PAGE 2 - Auto-Immune Diagnostics (ELISA)
  { code: 'HN1004', name: 'Imtec-bz-Glycoprotein IgG', pack: '96 Test', price: 67800, group: 'LIA', storage: 'cold' },
  { code: 'HN1021', name: 'Imtec ANA-LIA XL', pack: '24 Test', price: 38600, group: 'LIA', storage: 'cold' },
  { code: 'HN1027', name: 'Imtec Arthritis-LIA', pack: '24 Test', price: 43150, group: 'LIA', storage: 'cold' },
  { code: 'HN1022', name: 'Imtec Gastro-LIA', pack: '24 Test', price: 43150, group: 'LIA', storage: 'cold' },
  { code: 'HN1023', name: 'Imtec Liver-LIA', pack: '24 Test', price: 43150, group: 'LIA', storage: 'cold' },
  { code: 'HN1025', name: 'Imtec Myositis-LIA PL', pack: '24 Test', price: 43150, group: 'LIA', storage: 'cold' },
  { code: 'HN1028', name: 'Imtec Vasculitis-LIA', pack: '24 Test', price: 43150, group: 'LIA', storage: 'cold' },
  { code: 'HN1002', name: 'Imtec ANA Screen ELISA', pack: '96 Test', price: 42000, group: 'ELISA', storage: 'cold' },
  { code: 'HN1003', name: 'Imtec dsDNA Ab ELISA', pack: '96 Test', price: 40000, group: 'ELISA', storage: 'cold' },
  { code: 'HN1015', name: 'Imtec ENA Screen (cut-off) ELISA', pack: '96 Test', price: 60000, group: 'ELISA', storage: 'cold' },
  { code: 'HN1019', name: 'Imtec TPO Ab ELISA', pack: '96 Test', price: 46000, group: 'ELISA', storage: 'cold' },

  // PAGE 2 - Serology (Latex)
  { code: 'HN0502', name: 'HumaTex ASO Complete Kit', pack: '100 Test', price: 8800, group: 'ASO / CRP / RF', storage: 'room' },
  { code: 'HN0702', name: 'HumaTex CRP Complete Kit', pack: '100 Test', price: 5885, group: 'ASO / CRP / RF', storage: 'room' },
  { code: 'HN0602', name: 'HumaTex RF Complete Kit', pack: '100 Test', price: 6075, group: 'ASO / CRP / RF', storage: 'room' },

  // PAGE 2 - OBTI & WIDAL
  { code: 'HN5101', name: 'Hexagon OBTI Complete Kit (Stool)', pack: '24 Test', price: 22480, group: 'OBTI', storage: 'room' },
  { code: 'HN4903', name: 'HumaTex S.typhi O Antigen', pack: '100 Test', price: 1765, group: 'WIDAL', storage: 'room' },
  { code: 'HN4902', name: 'HumaTex S.typhi H Antigen', pack: '100 Test', price: 1765, group: 'WIDAL', storage: 'room' },
  { code: 'HN4904', name: 'HumaTex S.paratyphi AH Antigen', pack: '100 Test', price: 1765, group: 'WIDAL', storage: 'room' },
  { code: 'HN4905', name: 'HumaTex S.paratyphi BH Antigen', pack: '100 Test', price: 1765, group: 'WIDAL', storage: 'room' },
  { code: 'HN4915', name: 'HumaTex S.paratyphi AO Antigen', pack: '100 Test', price: 1765, group: 'WIDAL', storage: 'room' },
  { code: 'HN4916', name: 'HumaTex S.paratyphi BO Antigen', pack: '100 Test', price: 1765, group: 'WIDAL', storage: 'room' },
  { code: 'HN0902', name: 'Syphilis RPR Complete Kit', pack: '100 Test', price: 6025, group: 'Syphilis', storage: 'room' },

  // PAGE 1 - ELISA (Thyroid, Fertility, Tumor Marker, Allergy, Infectious Disease)
  { code: 'HN8006', name: 'FT3 ELISA', pack: '96 Test', price: 22800, group: 'Thyroid', storage: 'cold' },
  { code: 'HN8007', name: 'FT4 ELISA', pack: '96 Test', price: 29000, group: 'Thyroid', storage: 'cold' },
  { code: 'HN7702', name: 'T3 ELISA', pack: '96 Test', price: 20000, group: 'Thyroid', storage: 'cold' },
  { code: 'HN7703', name: 'T4 ELISA', pack: '96 Test', price: 21500, group: 'Thyroid', storage: 'cold' },
  { code: 'HN7704', name: 'TSH ELISA', pack: '96 Test', price: 17000, group: 'Thyroid', storage: 'cold' },
  { code: 'HN7802', name: 'FSH ELISA', pack: '96 Test', price: 28280, group: 'Fertility', storage: 'cold' },
  { code: 'HN7803', name: 'LH ELISA', pack: '96 Test', price: 27960, group: 'Fertility', storage: 'cold' },
  { code: 'HN7801', name: 'Total hCG ELISA', pack: '96 Test', price: 26700, group: 'Fertility', storage: 'cold' },
  { code: 'HN8002', name: 'Progesterone ELISA', pack: '96 Test', price: 38340, group: 'Fertility', storage: 'cold' },
  { code: 'HN7804', name: 'Prolactin (PRL) ELISA', pack: '96 Test', price: 25900, group: 'Fertility', storage: 'cold' },
  { code: 'HN8001', name: 'Testosterone ELISA', pack: '96 Test', price: 41000, group: 'Fertility', storage: 'cold' },
  { code: 'HN7805', name: 'CA 125 Ag ELISA', pack: '96 Test', price: 32700, group: 'Tumor Marker', storage: 'cold' },
  { code: 'HN7903', name: 'PSA ELISA', pack: '96 Test', price: 27800, group: 'Tumor Marker', storage: 'cold' },
  { code: 'HN7103', name: 'Total IgE ELISA', pack: '96 Test', price: 45000, group: 'Allergy', storage: 'cold' },
  { code: 'HN7001', name: 'HBsAg Ultra Sens ELISA', pack: '96 Test', price: 36000, group: 'Infectious Disease', storage: 'cold' },
  { code: 'HN7101', name: 'anti-HCV ELISA', pack: '96 Test', price: 60000, group: 'Infectious Disease', storage: 'cold' },

  // PAGE 1 - Coagulation
  { code: 'HN6001', name: 'Hemostat Thromboplastin-SI', pack: '6 x 2ML/ 60T', price: 10260, group: 'PT', storage: 'cold' },
  { code: 'HN6002', name: 'Hemostat Thromboplastin-SI', pack: '6 x 10ML/ 300T', price: 11000, group: 'PT', storage: 'cold' },
  { code: 'HN6101', name: 'Hemostat aPTT EL', pack: '6 x 4ML/ 480T', price: 18350, group: 'aPTT', storage: 'cold' },
  { code: 'HN6105', name: 'Hemostat Fibrinogen Complete Kit', pack: '5 x 2ML/ 200T', price: 15980, group: 'FIB', storage: 'cold' },
  { code: 'HN6301', name: 'Hemostat Thrombin Time (TT)', pack: '3 x 3ML/ 180T', price: 9235, group: 'TT', storage: 'cold' },
  { code: 'HN6202', name: 'Hemostat Calibrator', pack: '4 x 1 ML', price: 8350, group: 'Calibrator / QC', storage: 'cold' },
  { code: 'HN6404', name: 'Hemostat Control Plasma, Abnormal', pack: '1 ML', price: 2450, group: 'Calibrator / QC', storage: 'cold' },
  { code: 'HN6403', name: 'Hemostat Control Plasma, Normal', pack: '1 ML', price: 2450, group: 'Calibrator / QC', storage: 'cold' },

  // PAGE 1 - Instrument Consumables (Coagulation)
  { code: 'HN6003', name: 'HumaClot Pro, Wash Solution', pack: '5 x 15ML', price: 18000, group: 'Inst. Consumables', storage: 'room' },
  { code: 'HN6004', name: 'HumaClot Pro, Cleaner', pack: '5 x 15ML', price: 9225, group: 'Inst. Consumables', storage: 'room' },

  // PAGE 1 - Hematology (3-part & 5-part)
  { code: 'HN9010', name: 'HC-Diluent (3P)', pack: '20 L', price: 21000, group: '3-part', storage: 'room' },
  { code: 'HN9020', name: 'HC-Lyse CF (3P)', pack: '1 L', price: 15700, group: '3-part', storage: 'room' },
  { code: 'HN9030', name: 'HC-Cleaner (3P)', pack: '1 L', price: 9565, group: '3-part', storage: 'room' },
  { code: 'HN9050', name: 'HC-5D Diluent', pack: '20 L', price: 25600, group: '5-part', storage: 'room' },
  { code: 'HN9052', name: 'HC-5D CBC Lyse', pack: '200 ML', price: 12550, group: 'Hematology', storage: 'room' },
  { code: 'HN9051', name: 'HC-5D DIFF Lyse', pack: '500 ML', price: 28350, group: '5-part', storage: 'room' },
  { code: 'HN9053', name: 'HC-5D Clean', pack: '50 ML', price: 4970, group: '5-part', storage: 'room' },

  // PAGE 1 - Syphilis
  { code: 'HN0903', name: 'Syphilis RPR Reagent Only', pack: '1000 Test', price: 2500, group: 'Syphilis', storage: 'room' },
  { code: 'HN1001', name: 'Syphilis TPHA (Hemagglutination) Kit', pack: '100 Test', price: 20000, group: 'Syphilis', storage: 'cold' },

  // PAGE 3 - Inoculation Aids
  { code: 'HM7070', name: 'Straight wire (Nichrome)', pack: '10 No', price: 2000, group: 'Inoculation Aids', storage: 'room' },
];

/**
 * Generate unique SKU
 */
async function generateSKU(code) {
  let sku = code;
  let counter = 1;
  while (await Product.findOne({ sku })) {
    sku = `${code}-${counter}`;
    counter++;
  }
  return sku;
}

/**
 * Generate unique slug
 */
async function generateUniqueSlug(name) {
  let slug = slugify(name, { lower: true, strict: true });
  let counter = 1;
  while (await Product.findOne({ slug })) {
    slug = `${slugify(name, { lower: true, strict: true })}-${counter}`;
    counter++;
  }
  return slug;
}

/**
 * Parse price from string
 */
function parsePrice(priceStr) {
  if (typeof priceStr === 'number') return priceStr;
  return parseInt(priceStr.toString().replace(/,/g, ''));
}

/**
 * Determine stock quantity based on price
 */
function estimateStock(price) {
  if (price < 5000) return 50;
  if (price < 10000) return 30;
  if (price < 20000) return 20;
  if (price < 40000) return 15;
  return 10;
}

/**
 * Main import function
 */
async function importAllProducts() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Import ALL Human Brand Products (106 products)');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Connect to MongoDB
    console.log('→ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    // Find Human manufacturer
    console.log('→ Finding Human manufacturer...');
    let human = await Manufacturer.findOne({ slug: 'human' });
    
    if (!human) {
      console.log('   Creating Human manufacturer...');
      human = await Manufacturer.create({
        name: 'Human',
        slug: 'human',
        description: 'Human Diagnostics Worldwide - Leading German manufacturer of in-vitro diagnostic products. Founded in 1968, Human specializes in clinical chemistry, immunology, hemostasis, and point-of-care testing. Known for the Liquicolor reagent line with excellent quality, precision, and reliability. CE IVD certified and ISO 13485 compliant.',
        country: 'Germany',
        website: 'https://www.human.de',
        isActive: true,
      });
      console.log('   ✓ Created manufacturer');
    } else {
      console.log('   ✓ Manufacturer exists');
    }
    console.log(`   ID: ${human._id}\n`);
    
    // Find category
    console.log('→ Finding Laboratory Reagents category...');
    let category = await Category.findOne({ name: 'Laboratory Reagents' });
    
    if (!category) {
      console.log('   Creating Laboratory Reagents category...');
      category = await Category.create({
        name: 'Laboratory Reagents',
        slug: 'laboratory-reagents',
        description: 'Laboratory reagents and rapid test kits for clinical chemistry, immunology, and diagnostics.',
        isActive: true,
      });
      console.log('   ✓ Created category');
    } else {
      console.log('   ✓ Category exists');
    }
    console.log(`   ID: ${category._id}\n`);
    
    // Import products
    console.log(`→ Importing ${ALL_PRODUCTS.length} products...\n`);
    console.log('─'.repeat(80));
    
    const stats = { success: 0, skipped: 0, failed: 0 };
    
    for (const prod of ALL_PRODUCTS) {
      try {
        // Check if exists by code or name
        const existing = await Product.findOne({
          $or: [
            { sku: prod.code },
            { name: new RegExp('^' + prod.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
          ]
        });
        
        if (existing) {
          console.log(`⊘ ${prod.code} - ${prod.name.substring(0, 50)}... (exists)`);
          stats.skipped++;
          continue;
        }
        
        const sku = await generateSKU(prod.code);
        const slug = await generateUniqueSlug(prod.name);
        const price = parsePrice(prod.price);
        const stock = estimateStock(price);
        
        // Select image (rotate through available images)
        const imageIndex = stats.success % REAGENT_IMAGES.length;
        const selectedImage = REAGENT_IMAGES[imageIndex];
        
        const images = [{
          url: selectedImage.url,
          publicId: `human-${prod.code.toLowerCase()}`,
          isPrimary: true,
          alt: `${prod.name} - Human Diagnostics Germany - MediportBD Bangladesh`,
        }];
        
        const specifications = new Map([
          ['Code', prod.code],
          ['Pack Size', prod.pack],
          ['Group', prod.group],
          ['Storage', prod.storage === 'cold' ? '2-8°C (Refrigerated)' : 'Room temperature (15-25°C)'],
          ['Shelf Life', '18-24 months'],
          ['Certification', 'CE IVD, ISO 13485, ISO 9001'],
          ['Manufacturer', 'Human Diagnostics, Germany'],
          ['Warranty', '1 year manufacturer warranty'],
        ]);
        
        // Determine unit based on pack description
        let unit = 'kit'; // default for test kits
        if (prod.pack.toLowerCase().includes('ml') || prod.pack.toLowerCase().includes('l')) {
          unit = 'piece'; // for reagent bottles/solutions
        } else if (prod.pack.includes('Test')) {
          unit = 'kit';
        } else if (prod.pack.toLowerCase().includes('no')) {
          unit = 'piece';
        }
        
        await Product.create({
          name: prod.name,
          slug,
          sku,
          description: `${prod.name} - Professional laboratory reagent from Human Diagnostics Germany. Part of the comprehensive Human diagnostic product line. ${prod.pack}. CE IVD certified and ISO 13485 compliant. Made in Germany with strict quality control.`,
          brand: human._id,
          category: category._id,
          price,
          stock,
          lowStockThreshold: 5,
          unit,
          minOrderQty: 1,
          images,
          specifications,
          certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
          storageTemp: prod.storage,
          tests: prod.pack,
          isFeatured: false,
          isActive: true,
          tags: ['Human', 'Germany', prod.group, 'Laboratory Reagents', 'Diagnostic'],
        });
        
        console.log(`✓ ${prod.code} - ${prod.name.substring(0, 50)}... (৳${price.toLocaleString()})`);
        stats.success++;
        
        // Small delay to avoid overwhelming the database
        if (stats.success % 10 === 0) {
          await new Promise(r => setTimeout(r, 500));
        }
        
      } catch (error) {
        console.log(`✗ ${prod.code} - ${prod.name.substring(0, 50)}... (${error.message})`);
        stats.failed++;
      }
    }
    
    console.log('\n' + '─'.repeat(80));
    console.log('\n📊 Import Complete!');
    console.log('─'.repeat(80));
    console.log(`   ✓ Successfully imported: ${stats.success} products`);
    console.log(`   ⊘ Skipped (existing):    ${stats.skipped} products`);
    console.log(`   ✗ Failed:                ${stats.failed} products`);
    console.log(`   📦 Total processed:       ${stats.success + stats.skipped + stats.failed} products`);
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Visit production site to verify products');
    console.log('   2. Check https://health-care-e-commerce-murex.vercel.app/products?brand=Human');
    console.log('   3. Review product details and images');
    console.log('   4. Update any product-specific details as needed');
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
}

// Run import
importAllProducts();
