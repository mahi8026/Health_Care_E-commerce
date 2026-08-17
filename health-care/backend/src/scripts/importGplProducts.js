#!/usr/bin/env node

/**
 * GPL (Reactivos GPL, Barcelona, Spain) Reagent Import Script
 * Adds GPL Laboratory Reagents to MediportBD.
 *
 * Usage:
 *   node src/scripts/importGplProducts.js
 *
 * Data source: GPL price list shared by the owner (78 products:
 * 53 biochemistry + 3 turbi + 11 febrile antigens + 11 latex).
 * Prices are trade prices imported as-is per owner decision.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Manufacturer = require('../models/Manufacturer');
const cloudinary = require('cloudinary').v2;
const slugify = require('slugify');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const GPL_META = {
  creatinine: ['Creatinine Jaffe', 'Jaffe kinetic (compensated)',
    'Quantitative determination of creatinine in serum, plasma or urine by the Jaffe kinetic method. Liquid, ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  alt: ['GPT/ALT (SGPT)', 'IFCC kinetic UV (Liquid)',
    'Quantitative determination of Alanine Aminotransferase (GPT/ALT) in serum or plasma by the IFCC kinetic UV method. Liquid, ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  ast: ['GOT/AST (SGOT)', 'IFCC kinetic UV (Liquid)',
    'Quantitative determination of Aspartate Aminotransferase (GOT/AST) in serum or plasma by the IFCC kinetic UV method. Liquid, ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  alp: ['ALP (Alkaline Phosphatase)', 'pNPP kinetic (Liquid)',
    'Quantitative determination of Alkaline Phosphatase (ALP) in serum or plasma by the p-nitrophenylphosphate (pNPP) kinetic method. Liquid, ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  uric: ['Uric Acid', 'Uricase-POD, liquid stable',
    'Quantitative determination of uric acid in serum, plasma or urine by the uricase/peroxidase (Uricase-POD) method. Liquid, stable reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  calcium: ['Calcium (OCPC)', 'O-Cresolphthalein complexone (OCPC)',
    'Quantitative determination of calcium in serum or plasma by the O-cresolphthalein complexone (OCPC) colorimetric method. Ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  cholesterol: ['Cholesterol', 'CHOD-POD, liquid stable',
    'Quantitative determination of total cholesterol in serum or plasma by the enzymatic CHOD-POD method. Liquid, stable reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  triglyceride: ['Triglyceride', 'GPO-POD, liquid stable',
    'Quantitative determination of triglycerides in serum or plasma by the enzymatic GPO-POD method. Liquid, stable reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  hdl_precip: ['HDL-Cholesterol (Precipitating)', 'Phosphotungstate precipitation + CHOD-POD',
    'Quantitative determination of HDL-cholesterol after selective precipitation of LDL/VLDL lipoproteins. Precipitating reagent kit (reagent only) used with the GPL cholesterol reagent on clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  hdl_direct: ['HDL-Cholesterol Direct', 'Direct enzymatic method',
    'Direct quantitative determination of HDL-cholesterol in serum or plasma without pretreatment, by a direct enzymatic selective method. Kit includes calibrator. For clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  bili_total: ['Bilirubin Total DMSO', 'DMSO diazo (Jendrassik-Grof)',
    'Quantitative determination of total bilirubin in serum or plasma by the DMSO diazo method. Ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  bili_total_direct: ['Bilirubin Total + Direct DMSO', 'DMSO diazo (Jendrassik-Grof)',
    'Quantitative determination of total and direct (conjugated) bilirubin in serum or plasma by the DMSO diazo method. Ready-to-use reagent set for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  glucose: ['Glucose', 'GOD-POD (CHOD-POD), liquid stable',
    'Quantitative determination of glucose in serum, plasma or urine by the enzymatic Glucose Oxidase/Peroxidase (GOD-POD) method. Liquid, stable reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  amylase: ['Amylase', 'CNPG3 colorimetric, liquid stable',
    'Quantitative determination of alpha-amylase in serum, plasma or urine by the CNPG3 colorimetric method. Liquid, stable reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  albumin: ['Albumin', 'BCG (Bromocresol green)',
    'Quantitative determination of albumin in serum or plasma by the Bromocresol Green (BCG) colorimetric method. Ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  protein: ['Total Protein', 'Biuret',
    'Quantitative determination of total protein in serum or plasma by the Biuret colorimetric method. Ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  ldh: ['LDH', 'UV kinetic (Liquid)',
    'Quantitative determination of Lactate Dehydrogenase (LDH) in serum or plasma by the kinetic UV method. Liquid, ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  urea_uv: ['Urea UV', 'Urease-GLDH, UV kinetic',
    'Quantitative determination of urea in serum, plasma or urine by the urease/GLDH UV kinetic method. Liquid, ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  urea_color: ['Urea Color (Berthelot)', 'Berthelot indophenol',
    'Quantitative determination of urea by the Berthelot indophenol colorimetric method. Ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  magnesium: ['Magnesium', 'Xylidyl blue colorimetric',
    'Quantitative determination of magnesium in serum, plasma or urine by the xylidyl blue colorimetric method. Ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  phosphorous: ['Phosphorous UV', 'Phosphomolybdate, UV',
    'Quantitative determination of inorganic phosphorus in serum, plasma or urine by the phosphomolybdate UV method. Ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  urine_protein: ['Urine/CSF Protein', 'Pyrogallol red colorimetric',
    'Quantitative determination of total protein in urine and cerebrospinal fluid (CSF) by the pyrogallol red colorimetric method. Ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  ck_nac: ['CK-NAC', 'IFCC, NAC-activated UV kinetic',
    'Quantitative determination of Creatine Kinase (CK) in serum or plasma by the NAC-activated IFCC kinetic UV method. Liquid, ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  ck_mb: ['CK-MB', 'Immunoinhibition + NAC UV kinetic',
    'Quantitative determination of the CK-MB isoenzyme in serum or plasma by the immunoinhibition method with NAC activation (kinetic UV). Liquid, ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  acid_phos: ['Acid Phosphatase', 'pNPP colorimetric',
    'Quantitative determination of acid phosphatase (total/prostatic) in serum by the p-nitrophenylphosphate (pNPP) colorimetric method. Ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  lipase: ['Lipase', 'Enzymatic colorimetric',
    'Quantitative determination of lipase in serum or plasma by an enzymatic colorimetric method. Ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  iron: ['Iron (Ferrozine)', 'Ferrozine colorimetric',
    'Quantitative determination of serum iron by the Ferrozine colorimetric method. Ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  zinc: ['Zinc', 'Colorimetric (5-Br-PAPS)',
    'Quantitative determination of zinc in serum or plasma by a colorimetric method (5-Br-PAPS). Ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  gamma_gt: ['Gamma GT', 'Szasz kinetic (GCNA)',
    'Quantitative determination of Gamma-Glutamyltransferase (GGT) in serum or plasma by the Szasz kinetic method (GCNA substrate). Liquid, ready-to-use reagent for clinical chemistry analyzers. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  crp_turbi: ['CRP Turbi', 'Immunoturbidimetric',
    'Quantitative determination of C-Reactive Protein (CRP) in serum or plasma by immunoturbidimetry for clinical chemistry analyzers. Liquid, ready-to-use reagent. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  rf_turbi: ['RF Turbi', 'Immunoturbidimetric',
    'Quantitative determination of Rheumatoid Factor (RF) in serum or plasma by immunoturbidimetry for clinical chemistry analyzers. Liquid, ready-to-use reagent. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  aso_turbi: ['ASO Turbi', 'Immunoturbidimetric',
    'Quantitative determination of Anti-Streptolysin O (ASO) antibodies in serum or plasma by immunoturbidimetry for clinical chemistry analyzers. Liquid, ready-to-use reagent. In vitro diagnostic (IVD) use. Store at 2-8C, protected from light.'],
  s_typhi_o: ['S. Typhi O Antigen', 'Widal slide agglutination',
    'S. Typhi O antigen suspension for the Widal slide agglutination test, used for the qualitative and semi-quantitative detection of typhoid O agglutinins in serum. Ready-to-use, IVD use. Store at 2-8C.'],
  s_typhi_h: ['S. Typhi H Antigen', 'Widal slide agglutination',
    'S. Typhi H antigen suspension for the Widal slide agglutination test, used for the qualitative and semi-quantitative detection of typhoid H agglutinins in serum. Ready-to-use, IVD use. Store at 2-8C.'],
  s_para_ah: ['S. Para Typhi AH Antigen', 'Widal slide agglutination',
    'S. Paratyphi AH antigen suspension for the Widal slide agglutination test for the detection of paratyphoid AH agglutinins in serum. Ready-to-use, IVD use. Store at 2-8C.'],
  s_para_bh: ['S. Para Typhi BH Antigen', 'Widal slide agglutination',
    'S. Paratyphi BH antigen suspension for the Widal slide agglutination test for the detection of paratyphoid BH agglutinins in serum. Ready-to-use, IVD use. Store at 2-8C.'],
  s_para_ao: ['S. Para Typhi AO Antigen', 'Widal slide agglutination',
    'S. Paratyphi AO antigen suspension for the Widal slide agglutination test for the detection of paratyphoid AO agglutinins in serum. Ready-to-use, IVD use. Store at 2-8C.'],
  s_para_bo: ['S. Para Typhi BO Antigen', 'Widal slide agglutination',
    'S. Paratyphi BO antigen suspension for the Widal slide agglutination test for the detection of paratyphoid BO agglutinins in serum. Ready-to-use, IVD use. Store at 2-8C.'],
  proteus_oxk: ['Proteus OX-K Antigen', 'Weil-Felix slide agglutination',
    'Proteus OX-K antigen suspension for the Weil-Felix slide agglutination test for rickettsial infection screening. Ready-to-use, IVD use. Store at 2-8C.'],
  proteus_ox2: ['Proteus OX-2 Antigen', 'Weil-Felix slide agglutination',
    'Proteus OX-2 antigen suspension for the Weil-Felix slide agglutination test for rickettsial infection screening. Ready-to-use, IVD use. Store at 2-8C.'],
  proteus_ox19: ['Proteus OX-19 Antigen', 'Weil-Felix slide agglutination',
    'Proteus OX-19 antigen suspension for the Weil-Felix slide agglutination test for rickettsial infection screening. Ready-to-use, IVD use. Store at 2-8C.'],
  brucella_abortus: ['Brucella Abortus Antigen', 'Slide agglutination',
    'Brucella abortus antigen suspension for the slide agglutination test for the detection of brucellosis antibodies in serum. Ready-to-use, IVD use. Store at 2-8C.'],
  brucella_melitensis: ['Brucella Melitensis Antigen', 'Slide agglutination',
    'Brucella melitensis antigen suspension for the slide agglutination test for the detection of brucellosis antibodies in serum. Ready-to-use, IVD use. Store at 2-8C.'],
  aso_latex: ['ASO Latex', 'Slide latex agglutination',
    'ASO latex reagent for the rapid slide latex agglutination detection of Anti-Streptolysin O antibodies in serum. Ready-to-use, IVD use. Store at 2-8C.'],
  aso_latex_control: ['ASO Latex (with Control Slide)', 'Slide latex agglutination',
    'ASO latex reagent with control slide for the rapid slide latex agglutination detection of Anti-Streptolysin O antibodies in serum. Ready-to-use, IVD use. Store at 2-8C.'],
  aso_latex_25: ['ASO Latex (2.5 ml)', 'Slide latex agglutination',
    'ASO latex reagent for the rapid slide latex agglutination detection of Anti-Streptolysin O antibodies in serum. Compact 2.5 ml presentation. Ready-to-use, IVD use. Store at 2-8C.'],
  crp_latex: ['CRP Latex', 'Slide latex agglutination',
    'CRP latex reagent for the rapid slide latex agglutination detection of C-Reactive Protein in serum. Ready-to-use, IVD use. Store at 2-8C.'],
  crp_latex_control: ['CRP Latex (with Control Slide)', 'Slide latex agglutination',
    'CRP latex reagent with control slide for the rapid slide latex agglutination detection of C-Reactive Protein in serum. Ready-to-use, IVD use. Store at 2-8C.'],
  crp_latex_25: ['CRP Latex (2.5 ml)', 'Slide latex agglutination',
    'CRP latex reagent for the rapid slide latex agglutination detection of C-Reactive Protein in serum. Compact 2.5 ml presentation. Ready-to-use, IVD use. Store at 2-8C.'],
  rf_latex: ['RF Latex', 'Slide latex agglutination',
    'RF latex reagent for the rapid slide latex agglutination detection of Rheumatoid Factor in serum. Ready-to-use, IVD use. Store at 2-8C.'],
  rf_latex_control: ['RF Latex (with Control Slide)', 'Slide latex agglutination',
    'RF latex reagent with control slide for the rapid slide latex agglutination detection of Rheumatoid Factor in serum. Ready-to-use, IVD use. Store at 2-8C.'],
  rf_latex_25: ['RF Latex (2.5 ml)', 'Slide latex agglutination',
    'RF latex reagent for the rapid slide latex agglutination detection of Rheumatoid Factor in serum. Compact 2.5 ml presentation. Ready-to-use, IVD use. Store at 2-8C.'],
  rpr_carbon: ['RPR Carbon Vial', 'RPR card flocculation',
    'RPR carbon antigen for the rapid plasma reagin card test for syphilis screening (non-treponemal). Ready-to-use, IVD use. Store at 2-8C.'],
  rpr_carbon_slide: ['RPR Carbon (with Slide Control)', 'RPR card flocculation',
    'RPR carbon antigen with slide control for the rapid plasma reagin card test for syphilis screening (non-treponemal). Ready-to-use, IVD use. Store at 2-8C.'],
};

// Rows: [catalogCode, metaKey, packSize, tradePrice]
const GPL_ROWS = [
  // ── Biochemistry (53) ────────────────────────────────────────────────────
  ['SU015-SP', 'creatinine', '2x50 ml', 1200],
  ['SU015', 'creatinine', '2x125 ml', 2000],
  ['SU016', 'creatinine', '8x125 ml', 7500],
  ['EZ016LQ-SP', 'alt', '40+10 ml', 1500],
  ['EZ016LQ', 'alt', '100+25 ml', 2500],
  ['EZ017', 'alt', '2x100+2x25 ml', 4800],
  ['EZ012LQ-SP', 'ast', '40+10 ml', 1500],
  ['EZ012LQ', 'ast', '100+25 ml', 2500],
  ['EZ002LQ-SP', 'alp', '40+10 ml', 1500],
  ['EZ002LQ', 'alp', '100+25 ml', 2500],
  ['SU042', 'uric', '2x50 ml', 2000],
  ['SU043', 'uric', '2x125 ml', 4400],
  ['SU009-SP', 'calcium', '2x50 ml', 2000],
  ['SU009', 'calcium', '2x125 ml', 4500],
  ['SU011', 'cholesterol', '2x50 ml', 1600],
  ['SU012', 'cholesterol', '2x125 ml', 3500],
  ['SU012', 'cholesterol', '1x125 ml', 2200],
  ['SU033', 'triglyceride', '2x50 ml', 2500],
  ['SU034', 'triglyceride', '2x125 ml', 5200],
  ['SU034', 'triglyceride', '1x125 ml', 2700],
  ['SU014', 'hdl_precip', '3x10 ml (300 tests)', 3000],
  ['SU014', 'hdl_precip', '1x10 ml (100 tests)', 1100],
  ['SU014-LQ', 'hdl_direct', '30+10 ml + cal', 9500],
  ['SU014-LQ', 'hdl_direct', '30+10 ml + cal', 16000],
  ['SU017', 'hdl_direct', '2x50 ml', 12500],
  ['SU004-SP', 'bili_total', '2x125 ml', 2000],
  ['SU004', 'bili_total', '2x50 ml', 3000],
  ['SU005-sp', 'bili_total_direct', '4x250 ml', 2000],
  ['SU019', 'glucose', '5x10 ml', 3200],
  ['EZ004-SP', 'amylase', '1x10 ml', 6500],
  ['EZ004-sp', 'amylase', '2x50 ml', 1500],
  ['SU001-SP', 'albumin', '2x125 ml', 1400],
  ['SU001', 'albumin', '1x125 ml', 3000],
  ['SU001', 'albumin', '2x50 ml', 1600],
  ['SU029SP', 'protein', '2x125 ml', 1400],
  ['SU029', 'protein', '1x125 ml', 3000],
  ['SU029', 'protein', '40+10 ml', 1600],
  ['EZ021LQ-SP', 'ldh', '40+10 ml', 1500],
  ['SU037-sp', 'urea_uv', '2x125 ml', 1500],
  ['SU038', 'urea_color', '2x125 ml', 3000],
  ['SU025', 'magnesium', '2x50 ml', 5000],
  ['SU027-SP', 'phosphorous', '1x125 ml', 2500],
  ['SU027', 'phosphorous', '2x125 ml', 2600],
  ['SU027', 'phosphorous', '1x125 ml', 5000],
  ['SU031', 'urine_protein', '2x125 ml', 4200],
  ['SU031', 'urine_protein', '1x125 ml', 2400],
  ['EZ007-SP', 'ck_nac', '20+5 ml', 4000],
  ['EZ008-SP', 'ck_mb', '20+5 ml', 6000],
  ['EZ001', 'acid_phos', '19x2 ml', 6000],
  ['EZ025', 'lipase', '4x10 ml', 21000],
  ['SU022-SP', 'iron', '40+10 ml', 4000],
  ['SU048', 'zinc', '5x10 ml', 15000],
  ['EZ009-SP', 'gamma_gt', '40+10 ml', 3500],
  // ── Turbi Reagents (3) ────────────────────────────────────────────────────
  ['TL035', 'crp_turbi', '40+10 ml', 7500],
  ['TL025', 'rf_turbi', '40+10 ml', 7500],
  ['TL015', 'aso_turbi', '40+10 ml', 7500],
  // ── Serology - Febrile Antigens (11) ──────────────────────────────────────
  ['SE033', 's_typhi_o', '5 ml', 700],
  ['SE034', 's_typhi_h', '5 ml', 700],
  ['SE028', 's_para_ah', '5 ml', 700],
  ['SE030', 's_para_bh', '5 ml', 700],
  ['SE027', 's_para_ao', '5 ml', 700],
  ['SE029', 's_para_bo', '5 ml', 700],
  ['SE038', 'proteus_oxk', '5 ml', 800],
  ['SE037', 'proteus_ox2', '5 ml', 800],
  ['SE036', 'proteus_ox19', '5 ml', 800],
  ['SE035', 'brucella_abortus', '5 ml', 800],
  ['SE035-M', 'brucella_melitensis', '5 ml', 800],
  // ── Serology - Latex (11) ─────────────────────────────────────────────────
  ['SE003', 'aso_latex', '1x5 ml (100 tests)', 2000],
  ['SE002', 'aso_latex_control', '100 tests', 3000],
  ['7040100-R', 'aso_latex_25', '1x2.5 ml (50 tests)', 1200],
  ['SE007', 'crp_latex', '1x5 ml (100 tests)', 2000],
  ['SE006', 'crp_latex_control', '100 tests', 3000],
  ['7040110-R', 'crp_latex_25', '1x2.5 ml (50 tests)', 1200],
  ['SE011', 'rf_latex', '1x5 ml (100 tests)', 2000],
  ['SE010', 'rf_latex_control', '100 tests', 3000],
  ['7040120-R', 'rf_latex_25', '1x2.5 ml (50 tests)', 1200],
  ['7040131-R', 'rpr_carbon', '1x5 ml', 1000],
  ['SE013', 'rpr_carbon_slide', '125 tests', 3000],
];

const isAntigen = (key) =>
  /^s_typhi|^s_para|^proteus|^brucella/.test(key);

function buildProducts() {
  // Ensure unique SKUs (the price list repeats catalog codes for different packs;
  // normalized to uppercase because the Product schema uppercases sku values)
  const skuCounts = {};
  for (const [sku] of GPL_ROWS) {
    const norm = sku.toUpperCase();
    skuCounts[norm] = (skuCounts[norm] || 0) + 1;
  }
  const skuUsed = {};

  const nameCounts = {};
  const products = [];

  for (const [sku, key, size, price] of GPL_ROWS) {
    const [display, method, desc] = GPL_META[key];
    const norm = sku.toUpperCase();
    skuUsed[norm] = (skuUsed[norm] || 0) + 1;
    const uniqueSku = skuCounts[norm] > 1 ? norm + '-' + skuUsed[norm] : norm;

    const kind = isAntigen(key) ? 'Antigen' : 'Reagent';
    let name = 'GPL ' + display + ' ' + kind + ' (' + size + ')';
    if (name.includes('Antigen Antigen')) {
      name = name.replace('Antigen Antigen', 'Antigen');
    }
    nameCounts[name] = (nameCounts[name] || 0) + 1;
    if (nameCounts[name] > 1) {
      name += ' - ' + uniqueSku;
    }

    const description =
      desc + ' Kit size: ' + size + '. Catalog code: ' + sku + '.';

    products.push({
      name,
      description,
      category: 'Laboratory Reagents',
      price,
      oldPrice: null,
      stock: 20,
      lowStockThreshold: 5,
      unit: 'kit',
      minOrderQty: 1,
      images: [],
      specifications: {
        'Brand': 'GPL (Reactivos GPL)',
        'Origin': 'Barcelona, Spain',
        'Catalog No': sku,
        'Product': display,
        'Method': method,
        'Pack Size': size,
        'Format': isAntigen(key) ? 'Suspension, ready to use' : 'Liquid, ready to use',
        'Storage': '2-8C, protected from light',
        'Use': 'For in vitro diagnostic (IVD) use in clinical laboratories',
      },
      certifications: [],
      warranty: null,
      badge: null,
      isFeatured: false,
      tags: ['GPL', 'Reagent', 'Laboratory', 'Clinical Chemistry', 'IVD'],
      sku: uniqueSku,
      manufacturer: 'GPL',
    });
  }
  return products;
}

const GPL_PRODUCTS = buildProducts();

async function uploadImage(imageUrl, productName, index) {
  try {
    console.log('   Uploading image ' + (index + 1) + ': ' + imageUrl);
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'Mediport/products/gpl',
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
      alt: productName + ' - GPL - MediportBD',
    };
  } catch (error) {
    console.error('   x Failed to upload image: ' + error.message);
    return null;
  }
}

async function getManufacturer(raw) {
  const brandName = (raw && raw.manufacturer) || 'Generic';
  let manufacturer = await Manufacturer.findOne({ name: brandName });
  if (!manufacturer) {
    manufacturer = await Manufacturer.create({
      name: brandName,
      slug: slugify(brandName, { lower: true, strict: true }),
      description: brandName + ' products.',
      isActive: true,
    });
    console.log('✓ Created ' + brandName + ' manufacturer');
  } else {
    console.log('✓ Found ' + manufacturer.name + ' manufacturer');
  }
  return manufacturer;
}

async function findCategory(mappedName) {
  const category = await Category.findOne({ name: mappedName, isActive: true });
  if (!category) {
    throw new Error('Category "' + mappedName + '" not found in DB');
  }
  return category;
}

async function generateUniqueSlug(name) {
  let slug = slugify(name, { lower: true, strict: true });
  let counter = 1;
  while (await Product.findOne({ slug })) {
    slug = slugify(name, { lower: true, strict: true }) + '-' + counter;
    counter++;
  }
  return slug;
}

async function importProduct(raw) {
  try {
    console.log('\n→ Processing: ' + raw.name);

    const existing = await Product.findOne({
      name: new RegExp('^' + raw.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
    });
    if (existing) {
      console.log('   ⊘ Skipped: already exists (ID: ' + existing._id + ')');
      return { success: false, reason: 'duplicate' };
    }

    const category = await findCategory(raw.category);
    console.log('   ✓ Category: ' + raw.category);

    const sku = (raw.sku || '').trim();
    const slug = await generateUniqueSlug(raw.name);

    const uploadedImages = [];
    if (raw.images && raw.images.length) {
      console.log('   ↑ Uploading ' + raw.images.length + ' image(s)...');
      for (let i = 0; i < raw.images.length && i < 5; i++) {
        const up = await uploadImage(raw.images[i], raw.name, i);
        if (up) {
          uploadedImages.push(up);
        }
      }
      console.log('   ✓ Uploaded ' + uploadedImages.length + ' image(s)');
    }

    const specifications = new Map(Object.entries(raw.specifications || {}));

    const product = await Product.create({
      name: raw.name,
      slug,
      sku,
      description: raw.description,
      brand: manufacturer._id,
      category: category._id,
      price: raw.price,
      oldPrice: raw.oldPrice || null,
      stock: raw.stock,
      lowStockThreshold: raw.lowStockThreshold || 10,
      unit: raw.unit || 'piece',
      minOrderQty: raw.minOrderQty || 1,
      images: uploadedImages,
      specifications,
      certifications: raw.certifications || [],
      badge: raw.badge || null,
      isFeatured: raw.isFeatured || false,
      isActive: true,
      tags: raw.tags || [],
    });

    console.log('   ✓ Created product (ID: ' + product._id + ')');
    console.log('   ✓ Price: ৳' + product.price.toLocaleString());
    console.log('   ✓ Stock: ' + product.stock + ' units');
    return { success: true, product };
  } catch (error) {
    console.error('   ✗ Error: ' + error.message);
    return { success: false, reason: error.message };
  }
}

let manufacturer;

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  GPL PRODUCT IMPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  const stats = { total: GPL_PRODUCTS.length, success: 0, failed: 0, skipped: 0, errors: [] };

  try {
    console.log('→ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    manufacturer = await getManufacturer(GPL_PRODUCTS[0]);
    console.log('   ID: ' + manufacturer._id + '\n');

    console.log('→ Importing ' + stats.total + ' product(s)...\n');
    console.log('─'.repeat(60));

    for (const raw of GPL_PRODUCTS) {
      manufacturer = await getManufacturer(raw);
      const result = await importProduct(raw);
      if (result.success) {
        stats.success++;
      } else if (result.reason === 'duplicate') {
        stats.skipped++;
      } else {
        stats.failed++;
        stats.errors.push({ product: raw.name, error: result.reason });
      }
      await new Promise((r) => setTimeout(r, 800));
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 Import Summary:');
    console.log('─'.repeat(60));
    console.log('   Total products:      ' + stats.total);
    console.log('   ✓ Successfully added: ' + stats.success);
    console.log('   ⊘ Skipped (existing): ' + stats.skipped);
    console.log('   ✗ Failed:             ' + stats.failed);

    if (stats.errors.length) {
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

main().catch((e) => {
  console.error('Unhandled error:', e);
  process.exit(1);
});
