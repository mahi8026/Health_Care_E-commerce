/**
 * SEO Configuration for MediportBD
 *
 * Central configuration for site metadata, organization schema,
 * and per-page metadata used across all pages.
 *
 * Exports both the new SITE_CONFIG / PAGE_SEO / CATEGORY_SEO format
 * AND the legacy siteConfig / pageMetadata aliases so existing utilities
 * (metadata.js, structuredData.js) continue to work without changes.
 */

// ---------------------------------------------------------------------------
// Site-wide configuration
// ---------------------------------------------------------------------------

// Canonical origin MUST match the serving host (www.mediportbd.com — the
// apex 308-redirects here). A mismatch makes every page declare a canonical
// that redirects elsewhere, which stalls Google indexing site-wide.
// Guard against an empty-string env var (as seen in the Vercel dashboard).
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '') || 'https://www.mediportbd.com';

export const SITE_CONFIG = {
  name:         'MediportBD',
  fullName:     'MediportBD — Medical Equipment Supplier',
  url:          SITE_URL,
  description:  "Bangladesh's most trusted medical equipment supplier. Premium diagnostic devices, surgical instruments, laboratory reagents and hospital machines. DGDA registered. B2B & retail. Dhaka.",
  keywords:     'medical equipment Bangladesh, diagnostic equipment Dhaka, surgical instruments BD, laboratory reagents Bangladesh, hospital equipment supplier, DGDA registered medical devices, ECG machine price Bangladesh, reagent supplier Dhaka, B2B medical supplier Bangladesh',
  ogImage:      '/og-default.png',
  twitterHandle: '@mediportbd',
  locale:       'en_BD',
  phone:        '+880 1646-886795',
  email:        'mediportbdofficial@gmail.com',
  address: {
    street:     '17/2/A Azad Tower, Shop-08 (Beside BMA Bhaban), Topkhana Road',
    city:       'Dhaka',
    country:    'Bangladesh',
    postalCode: '1000',
  },
};

// ---------------------------------------------------------------------------
// Backward-compatible aliases used by metadata.js & structuredData.js
// ---------------------------------------------------------------------------

export const siteConfig = {
  name:        SITE_CONFIG.name,
  description: SITE_CONFIG.description,
  url:         SITE_CONFIG.url,
  ogImage:     SITE_CONFIG.ogImage,
  locale:      SITE_CONFIG.locale,
  twitter: {
    card: 'summary_large_image',
    site: SITE_CONFIG.twitterHandle,
  },
};

export const organization = {
  name:  SITE_CONFIG.name,
  url:   SITE_CONFIG.url,
  logo:  `${SITE_CONFIG.url}/Mediport_Logo.png`,
  contactPoint: {
    telephone:         SITE_CONFIG.phone,
    contactType:       'customer service',
    areaServed:        'BD',
    availableLanguage: ['en', 'bn'],
  },
  sameAs: [
    'https://www.facebook.com/profile.php?id=61590311825607',
  ],
};

// ---------------------------------------------------------------------------
// Per-page metadata — new PAGE_SEO format
// ---------------------------------------------------------------------------

export const PAGE_SEO = {
  home: {
    title:       'MediportBD — Medical Equipment Supplier Bangladesh | DGDA Certified',
    description: 'Buy medical equipment online in Bangladesh. 350+ products: ECG machines, diagnostic kits, surgical instruments, lab reagents. B2B discounts up to 30%. Free delivery Dhaka. DGDA registered.',
    keywords:    'medical equipment Bangladesh, buy medical equipment online BD, ECG machine Bangladesh, diagnostic equipment price Bangladesh',
  },
  products: {
    title:       'Medical Equipment & Supplies — MediportBD Bangladesh',
    description: 'Browse 350+ medical products: diagnostic machines, surgical instruments, laboratory reagents, hospital equipment. Genuine brands. DGDA certified. B2B pricing available.',
    keywords:    'medical supplies Bangladesh, buy surgical instruments online, lab equipment price BD',
  },
  reagentStore: {
    title:       'Laboratory Reagents Bangladesh — HbA1c, CBC, Biochemistry Kits | MediportBD',
    description: 'Buy laboratory reagents in Bangladesh. HbA1c, CBC, troponin, lipid profile kits from Roche, Siemens, Abbott. Cold chain delivery. DGDA approved. Bulk B2B pricing.',
    keywords:    'laboratory reagents Bangladesh, HbA1c kit price BD, CBC reagent supplier Dhaka, biochemistry reagent Bangladesh',
  },
  b2b: {
    title:       'MediportBD B2B Portal — Bulk Medical Supply BD',
    description: 'MediportBD B2B portal: bulk medical equipment and supplies for hospitals, clinics and diagnostic centers in Bangladesh. Credit terms 30–90 days. 8–30% bulk discounts. Dedicated account manager. Request a free quote.',
    keywords:    'B2B medical supplier Bangladesh, MediportBD B2B, hospital equipment supplier Dhaka, bulk medical supplies BD, free quote Bangladesh',
  },
  search: {
    title:       'Search Medical Equipment — MediportBD Bangladesh',
    description: 'Find medical equipment, surgical instruments and laboratory reagents in Bangladesh.',
  },
};

// ---------------------------------------------------------------------------
// Backward-compatible pageMetadata (used by older page files)
// ---------------------------------------------------------------------------

export const pageMetadata = {
  home:         { ...PAGE_SEO.home,        path: '/' },
  search:       { ...PAGE_SEO.search,      path: '/search',        noindex: true },
  reagentStore: { ...PAGE_SEO.reagentStore, path: '/reagent-store' },
  b2b:          { ...PAGE_SEO.b2b,         path: '/b2b' },
  cart: {
    title:       'Shopping Cart | MediportBD',
    description: 'Review your selected medical equipment and supplies before checkout.',
    path:        '/cart',
    noindex:     true,
  },
  checkout: {
    title:       'Checkout | MediportBD',
    description: 'Complete your purchase of medical equipment and supplies.',
    path:        '/checkout',
    noindex:     true,
  },
  login: {
    title:       'Login | MediportBD',
    description: 'Sign in to your MediportBD account to access your orders and manage your profile.',
    path:        '/login',
    noindex:     true,
  },
  register: {
    title:       'Register | MediportBD',
    description: 'Create a MediportBD account to start ordering medical equipment and supplies.',
    path:        '/register',
    noindex:     true,
  },
  mobileApp: {
    title:       'Mobile App | MediportBD',
    description: 'Download the MediportBD mobile app for convenient access to medical equipment and supplies on the go.',
    path:        '/mobile-app',
  },
  admin: {
    title:       'Admin Dashboard | MediportBD',
    description: 'MediportBD administrative dashboard.',
    path:        '/admin',
    noindex:     true,
    nofollow:    true,
  },
  product: {
    title:       'Product | MediportBD',
    description: 'View detailed information, pricing, and availability for medical equipment and supplies on MediportBD.',
    path:        '/products/[id]',
  },
};

// ---------------------------------------------------------------------------
// Category-specific SEO
// ---------------------------------------------------------------------------

export const CATEGORY_SEO = {
  'Diagnostic Equipment': {
    title:       'Diagnostic Equipment Bangladesh — Blood Pressure Monitors, Scales, Stethoscopes | MediportBD',
    description: 'Buy diagnostic equipment in Bangladesh. Blood pressure monitors, weighing scales, thermometers, pulse oximeters, stethoscopes, fetal dopplers from Rossmax, Omron, Microlife, Beurer. DGDA certified.',
    h1:          'Diagnostic Equipment in Bangladesh',
  },
  'Surgical Instruments': {
    title:       'Surgical Instruments Bangladesh — Scissors, Forceps, Trocar Sets | MediportBD',
    description: 'Quality surgical instruments in Bangladesh. Scissors, forceps, trocar sets, scalpels, needle holders. CE certified. Bulk B2B pricing for hospitals.',
    h1:          'Surgical Instruments in Bangladesh',
  },
  'Laboratory Reagents': {
    title:       'Laboratory Reagents Bangladesh — TSH, Dengue, Thyroid Rapid Test Kits | MediportBD',
    description: 'Laboratory reagents and rapid test kits in Bangladesh. TSH, T3, T4, FT3, Vitamin B12, Dengue NS1, RF/RA latex tests from Finecare, Biopanda. Cold chain delivery.',
    h1:          'Laboratory Reagents in Bangladesh',
  },
  'Laboratory Equipment': {
    title:       'Laboratory Equipment Bangladesh — Hematology Analyzers, ESR Machines | MediportBD',
    description: 'Laboratory equipment in Bangladesh. Hematology analyzers, ESR machines, calibration systems from STEL, Bio-Max, THERMA, Rossmax. B2B bulk pricing for labs.',
    h1:          'Laboratory Equipment in Bangladesh',
  },
  'Hospital Machines': {
    title:       'Hospital Machines Bangladesh — Nebulizers, Suction Units, CPAP | MediportBD',
    description: 'Hospital equipment in Bangladesh. Nebulizers, suction units, CPAP/BiPAP machines from Rossmax, Beurer, Yuwell, Omron, Microlife. CE certified. B2B pricing.',
    h1:          'Hospital Machines & Equipment in Bangladesh',
  },
  'PPE & Safety': {
    title:       'PPE Bangladesh — Surgical Gloves, N95 Masks, Gowns | MediportBD',
    description: 'Personal protective equipment in Bangladesh. Surgical gloves, N95 respirators, surgical masks, protective gowns. Bulk orders welcome. DGDA registered.',
    h1:          'PPE & Safety Equipment in Bangladesh',
  },
  'Orthopedic Supports': {
    title:       'Orthopedic Supports Bangladesh — Braces, Belts, Splints, Collars | MediportBD',
    description: 'Buy orthopedic supports in Bangladesh. Knee braces, lumbar belts, cervical collars, splints, wrist supports, crutches from Tynor. Free delivery Dhaka.',
    h1:          'Orthopedic Supports in Bangladesh',
  },
  'Surgical & Wound Care': {
    title:       'Surgical & Wound Care Bangladesh — Ostomy Bags, Dressings, Tape | MediportBD',
    description: 'Surgical and wound care supplies in Bangladesh. Ostomy bags, colostomy sets, wound dressings, surgical tapes, drain kits from ConvaTec, B-Braun, JMS.',
    h1:          'Surgical & Wound Care Supplies in Bangladesh',
  },
  'Consumables': {
    title:       'Medical Consumables Bangladesh — Needles, Catheters, Syringes | MediportBD',
    description: 'Medical consumables in Bangladesh. Spinal needles, catheters, urinary bags, stop cocks, HME filters, adult diapers from Romsons, B-Braun. Bulk B2B pricing.',
    h1:          'Medical Consumables in Bangladesh',
  },
  'Diabetes Care': {
    title:       'Diabetes Care Bangladesh — Glucose Meters, Test Strips | MediportBD',
    description: 'Diabetes care products in Bangladesh. Blood glucose meters, test strips from Accu-Chek, Omnitest, Yuwell, PCL Care, eBcare. DGDA registered.',
    h1:          'Diabetes Care Products in Bangladesh',
  },
  'Ophthalmology & ENT Equipment': {
    title:       'Ophthalmology & ENT Equipment Bangladesh — Ophthalmoscopes, Otoscopes | MediportBD',
    description: 'Ophthalmology and ENT equipment in Bangladesh. Ophthalmoscopes, retinoscopes, otoscopes, hearing amplifiers from Heine, Beurer. Genuine products, fast delivery.',
    h1:          'Ophthalmology & ENT Equipment in Bangladesh',
  },
  'IV & Infusion Therapy': {
    title:       'IV & Infusion Therapy Bangladesh — IV Cannulas, Infusion Sets | MediportBD',
    description: 'IV and infusion therapy supplies in Bangladesh. IV cannulas, infusion sets, scalp vein sets, central venous catheters, burette sets from Vasofix, JMS, Romsons.',
    h1:          'IV & Infusion Therapy Supplies in Bangladesh',
  },
  'Physiotherapy & Rehabilitation': {
    title:       'Physiotherapy Equipment Bangladesh — TENS, Heating Pads, Infrared | MediportBD',
    description: 'Physiotherapy and rehabilitation equipment in Bangladesh. TENS therapy devices, heating pads, infrared lamps from Jumper, Rossmax, Beurer.',
    h1:          'Physiotherapy & Rehabilitation Equipment in Bangladesh',
  },
  'Medical Supplies': {
    title:       'Medical Supplies Bangladesh — Anti-Decubitus Mattresses, Tapes | MediportBD',
    description: 'Medical supplies in Bangladesh. Anti-decubitus mattresses, medical tapes from Rossmax, PCL Care, JMS. Quality healthcare supplies at competitive prices.',
    h1:          'Medical Supplies in Bangladesh',
  },
  'Blood Bank Supplies': {
    title:       'Blood Bank Supplies Bangladesh — Blood Bags, Transfusion Sets | MediportBD',
    description: 'Blood bank supplies in Bangladesh. Blood collection bags, transfusion sets, triple blood bags, CPDA blood bags from JMS. DGDA registered. Hospital B2B pricing.',
    h1:          'Blood Bank Supplies in Bangladesh',
  },
  'Respiratory Equipment': {
    title:       'Respiratory Equipment Bangladesh — Respirometers, CPAP Supplies | MediportBD',
    description: 'Respiratory equipment and supplies in Bangladesh. Respirometers, 3-in-1 respiratory solutions from Rossmax, Romsons. CE certified.',
    h1:          'Respiratory Equipment in Bangladesh',
  },
  'Compression Garments': {
    title:       'Compression Garments Bangladesh — DVT Stockings | MediportBD',
    description: 'Compression garments in Bangladesh. DVT stockings and anti-embolism stockings from Tynor. Post-surgical and hospital use. B2B bulk pricing.',
    h1:          'Compression Garments in Bangladesh',
  },
  'Diagnostic Devices': {
    title:       'Diagnostic Devices Bangladesh — Blood Glucose Meters | MediportBD',
    description: 'Diagnostic devices in Bangladesh. Blood glucose meters, monitoring devices from Accu-Chek and other leading brands. DGDA registered.',
    h1:          'Diagnostic Devices in Bangladesh',
  },
  'Medical Devices': {
    title:       'Medical Devices Bangladesh — Monitors, Analyzers | MediportBD',
    description: 'Medical devices in Bangladesh. Body composition analyzers, monitoring equipment from leading global brands. CE certified, DGDA registered.',
    h1:          'Medical Devices in Bangladesh',
  },
  'Mobility Aids': {
    title:       'Mobility Aids Bangladesh — Wheelchairs, Walkers, Crutches | MediportBD',
    description: 'Mobility aids in Bangladesh. Wheelchairs, walkers, crutches and mobility equipment. Quality brands, competitive prices.',
    h1:          'Mobility Aids in Bangladesh',
  },
};

// ---------------------------------------------------------------------------
// Category long-form content blocks (rendered below product grids for SEO)
// ---------------------------------------------------------------------------

export const CATEGORY_CONTENT = {
  'Diagnostic Equipment': `MediportBD is Bangladesh's leading supplier of diagnostic equipment for hospitals, clinics and diagnostic centers. Our catalog includes 12-lead ECG machines, digital ultrasound systems, patient monitors, pulse oximeters, blood pressure monitors and spirometers from world-leading brands including Siemens Healthineers, GE Healthcare, Philips, Mindray and Nihon Kohden.

All diagnostic equipment is DGDA registered and CE certified. We offer free installation and staff training in Dhaka metro area. B2B clients receive 8–22% bulk discount and 30–90 day credit terms.

Popular diagnostic equipment: Siemens Cardiostat ECG Machine price Bangladesh, Mindray Patient Monitor price Bangladesh, GE Ultrasound price in Bangladesh.`,

  'Laboratory Reagents': `Buy laboratory reagents in Bangladesh from MediportBD. We supply HbA1c reagents, CBC reagents, clinical chemistry kits, immunoassay reagents, coagulation reagents and urinalysis strips from Roche Diagnostics, Abbott Laboratories, Beckman Coulter and bioMérieux.

All reagents are stored and transported with proper cold chain management (2–8°C or −20°C as required). DGDA approved. Compatible with Cobas, ARCHITECT, UniCel analyzers. Bulk pricing and regular supply contracts available for hospitals and reference labs.`,

  'Surgical Instruments': `MediportBD supplies premium surgical instruments to hospitals, clinics and operating theatres across Bangladesh. Our range includes scissors, forceps, needle holders, trocar sets, scalpels, retractors and specialised surgical sets from CE-certified manufacturers.

All instruments are sterilisation-compatible and available in stainless steel. B2B bulk pricing available for hospitals and surgical centres. DGDA registered. Free delivery in Dhaka.`,

  'Hospital Machines': `MediportBD is a trusted supplier of hospital equipment and ICU machines in Bangladesh. Our range includes mechanical and electronic ventilators, haemodialysis machines, infusion pumps, syringe drivers, defibrillators and patient monitoring systems.

All hospital machines are CE certified and DGDA registered. Professional installation and commissioning service available. 24/7 technical support for B2B clients. Financing options available for large orders.`,

  'Laboratory Equipment': `Source laboratory equipment in Bangladesh from MediportBD. We supply centrifuges, microcentrifuges, microscopes, autoclaves, incubators, water baths, spectrophotometers and analytical balances from Eppendorf, Beckman Coulter and Grant Instruments.

Equipment calibration, installation and service contracts available. DGDA registered. University, research institute and hospital pricing available.`,

  'PPE & Safety': `MediportBD supplies personal protective equipment (PPE) and infection control supplies to healthcare facilities across Bangladesh. Our range includes surgical gloves, examination gloves, N95 respirators, surgical masks, face shields, protective gowns and shoe covers from Ansell, 3M and Cardinal Health.

Bulk orders welcome. DGDA registered. Fast delivery within Dhaka. B2B contracts for regular supply.`,

  'Orthopedic Supports': `MediportBD is Bangladesh's trusted supplier of orthopedic supports and rehabilitation aids. Our catalog includes knee braces, lumbar belts, cervical collars, wrist and ankle supports, shoulder immobilizers, posture correctors, abdominal belts, splints, crutches and walking sticks from Tynor and other quality manufacturers.

Whether you are recovering from surgery, managing a sports injury or living with chronic joint pain, our orthopedic supports provide the compression, stabilisation and pain relief you need. DGDA registered products with genuine warranty.

Orthopedic support price in Bangladesh: Tynor knee brace, lumbar support belt and cervical collar prices available online with free delivery in Dhaka and nationwide courier service.`,

  'Surgical & Wound Care': `Buy surgical and wound care supplies in Bangladesh from MediportBD. We supply ostomy bags, colostomy sets, urostomy pouches, wound dressings, gauze rolls, adhesive tapes, drain bags, skin closure strips and pressure sore care products from ConvaTec, B-Braun and JMS.

Our wound care range is ideal for home care patients, post-operative recovery and hospital nursing stations. All products are sterile-packed, DGDA registered and supplied at competitive bulk prices for clinics and hospitals.

Ostomy bag price in Bangladesh and colostomy care supplies — browse our full range and order online with doorstep delivery across the country.`,

  'Consumables': `MediportBD supplies medical consumables to hospitals, clinics, diagnostics centers and home care patients across Bangladesh. Our range includes syringes, needles, IV cannulas, catheters, urinary drainage bags, stop cocks, three-way valves, HME filters, endotracheal tubes, suction catheters and adult diapers from Romsons, B-Braun and JMS.

Every consumable is sterilised, CE certified and DGDA registered. Hospitals and clinics enjoy bulk B2B pricing with monthly supply contracts and scheduled delivery.

Spinal needle price Bangladesh, urine bag, catheter and syringe prices — order medical consumables online with same-day dispatch in Dhaka.`,

  'Diabetes Care': `Manage diabetes with genuine monitoring products from MediportBD. We supply blood glucose meters, test strips, lancets, lancing devices and control solutions from Accu-Chek, Omnitest, Yuwell, PCL Care and eBcare — all DGDA registered.

Choose from the Accu-Chek Active and Instant meters for accurate, easy testing at home, or stock your pharmacy and diabetes care centre with our bulk supply options. Test strips are stored properly to protect accuracy.

Glucometer price in Bangladesh and blood glucose test strip prices — compare models and buy online with free delivery in Dhaka.`,

  'Ophthalmology & ENT Equipment': `MediportBD supplies ophthalmology and ENT diagnostic equipment to eye hospitals, ENT clinics and medical colleges in Bangladesh. Our range includes ophthalmoscopes, retinoscopes, slit lamps, otoscopes, nasal specula, tuning forks, laryngeal mirrors, headlights and hearing amplifiers from Heine, Beurer and other leading brands.

All devices are precision-made with LED or halogen illumination for accurate examination. Genuine products with manufacturer warranty and after-sales service.

Ophthalmoscope price Bangladesh and otoscope price in Bangladesh — order diagnostic instruments online with nationwide delivery.`,

  'IV & Infusion Therapy': `IV and infusion therapy supplies from MediportBD keep hospitals and clinics stocked with essential fluid delivery products. We supply IV cannulas, infusion sets, scalp vein sets, burette sets, central venous catheters, extension lines, three-way stop cocks and IV stands from Vasofix (B-Braun), JMS and Romsons.

Products are sterile, pyrogen-free and DGDA registered. Bulk pricing and regular replenishment contracts available for hospital pharmacies.

IV cannula price Bangladesh and infusion set prices — buy online with fast delivery across Bangladesh.`,

  'Physiotherapy & Rehabilitation': `MediportBD provides physiotherapy and rehabilitation equipment for clinics, sports facilities and home therapy. Our range includes TENS therapy devices, EMS muscle stimulators, ultrasound therapy units, infrared lamps, heating pads, hot and cold therapy packs, exercise bands and rehabilitation aids from Jumper, Rossmax and Beurer.

Whether you treat chronic pain, muscle recovery or post-stroke rehabilitation, our equipment supports effective patient care at a fraction of import cost.

TENS machine price in Bangladesh and physiotherapy equipment prices — browse our catalog and order with free delivery in Dhaka.`,

  'Medical Supplies': `General medical supplies from MediportBD cover everyday needs of hospitals, clinics, diagnostic centers and home care. We supply anti-decubitus mattresses, medical tapes, bandages, antiseptic swabs, cotton rolls, safety razors, thermometer covers and patient care essentials from Rossmax, PCL Care and JMS.

Quality healthcare supplies at competitive prices — bulk orders and institutional supply contracts welcome. DGDA registered.

Anti-decubitus mattress price in Bangladesh and medical tape prices — order online with reliable nationwide delivery.`,

  'Blood Bank Supplies': `MediportBD supplies blood bank equipment and consumables to hospitals and blood transfusion centers in Bangladesh. Our range includes blood collection bags, CPDA-1 triple and quadruple blood bags, transfusion sets, blood grouping reagents, tube sealers and related supplies from JMS.

All blood bank supplies meet international safety standards and are DGDA registered. We offer B2B pricing and scheduled supply contracts for blood banks and clinical laboratories.

Blood bag price in Bangladesh and transfusion set prices — contact our B2B team for bulk quotations.`,

  'Respiratory Equipment': `Respiratory care equipment and supplies from MediportBD support hospitals, clinics and home patients across Bangladesh. We supply respirometers, spirometers, CPAP and BiPAP machines, oxygen concentrators, nebulizers, peak flow meters and 3-in-1 respiratory sets from Rossmax, Romsons and Yuwell.

Our respiratory devices are CE certified and DGDA registered, with installation support and after-sales service. B2B clients receive bulk pricing for hospital departments.

Nebulizer price in Bangladesh and CPAP machine price — compare respiratory equipment and buy online with nationwide delivery.`,

  'Compression Garments': `MediportBD supplies medical compression garments for post-surgical recovery, venous disease management and travel protection. Our range includes DVT stockings, anti-embolism stockings, compression socks and post-surgical compression wear from Tynor.

Gradient compression improves blood circulation and reduces the risk of deep vein thrombosis during prolonged bed rest, surgery or long-haul travel. Available in multiple sizes and compression classes.

DVT stocking price in Bangladesh — order compression garments online with fast delivery across the country.`,

  'Diagnostic Devices': `MediportBD offers a complete range of point-of-care diagnostic devices in Bangladesh. Our catalog includes blood glucose meters, cholesterol meters, uric acid meters, body composition analyzers, fetal dopplers and pulse oximeters from Accu-Chek, Rossmax, Beurer and Jumper.

These devices give doctors, clinics and home users fast, accurate results with minimal training. All devices are DGDA registered with genuine warranty and replacement support.

Pulse oximeter price in Bangladesh and fetal doppler price — buy diagnostic devices online with free delivery in Dhaka.`,

  'Medical Devices': `MediportBD supplies advanced medical devices to hospitals and specialty clinics in Bangladesh. Our range includes body composition analyzers, patient monitors, ECG machines and laboratory analyzers from leading global manufacturers — all CE certified and DGDA registered.

We support institutional buyers with professional installation, staff training, service contracts and B2B pricing on multi-unit orders. Contact our team for quotations on hospital-grade medical devices.`,

  'Mobility Aids': `MediportBD supplies mobility aids to improve independence for patients and elderly users across Bangladesh. Our range includes manual and transport wheelchairs, walkers, rollators, crutches, walking sticks, commode chairs and transfer aids.

Each mobility aid is built for durability and patient comfort, with weight capacity and size options for every user. DGDA registered products with warranty and nationwide delivery.

Wheelchair price in Bangladesh and walker price — browse mobility aids online with free delivery in Dhaka and fast courier service nationwide.`,
};
