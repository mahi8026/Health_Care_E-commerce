#!/usr/bin/env node

/**
 * Human Brand Reagent Product Import Script
 * 
 * Imports Human Diagnostics reagent products to MediportBD
 * Human Diagnostics is a leading German manufacturer of in-vitro diagnostic products
 * Specializes in clinical chemistry, immunology, hemostasis, and point-of-care testing
 * 
 * Website: https://www.human.de
 * 
 * Usage:
 *   node src/scripts/importHumanProducts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Manufacturer = require('../models/Manufacturer');
const cloudinary = require('cloudinary').v2;
const slugify = require('slugify');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const PRICE_ON_REQUEST = 0;

/**
 * Human Brand Reagent Products Data
 * Based on Human Diagnostics product catalog and provided images
 */
const HUMAN_PRODUCTS = [
  {
    name: 'Human Liquicolor Cholesterol Test Kit',
    category: 'Laboratory Reagents',
    price: 8500,
    stock: 25,
    isPriceOnRequest: false,
    storageTemp: 'cold',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/cholesterol-kit.jpg',
    ],
    description: 'Human Liquicolor Cholesterol enzymatic colorimetric test kit for quantitative determination of cholesterol in serum or plasma. CHOD-PAP method with excellent linearity and precision. Reagent kit contains all necessary components for accurate cholesterol measurement. Suitable for manual and automated analyzers. Made in Germany by Human Diagnostics.',
    specifications: {
      'Method': 'CHOD-PAP enzymatic colorimetric',
      'Sample Type': 'Serum, plasma',
      'Wavelength': '500 nm (490-550 nm)',
      'Linearity': 'Up to 750 mg/dL (19.4 mmol/L)',
      'Sensitivity': '2 mg/dL',
      'Test Count': '100 tests',
      'Storage': '2-8°C',
      'Shelf Life': '24 months',
      'Calibrator': 'Included',
      'Standards': 'Traceable to CDC reference method',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'Cholesterol', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor Triglycerides Test Kit',
    category: 'Laboratory Reagents',
    price: 9200,
    stock: 20,
    isPriceOnRequest: false,
    storageTemp: 'cold',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/triglycerides-kit.jpg',
    ],
    description: 'Human Liquicolor Triglycerides enzymatic colorimetric test for quantitative determination of triglycerides in serum or plasma. GPO-PAP method with high specificity and accuracy. Complete reagent system for reliable triglyceride measurement. Compatible with most clinical chemistry analyzers. Manufactured in Germany to highest quality standards.',
    specifications: {
      'Method': 'GPO-PAP enzymatic colorimetric',
      'Sample Type': 'Serum, plasma',
      'Wavelength': '500 nm (490-550 nm)',
      'Linearity': 'Up to 1000 mg/dL (11.3 mmol/L)',
      'Sensitivity': '5 mg/dL',
      'Test Count': '100 tests',
      'Storage': '2-8°C',
      'Shelf Life': '24 months',
      'Calibrator': 'Included',
      'Standards': 'Traceable to NIST reference material',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'Triglycerides', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor HDL Cholesterol Direct Test Kit',
    category: 'Laboratory Reagents',
    price: 12500,
    stock: 15,
    isPriceOnRequest: false,
    storageTemp: 'cold',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/hdl-cholesterol-kit.jpg',
    ],
    description: 'Human Liquicolor HDL Cholesterol direct homogeneous enzymatic colorimetric test for quantitative determination of HDL cholesterol in serum or plasma. No pre-treatment required. Selective detergent method with excellent correlation to ultracentrifugation reference method. Ready-to-use liquid reagents for convenience. Suitable for automated analyzers.',
    specifications: {
      'Method': 'Direct homogeneous enzymatic colorimetric',
      'Sample Type': 'Serum, plasma',
      'Wavelength': '600 nm (580-620 nm)',
      'Linearity': 'Up to 150 mg/dL (3.9 mmol/L)',
      'Sensitivity': '3 mg/dL',
      'Test Count': '100 tests',
      'Storage': '2-8°C',
      'Shelf Life': '18 months',
      'Pre-treatment': 'Not required',
      'Standards': 'Traceable to CDC reference method',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'HDL Cholesterol', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor LDL Cholesterol Direct Test Kit',
    category: 'Laboratory Reagents',
    price: 13500,
    stock: 15,
    isPriceOnRequest: false,
    storageTemp: 'cold',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/ldl-cholesterol-kit.jpg',
    ],
    description: 'Human Liquicolor LDL Cholesterol direct homogeneous enzymatic colorimetric test for quantitative determination of LDL cholesterol in serum or plasma. No calculation required. Eliminates need for Friedewald formula. Selective protection method with high accuracy. Ready-to-use reagents for automated clinical chemistry analyzers.',
    specifications: {
      'Method': 'Direct homogeneous enzymatic colorimetric',
      'Sample Type': 'Serum, plasma',
      'Wavelength': '600 nm (580-620 nm)',
      'Linearity': 'Up to 300 mg/dL (7.8 mmol/L)',
      'Sensitivity': '5 mg/dL',
      'Test Count': '100 tests',
      'Storage': '2-8°C',
      'Shelf Life': '18 months',
      'Calculation': 'Direct measurement - no formula needed',
      'Standards': 'Traceable to CDC reference method',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'LDL Cholesterol', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor Glucose GOD-PAP Test Kit',
    category: 'Laboratory Reagents',
    price: 7500,
    stock: 30,
    isPriceOnRequest: false,
    storageTemp: 'cold',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/glucose-kit.jpg',
    ],
    description: 'Human Liquicolor Glucose enzymatic colorimetric test kit using GOD-PAP method for quantitative determination of glucose in serum, plasma, urine, and CSF. High specificity with no interference from common substances. Stable ready-to-use reagents. Suitable for manual and automated analyzers. Widely used for diabetes diagnosis and monitoring.',
    specifications: {
      'Method': 'GOD-PAP enzymatic colorimetric',
      'Sample Type': 'Serum, plasma, urine, CSF',
      'Wavelength': '500 nm (490-550 nm)',
      'Linearity': 'Up to 500 mg/dL (27.8 mmol/L)',
      'Sensitivity': '2 mg/dL',
      'Test Count': '100 tests',
      'Storage': '2-8°C',
      'Shelf Life': '24 months',
      'Interference': 'Minimal from bilirubin, hemoglobin, lipemia',
      'Standards': 'Traceable to NIST SRM 965',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'Glucose', 'Clinical Chemistry', 'Diabetes', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor Urea Urease/GLDH Test Kit',
    category: 'Laboratory Reagents',
    price: 8800,
    stock: 20,
    isPriceOnRequest: false,
    storageTemp: 'cold',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/urea-kit.jpg',
    ],
    description: 'Human Liquicolor Urea kinetic enzymatic UV test using urease and glutamate dehydrogenase (GLDH) for quantitative determination of urea in serum, plasma, and urine. Kinetic UV method with excellent precision and accuracy. Important test for kidney function assessment. Compatible with automated clinical chemistry analyzers.',
    specifications: {
      'Method': 'Urease/GLDH kinetic enzymatic UV',
      'Sample Type': 'Serum, plasma, urine',
      'Wavelength': '340 nm (334-365 nm)',
      'Linearity': 'Up to 300 mg/dL (50 mmol/L)',
      'Sensitivity': '2 mg/dL',
      'Test Count': '100 tests',
      'Storage': '2-8°C',
      'Shelf Life': '24 months',
      'Clinical Use': 'Kidney function assessment',
      'Standards': 'Traceable to NIST reference material',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'Urea', 'Kidney Function', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor Creatinine Jaffe Test Kit',
    category: 'Laboratory Reagents',
    price: 8500,
    stock: 25,
    isPriceOnRequest: false,
    storageTemp: 'cold',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/creatinine-kit.jpg',
    ],
    description: 'Human Liquicolor Creatinine kinetic colorimetric test using modified Jaffe reaction for quantitative determination of creatinine in serum, plasma, and urine. Kinetic method with reduced interference. Essential test for kidney function evaluation and GFR calculation. Stable ready-to-use reagents.',
    specifications: {
      'Method': 'Modified Jaffe kinetic colorimetric',
      'Sample Type': 'Serum, plasma, urine',
      'Wavelength': '492 nm (490-510 nm)',
      'Linearity': 'Up to 15 mg/dL (1327 μmol/L)',
      'Sensitivity': '0.2 mg/dL',
      'Test Count': '100 tests',
      'Storage': '2-8°C',
      'Shelf Life': '24 months',
      'Clinical Use': 'Kidney function, GFR calculation',
      'Standards': 'Traceable to NIST SRM 914a',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'Creatinine', 'Kidney Function', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor Uric Acid Uricase Test Kit',
    category: 'Laboratory Reagents',
    price: 8900,
    stock: 20,
    isPriceOnRequest: false,
    storageTemp: 'cold',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/uric-acid-kit.jpg',
    ],
    description: 'Human Liquicolor Uric Acid enzymatic colorimetric test using uricase for quantitative determination of uric acid in serum, plasma, and urine. High specificity with no interference from ascorbic acid. Important for gout diagnosis and monitoring. Ready-to-use liquid reagents for convenience.',
    specifications: {
      'Method': 'Uricase enzymatic colorimetric',
      'Sample Type': 'Serum, plasma, urine',
      'Wavelength': '520 nm (500-550 nm)',
      'Linearity': 'Up to 20 mg/dL (1.19 mmol/L)',
      'Sensitivity': '0.5 mg/dL',
      'Test Count': '100 tests',
      'Storage': '2-8°C',
      'Shelf Life': '24 months',
      'Clinical Use': 'Gout diagnosis and monitoring',
      'Interference': 'No ascorbic acid interference',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'Uric Acid', 'Clinical Chemistry', 'Gout', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor Total Protein Biuret Test Kit',
    category: 'Laboratory Reagents',
    price: 7800,
    stock: 25,
    isPriceOnRequest: false,
    storageTemp: 'room',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/total-protein-kit.jpg',
    ],
    description: 'Human Liquicolor Total Protein colorimetric test using biuret method for quantitative determination of total protein in serum, plasma, urine, and CSF. Classic reliable method with excellent accuracy. Important for nutritional status assessment and liver/kidney disease diagnosis. Stable reagents with long shelf life.',
    specifications: {
      'Method': 'Biuret colorimetric',
      'Sample Type': 'Serum, plasma, urine, CSF',
      'Wavelength': '546 nm (530-560 nm)',
      'Linearity': 'Up to 12 g/dL (120 g/L)',
      'Sensitivity': '0.2 g/dL',
      'Test Count': '100 tests',
      'Storage': 'Room temperature (15-25°C)',
      'Shelf Life': '24 months',
      'Clinical Use': 'Nutritional status, liver/kidney disease',
      'Standards': 'Traceable to ERM-DA470k reference material',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'Total Protein', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor Albumin BCG Test Kit',
    category: 'Laboratory Reagents',
    price: 8200,
    stock: 20,
    isPriceOnRequest: false,
    storageTemp: 'room',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/albumin-kit.jpg',
    ],
    description: 'Human Liquicolor Albumin colorimetric test using bromocresol green (BCG) dye binding method for quantitative determination of albumin in serum and plasma. Fast reaction time with high specificity. Essential for liver function assessment and nutritional status evaluation. Ready-to-use stable reagents.',
    specifications: {
      'Method': 'BCG dye binding colorimetric',
      'Sample Type': 'Serum, plasma',
      'Wavelength': '578 nm (570-590 nm)',
      'Linearity': 'Up to 6 g/dL (60 g/L)',
      'Sensitivity': '0.2 g/dL',
      'Test Count': '100 tests',
      'Storage': 'Room temperature (15-25°C)',
      'Shelf Life': '24 months',
      'Reaction Time': '1 minute',
      'Clinical Use': 'Liver function, nutritional status',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'Albumin', 'Clinical Chemistry', 'Liver Function', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor ALT (GPT) IFCC Test Kit',
    category: 'Laboratory Reagents',
    price: 9500,
    stock: 20,
    isPriceOnRequest: false,
    storageTemp: 'cold',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/alt-kit.jpg',
    ],
    description: 'Human Liquicolor ALT (GPT) kinetic enzymatic UV test according to IFCC with pyridoxal phosphate activation for quantitative determination of alanine aminotransferase in serum or plasma. Important liver enzyme for hepatitis and liver disease diagnosis. Optimized IFCC method with P5P activation for maximum sensitivity.',
    specifications: {
      'Method': 'IFCC kinetic enzymatic UV with P5P',
      'Sample Type': 'Serum, plasma',
      'Wavelength': '340 nm (334-365 nm)',
      'Linearity': 'Up to 500 U/L',
      'Sensitivity': '5 U/L',
      'Test Count': '100 tests',
      'Storage': '2-8°C',
      'Shelf Life': '18 months',
      'Temperature': '37°C',
      'Clinical Use': 'Liver disease, hepatitis diagnosis',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'ALT', 'GPT', 'Liver Enzyme', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor AST (GOT) IFCC Test Kit',
    category: 'Laboratory Reagents',
    price: 9500,
    stock: 20,
    isPriceOnRequest: false,
    storageTemp: 'cold',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/ast-kit.jpg',
    ],
    description: 'Human Liquicolor AST (GOT) kinetic enzymatic UV test according to IFCC with pyridoxal phosphate activation for quantitative determination of aspartate aminotransferase in serum or plasma. Essential liver and cardiac enzyme marker. IFCC standardized method with P5P activation ensures accurate results.',
    specifications: {
      'Method': 'IFCC kinetic enzymatic UV with P5P',
      'Sample Type': 'Serum, plasma',
      'Wavelength': '340 nm (334-365 nm)',
      'Linearity': 'Up to 500 U/L',
      'Sensitivity': '5 U/L',
      'Test Count': '100 tests',
      'Storage': '2-8°C',
      'Shelf Life': '18 months',
      'Temperature': '37°C',
      'Clinical Use': 'Liver disease, cardiac damage assessment',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'AST', 'GOT', 'Liver Enzyme', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor Alkaline Phosphatase ALP Test Kit',
    category: 'Laboratory Reagents',
    price: 9200,
    stock: 18,
    isPriceOnRequest: false,
    storageTemp: 'cold',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/alp-kit.jpg',
    ],
    description: 'Human Liquicolor Alkaline Phosphatase (ALP) kinetic colorimetric test using p-nitrophenyl phosphate substrate for quantitative determination of ALP activity in serum or plasma. Important for bone and liver disease diagnosis. DGKC optimized method with excellent linearity and precision.',
    specifications: {
      'Method': 'DGKC kinetic colorimetric (p-NPP)',
      'Sample Type': 'Serum, plasma',
      'Wavelength': '405 nm (400-420 nm)',
      'Linearity': 'Up to 800 U/L',
      'Sensitivity': '5 U/L',
      'Test Count': '100 tests',
      'Storage': '2-8°C',
      'Shelf Life': '18 months',
      'Temperature': '37°C',
      'Clinical Use': 'Bone disease, liver disease diagnosis',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'ALP', 'Alkaline Phosphatase', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor Total Bilirubin DPD Test Kit',
    category: 'Laboratory Reagents',
    price: 10500,
    stock: 15,
    isPriceOnRequest: false,
    storageTemp: 'cold',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/total-bilirubin-kit.jpg',
    ],
    description: 'Human Liquicolor Total Bilirubin colorimetric test using DPD (2,5-dichlorophenyldiazonium) method for quantitative determination of total bilirubin in serum or plasma. Fast reaction with minimal interference. Essential for liver function assessment and hemolytic disease diagnosis. Ready-to-use reagents.',
    specifications: {
      'Method': 'DPD colorimetric',
      'Sample Type': 'Serum, plasma',
      'Wavelength': '546 nm (530-560 nm)',
      'Linearity': 'Up to 20 mg/dL (342 μmol/L)',
      'Sensitivity': '0.2 mg/dL',
      'Test Count': '100 tests',
      'Storage': '2-8°C',
      'Shelf Life': '18 months',
      'Reaction Time': '5 minutes',
      'Clinical Use': 'Liver function, hemolytic disease',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'Bilirubin', 'Liver Function', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor Direct Bilirubin DPD Test Kit',
    category: 'Laboratory Reagents',
    price: 10500,
    stock: 15,
    isPriceOnRequest: false,
    storageTemp: 'cold',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/direct-bilirubin-kit.jpg',
    ],
    description: 'Human Liquicolor Direct Bilirubin colorimetric test using DPD method for quantitative determination of conjugated (direct) bilirubin in serum or plasma. Differentiates conjugated from unconjugated bilirubin for precise liver disease diagnosis. Fast and accurate method.',
    specifications: {
      'Method': 'DPD colorimetric',
      'Sample Type': 'Serum, plasma',
      'Wavelength': '546 nm (530-560 nm)',
      'Linearity': 'Up to 15 mg/dL (257 μmol/L)',
      'Sensitivity': '0.1 mg/dL',
      'Test Count': '100 tests',
      'Storage': '2-8°C',
      'Shelf Life': '18 months',
      'Reaction Time': '5 minutes',
      'Clinical Use': 'Liver disease differential diagnosis',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'Direct Bilirubin', 'Liver Function', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor GGT Test Kit',
    category: 'Laboratory Reagents',
    price: 11500,
    stock: 15,
    isPriceOnRequest: false,
    storageTemp: 'cold',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/ggt-kit.jpg',
    ],
    description: 'Human Liquicolor Gamma-Glutamyl Transferase (GGT) kinetic colorimetric test using Szasz method for quantitative determination of GGT activity in serum or plasma. Sensitive marker for hepatobiliary disease and alcohol abuse. IFCC standardized method with excellent precision.',
    specifications: {
      'Method': 'IFCC kinetic colorimetric (Szasz)',
      'Sample Type': 'Serum, plasma',
      'Wavelength': '405 nm (400-420 nm)',
      'Linearity': 'Up to 700 U/L',
      'Sensitivity': '3 U/L',
      'Test Count': '100 tests',
      'Storage': '2-8°C',
      'Shelf Life': '18 months',
      'Temperature': '37°C',
      'Clinical Use': 'Hepatobiliary disease, alcohol abuse',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'GGT', 'Liver Enzyme', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor Calcium Arsenazo III Test Kit',
    category: 'Laboratory Reagents',
    price: 8800,
    stock: 20,
    isPriceOnRequest: false,
    storageTemp: 'room',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/calcium-kit.jpg',
    ],
    description: 'Human Liquicolor Calcium colorimetric test using arsenazo III complexometric method for quantitative determination of calcium in serum, plasma, and urine. High specificity with minimal interference from magnesium. Essential for bone metabolism and parathyroid function assessment. Stable ready-to-use reagents.',
    specifications: {
      'Method': 'Arsenazo III complexometric',
      'Sample Type': 'Serum, plasma, urine',
      'Wavelength': '660 nm (640-680 nm)',
      'Linearity': 'Up to 20 mg/dL (5 mmol/L)',
      'Sensitivity': '0.5 mg/dL',
      'Test Count': '100 tests',
      'Storage': 'Room temperature (15-25°C)',
      'Shelf Life': '24 months',
      'Interference': 'Minimal from magnesium',
      'Clinical Use': 'Bone metabolism, parathyroid function',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'Calcium', 'Electrolytes', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor Magnesium Xylidyl Blue Test Kit',
    category: 'Laboratory Reagents',
    price: 9500,
    stock: 18,
    isPriceOnRequest: false,
    storageTemp: 'room',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/magnesium-kit.jpg',
    ],
    description: 'Human Liquicolor Magnesium colorimetric test using xylidyl blue method for quantitative determination of magnesium in serum and plasma. High specificity without interference from calcium. Important for cardiac arrhythmia evaluation and neuromuscular function assessment. Ready-to-use stable reagents.',
    specifications: {
      'Method': 'Xylidyl blue colorimetric',
      'Sample Type': 'Serum, plasma',
      'Wavelength': '520 nm (500-550 nm)',
      'Linearity': 'Up to 10 mg/dL (4.1 mmol/L)',
      'Sensitivity': '0.2 mg/dL',
      'Test Count': '100 tests',
      'Storage': 'Room temperature (15-25°C)',
      'Shelf Life': '24 months',
      'Interference': 'No calcium interference',
      'Clinical Use': 'Cardiac arrhythmia, neuromuscular function',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'Magnesium', 'Electrolytes', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor Inorganic Phosphorus Test Kit',
    category: 'Laboratory Reagents',
    price: 8500,
    stock: 20,
    isPriceOnRequest: false,
    storageTemp: 'room',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/phosphorus-kit.jpg',
    ],
    description: 'Human Liquicolor Inorganic Phosphorus colorimetric test using molybdate UV method for quantitative determination of inorganic phosphorus in serum, plasma, and urine. High sensitivity and linearity. Essential for bone metabolism, kidney function, and parathyroid disorder assessment. Stable reagents.',
    specifications: {
      'Method': 'Molybdate UV colorimetric',
      'Sample Type': 'Serum, plasma, urine',
      'Wavelength': '340 nm (334-365 nm)',
      'Linearity': 'Up to 20 mg/dL (6.5 mmol/L)',
      'Sensitivity': '0.3 mg/dL',
      'Test Count': '100 tests',
      'Storage': 'Room temperature (15-25°C)',
      'Shelf Life': '24 months',
      'Clinical Use': 'Bone metabolism, kidney function, parathyroid',
      'Standards': 'Traceable to NIST reference material',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'Phosphorus', 'Electrolytes', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor Iron FerroZine Test Kit',
    category: 'Laboratory Reagents',
    price: 10500,
    stock: 15,
    isPriceOnRequest: false,
    storageTemp: 'room',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/iron-kit.jpg',
    ],
    description: 'Human Liquicolor Iron colorimetric test using ferrozine complexometric method for quantitative determination of iron in serum or plasma. High specificity and sensitivity. Essential for anemia diagnosis and iron metabolism assessment. Direct method without deproteinization. Ready-to-use reagents.',
    specifications: {
      'Method': 'Ferrozine complexometric',
      'Sample Type': 'Serum, plasma',
      'Wavelength': '560 nm (550-580 nm)',
      'Linearity': 'Up to 500 μg/dL (89.5 μmol/L)',
      'Sensitivity': '10 μg/dL',
      'Test Count': '100 tests',
      'Storage': 'Room temperature (15-25°C)',
      'Shelf Life': '24 months',
      'Deproteinization': 'Not required',
      'Clinical Use': 'Anemia diagnosis, iron metabolism',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'Iron', 'Anemia', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
  {
    name: 'Human Liquicolor CK-MB Test Kit',
    category: 'Laboratory Reagents',
    price: 15500,
    stock: 12,
    isPriceOnRequest: false,
    storageTemp: 'cold',
    images: [
      'https://res.cloudinary.com/your-cloud/image/upload/v1/Mediport/products/human/ck-mb-kit.jpg',
    ],
    description: 'Human Liquicolor CK-MB immunoinhibition enzymatic UV test for quantitative determination of creatine kinase MB isoenzyme in serum or plasma. Specific cardiac marker for myocardial infarction diagnosis. High specificity through immunoinhibition of CK-M subunit. IFCC standardized method.',
    specifications: {
      'Method': 'Immunoinhibition enzymatic UV (IFCC)',
      'Sample Type': 'Serum, plasma',
      'Wavelength': '340 nm (334-365 nm)',
      'Linearity': 'Up to 500 U/L',
      'Sensitivity': '5 U/L',
      'Test Count': '100 tests',
      'Storage': '2-8°C',
      'Shelf Life': '18 months',
      'Temperature': '37°C',
      'Clinical Use': 'Myocardial infarction diagnosis',
    },
    certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
    tests: '100 tests per kit',
    unit: 'kit',
    minOrderQty: 1,
    tags: ['Human', 'CK-MB', 'Cardiac Marker', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents'],
  },
];

/**
 * Upload image to Cloudinary
 */
async function uploadImage(imageUrl, productName, index = 0) {
  try {
    console.log(`   Uploading image ${index + 1}: ${imageUrl}`);

    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'Mediport/products/human',
      resource_type: 'auto',
      timeout: 60000,
      transformation: [
        { width: 1000, height: 1000, crop: 'limit', quality: 'auto:good' },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      isPrimary: index === 0,
      alt: `${productName} - Human Diagnostics Germany - MediportBD Bangladesh`,
    };
  } catch (error) {
    console.error(`   ✗ Failed to upload image: ${error.message}`);
    return null;
  }
}

/**
 * Upload local image file to Cloudinary
 */
async function uploadLocalImage(filePath, productName, index = 0) {
  try {
    console.log(`   Uploading local image ${index + 1}: ${filePath}`);

    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'Mediport/products/human',
      resource_type: 'auto',
      timeout: 60000,
      transformation: [
        { width: 1000, height: 1000, crop: 'limit', quality: 'auto:good' },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      isPrimary: index === 0,
      alt: `${productName} - Human Diagnostics Germany - MediportBD Bangladesh`,
    };
  } catch (error) {
    console.error(`   ✗ Failed to upload local image: ${error.message}`);
    return null;
  }
}

/**
 * Find or create Human manufacturer
 */
async function getHumanManufacturer() {
  let manufacturer = await Manufacturer.findOne({
    $or: [
      { name: /^Human$/i },
      { slug: 'human' }
    ]
  });

  if (!manufacturer) {
    manufacturer = await Manufacturer.create({
      name: 'Human',
      slug: 'human',
      description: 'Human Diagnostics Worldwide - Leading German manufacturer of in-vitro diagnostic products. Founded in 1968, Human specializes in clinical chemistry, immunology, hemostasis, and point-of-care testing. Known for the Liquicolor reagent line with excellent quality, precision, and reliability. CE IVD certified and ISO 13485 compliant.',
      country: 'Germany',
      website: 'https://www.human.de',
      isActive: true,
    });
    console.log('✓ Created Human manufacturer');
  } else {
    console.log('✓ Found existing Human manufacturer');
  }

  return manufacturer;
}

/**
 * Find category by name
 */
async function findCategory(categoryName) {
  const category = await Category.findOne({
    name: categoryName,
    isActive: true
  });

  if (!category) {
    throw new Error(`Category "${categoryName}" not found. Please create it first or use an existing category.`);
  }

  return category;
}

/**
 * Generate unique SKU
 */
async function generateSKU(productName, manufacturer) {
  const base = productName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 10);

  const prefix = manufacturer.name.substring(0, 3).toUpperCase();
  let sku = `${prefix}-${base}`;

  let counter = 1;
  while (await Product.findOne({ sku })) {
    sku = `${prefix}-${base}-${counter}`;
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
 * Import single product
 */
async function importProduct(productData, manufacturer) {
  try {
    console.log('\n→ Processing: ' + productData.name);

    // Check if product already exists
    const existing = await Product.findOne({
      name: new RegExp('^' + productData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
    });

    if (existing) {
      console.log('   ⊘ Skipped: already exists (ID: ' + existing._id + ')');
      return { success: false, reason: 'duplicate' };
    }

    // Find category
    const category = await findCategory(productData.category);
    console.log('   ✓ Category: ' + productData.category);

    // Generate SKU and slug
    const sku = await generateSKU(productData.name, manufacturer);
    const slug = await generateUniqueSlug(productData.name);

    // Upload images
    const uploadedImages = [];
    if (productData.images && productData.images.length > 0) {
      console.log('   ↑ Uploading ' + productData.images.length + ' image(s)...');
      for (let i = 0; i < productData.images.length; i++) {
        const imageUrl = productData.images[i];
        // Check if it's a local file path or URL
        if (imageUrl.startsWith('http')) {
          const uploaded = await uploadImage(imageUrl, productData.name, i);
          if (uploaded) {
uploadedImages.push(uploaded);
}
        } else {
          const uploaded = await uploadLocalImage(imageUrl, productData.name, i);
          if (uploaded) {
uploadedImages.push(uploaded);
}
        }
      }
      console.log('   ✓ Uploaded ' + uploadedImages.length + ' image(s)');
    }

    // Build specifications
    const specifications = new Map();
    if (productData.specifications) {
      Object.entries(productData.specifications).forEach(([key, value]) => {
        specifications.set(key, value);
      });
    }
    specifications.set('Warranty', '1 year manufacturer warranty');
    specifications.set('Manufacturer', 'Human Diagnostics, Germany');

    // Create product
    const product = await Product.create({
      name: productData.name,
      slug,
      sku,
      description: productData.description,
      brand: manufacturer._id,
      category: category._id,
      price: productData.price,
      oldPrice: productData.oldPrice || null,
      stock: productData.stock,
      lowStockThreshold: 5,
      unit: productData.unit,
      minOrderQty: productData.minOrderQty,
      images: uploadedImages,
      specifications,
      certifications: productData.certifications || [],
      storageTemp: productData.storageTemp || null,
      tests: productData.tests || null,
      badge: productData.badge || null,
      isFeatured: false,
      isActive: true,
      tags: productData.tags || [],
    });

    console.log('   ✓ Created product (ID: ' + product._id + ')');
    console.log('   ✓ Price: ' + (productData.isPriceOnRequest ? 'Price on request' : '৳' + product.price.toLocaleString()));
    console.log('   ✓ Stock: ' + product.stock + ' units');
    return { success: true, product };
  } catch (error) {
    console.error('   ✗ Error: ' + error.message);
    return { success: false, reason: error.message };
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  HUMAN Brand Reagent Product Import');
  console.log('═══════════════════════════════════════════════════════════\n');

  const stats = {
    total: HUMAN_PRODUCTS.length,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  try {
    console.log('→ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const manufacturer = await getHumanManufacturer();
    console.log('   ID: ' + manufacturer._id + '\n');

    console.log('→ Importing ' + stats.total + ' product(s)...\n');
    console.log('─'.repeat(60));

    for (const productData of HUMAN_PRODUCTS) {
      const result = await importProduct(productData, manufacturer);
      if (result.success) {
        stats.success++;
      } else if (result.reason === 'duplicate') {
        stats.skipped++;
      } else {
        stats.failed++;
        stats.errors.push({ product: productData.name, error: result.reason });
      }
      // Rate limiting to avoid overwhelming Cloudinary
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 Import Summary:');
    console.log('─'.repeat(60));
    console.log('   Total products:       ' + stats.total);
    console.log('   ✓ Successfully added: ' + stats.success);
    console.log('   ⊘ Skipped (existing): ' + stats.skipped);
    console.log('   ✗ Failed:             ' + stats.failed);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:\n');
      stats.errors.forEach((e, i) => {
        console.log('   ' + (i + 1) + '. ' + e.product);
        console.log('      ' + e.error + '\n');
      });
    }

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

// Run the import
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
