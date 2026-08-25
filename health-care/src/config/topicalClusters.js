/**
 * Topical content clusters registry.
 *
 * Groups existing pages (equipment landing pages, buying guides, product
 * categories) into topic clusters so Google sees MediportBD as an authority
 * on each medical-equipment topic. Hubs live at /topics/<slug>.
 *
 * Add or extend clusters here and the hub pages, internal links and sitemap
 * update automatically.
 */

import { getLandingPageBySlug } from './landingPages.js';

export const TOPICAL_CLUSTERS = [
  {
    slug: 'ecg-machines',
    icon: '🫀',
    title: 'ECG Machines in Bangladesh',
    metaTitle: 'ECG Machines in Bangladesh — Prices, Brands & Buying Guide | MediportBD',
    metaDescription:
      'ECG machines in Bangladesh — 3-lead, 6-lead and 12-lead ECG machine prices, brands, DGDA info and buying guidance for clinics, hospitals and diagnostic centres from MediportBD.',
    keywords: [
      'ECG machine Bangladesh',
      'ECG machine price BD',
      '12 lead ECG machine Bangladesh',
      'ECG machine supplier Dhaka',
      'ECG machine brands Bangladesh',
    ],
    intro: [
      'Electrocardiography (ECG) machines are essential diagnostic tools for every clinic, hospital ward and diagnostic centre in Bangladesh. At MediportBD, we supply genuine 3-lead, 6-lead and 12-lead ECG machines from world-leading brands including Siemens Healthineers, GE Healthcare, Nihon Kohden and other CE-certified manufacturers.',
      'Every ECG machine we supply is DGDA registered and delivered with installation, calibration, operator training and full manufacturer warranty. From portable ECG units for rural clinics to hospital-grade 12-channel systems with interpretation software, we help you select the right machine for your patient volume and budget.',
    ],
    landingSlugs: ['ecg-machine-price-bangladesh', 'patient-monitor-price-bangladesh'],
    guideSlugs: ['ecg-machine-price-bangladesh-2026', 'siemens-vs-ge-ecg-machines'],
    brandSlugs: ['mindray', 'edan', 'contec', 'comen'],
    categorySlug: 'diagnostic-equipment',
  },
  {
    slug: 'blood-pressure-monitors',
    icon: '🩺',
    title: 'Blood Pressure Monitors in Bangladesh',
    metaTitle: 'Blood Pressure Monitors in Bangladesh — Prices & Buying Guide | MediportBD',
    metaDescription:
      'Blood pressure monitors in Bangladesh — digital BP machines, cuffs and accessories from Omron, Rossmax, Microlife and Beurer with prices, DGDA certification and delivery from MediportBD.',
    keywords: [
      'blood pressure monitor Bangladesh',
      'BP machine price BD',
      'digital BP machine Bangladesh',
      'Omron BP monitor Dhaka',
      'BP monitor buying guide Bangladesh',
    ],
    intro: [
      'High blood pressure affects millions of people in Bangladesh, making accurate home blood pressure monitoring more important than ever. MediportBD supplies digital and automatic BP monitors from trusted global brands like Omron, Rossmax, Microlife and Beurer — all DGDA registered with genuine warranty.',
      'Whether you need a simple wrist monitor for home use or a professional arm-cuff monitor for your pharmacy or clinic, our range covers every need with clear pricing and fast nationwide delivery.',
    ],
    landingSlugs: ['blood-pressure-monitor-price-bangladesh', 'pulse-oximeter-price-bangladesh'],
    guideSlugs: ['bp-monitor-buying-guide-bangladesh'],
    brandSlugs: ['omron', 'rossmax', 'microlife', 'beurer'],
    categorySlug: 'diagnostic-equipment',
  },
  {
    slug: 'ultrasound-machines',
    icon: '🩻',
    title: 'Ultrasound Machines in Bangladesh',
    metaTitle: 'Ultrasound Machines in Bangladesh — Prices & Buying Guide | MediportBD',
    metaDescription:
      'Ultrasound machines in Bangladesh — portable and color Doppler ultrasound systems, probes and accessories with prices, DGDA certification and training from MediportBD.',
    keywords: [
      'ultrasound machine Bangladesh',
      'ultrasound price BD',
      'color Doppler ultrasound Bangladesh',
      'portable ultrasound machine Dhaka',
      'ultrasound machine supplier Bangladesh',
    ],
    intro: [
      'Ultrasound imaging is the backbone of modern diagnostic medicine, and MediportBD supplies ultrasound machines to clinics, diagnostic centres and hospitals across Bangladesh. Our range includes portable and laptop systems, plus full color Doppler machines for advanced imaging.',
      'Every system is delivered with the right transducer probes, installation, operator training and a comprehensive warranty. B2B pricing and financing options are available for diagnostic centre expansion projects.',
    ],
    landingSlugs: ['ultrasound-machine-price-bangladesh', 'x-ray-machine-price-bangladesh'],
    guideSlugs: ['diagnostic-equipment-guide-bangladesh'],
    brandSlugs: ['mindray', 'edan', 'contec'],
    categorySlug: 'diagnostic-equipment',
  },
  {
    slug: 'surgical-instruments',
    icon: '🩹',
    title: 'Surgical Instruments in Bangladesh',
    metaTitle: 'Surgical Instruments in Bangladesh — Prices & Buying Guide | MediportBD',
    metaDescription:
      'Surgical instruments in Bangladesh — scissors, forceps, needle holders, trocars and operation theatre sets with prices, CE certification and bulk hospital pricing from MediportBD.',
    keywords: [
      'surgical instruments Bangladesh',
      'surgical instruments price BD',
      'surgical scissors Bangladesh',
      'surgical instruments supplier Dhaka',
      'operation theatre instruments Bangladesh',
    ],
    intro: [
      'MediportBD supplies premium surgical instruments to operation theatres, surgical clinics and hospitals across Bangladesh. Our catalog includes scissors, forceps, needle holders, trocars, scalpels and complete surgical sets in medical-grade stainless steel.',
      'All instruments are CE certified, autoclavable and DGDA registered, with bulk B2B pricing for hospitals, surgical centres and medical colleges. Request a formal quotation for tenders and institutional procurement.',
    ],
    landingSlugs: ['surgical-instruments-price-bangladesh'],
    guideSlugs: ['surgical-instruments-guide-bangladesh'],
    categorySlug: 'surgical-instruments',
  },
  {
    slug: 'laboratory-equipment-reagents',
    icon: '🔬',
    title: 'Laboratory Equipment & Reagents in Bangladesh',
    metaTitle: 'Laboratory Equipment & Reagents in Bangladesh | MediportBD',
    metaDescription:
      'Laboratory equipment and reagents in Bangladesh — hematology analyzers, microscopes, autoclaves, reagents and rapid test kits with prices, cold-chain delivery and B2B pricing from MediportBD.',
    keywords: [
      'laboratory equipment Bangladesh',
      'laboratory reagents Bangladesh',
      'hematology analyzer price BD',
      'microscope price Bangladesh',
      'autoclave price Bangladesh',
      'cold chain reagent delivery Bangladesh',
    ],
    intro: [
      'From hematology analyzers and microscopes to reagents and rapid test kits, MediportBD equips laboratories across Bangladesh with everything needed for accurate diagnostics. We supply equipment from STEL, Bio-Max, THERMA and other leading brands, plus reagents with full cold-chain delivery.',
      'B2B clients enjoy bulk pricing, regular supply contracts and scheduled delivery for their laboratory reagent and consumable needs. Equipment calibration, installation and AMC service available.',
    ],
    landingSlugs: [
      'microscope-price-bangladesh',
      'autoclave-price-bangladesh',
      'glucose-meter-price-bangladesh',
    ],
    guideSlugs: [
      'laboratory-reagents-guide-bangladesh',
      'hba1c-reagent-comparison-bangladesh',
      'cold-chain-reagent-delivery-bangladesh',
    ],
    brandSlugs: ['gpl', 'finecare', 'human', 'bio-max'],
    categorySlug: 'laboratory-equipment',
  },
  {
    slug: 'hospital-icu-equipment',
    icon: '🏥',
    title: 'Hospital & ICU Equipment in Bangladesh',
    metaTitle: 'Hospital & ICU Equipment in Bangladesh — Prices & Buying Guide | MediportBD',
    metaDescription:
      'Hospital and ICU equipment in Bangladesh — patient monitors, ventilators, infusion pumps, defibrillators and hospital furniture with prices, installation and B2B pricing from MediportBD.',
    keywords: [
      'hospital equipment Bangladesh',
      'hospital equipment supplier Bangladesh',
      'ICU equipment Bangladesh',
      'patient monitor Bangladesh',
      'ventilator price BD',
      'infusion pump Bangladesh',
    ],
    intro: [
      'MediportBD supplies complete hospital and ICU equipment solutions for hospitals, clinics and diagnostic centres across Bangladesh. From patient monitors and ventilators to infusion pumps and hospital furniture, we deliver fully installed and commissioned systems with staff training.',
      'Our B2B team provides bulk pricing, credit terms and tender support for hospital departments and ICU fit-outs. Contact us for a complete hospital equipment quotation.',
    ],
    landingSlugs: [
      'patient-monitor-price-bangladesh',
      'ventilator-price-bangladesh',
      'infusion-pump-price-bangladesh',
      'x-ray-machine-price-bangladesh',
    ],
    guideSlugs: ['hospital-equipment-guide-bangladesh', 'b2b-medical-procurement-bangladesh'],
    brandSlugs: ['mindray', 'comen', 'aeonmed', 'b-braun'],
    categorySlug: 'hospital-machines',
  },
  {
    slug: 'diabetes-care',
    icon: '🩸',
    title: 'Diabetes Care Products in Bangladesh',
    metaTitle: 'Diabetes Care Products in Bangladesh — Prices & Buying Guide | MediportBD',
    metaDescription:
      'Diabetes care products in Bangladesh — glucose meters, test strips, lancets and accessories from Accu-Chek, Omnitest and Yuwell with prices and DGDA certification from MediportBD.',
    keywords: [
      'diabetes care Bangladesh',
      'glucometer price BD',
      'glucose test strips Bangladesh',
      'diabetes products Dhaka',
      'diabetes care products Bangladesh',
    ],
    intro: [
      'MediportBD supplies everything needed for diabetes management in Bangladesh — blood glucose meters, test strips, lancets and lancing devices from Accu-Chek, Omnitest, Yuwell and PCL Care. All products are DGDA registered with proper storage to ensure accuracy.',
      'Stock your pharmacy, clinic or diabetes care centre with our bulk supply options, or buy for home use with free delivery in Dhaka and fast courier service nationwide.',
    ],
    landingSlugs: ['glucose-meter-price-bangladesh'],
    guideSlugs: ['hba1c-reagent-comparison-bangladesh'],
    brandSlugs: ['accu-chek', 'yuwell', 'pcl'],
    categorySlug: 'diabetes-care',
  },
];

export function getClusterBySlug(slug) {
  return TOPICAL_CLUSTERS.find(c => c.slug === slug) || null;
}

export function getClusterLandingPages(cluster) {
  return (cluster.landingSlugs || []).map(getLandingPageBySlug).filter(Boolean);
}

/**
 * Given an equipment landing page slug, return the topic cluster(s) it belongs to.
 * Used by equipment pages to link back up to their parent topic hub.
 */
export function getClustersForLandingPage(landingSlug) {
  return TOPICAL_CLUSTERS.filter(c => (c.landingSlugs || []).includes(landingSlug));
}