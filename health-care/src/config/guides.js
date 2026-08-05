/**
 * MediportBD — Guide & Comparison Content Registry
 *
 * Central content source for /guides and /compare pages.
 * Content is written "answer-first" (GEO-optimised): the opening paragraph
 * of every article and every section directly answers the likely question
 * so AI engines (ChatGPT, Perplexity, Google AI Overviews) can extract and
 * cite MediportBD directly.
 *
 * NOTE: Prices are indicative market ranges in Bangladesh Taka (BDT) and
 * change frequently. Always phrase ranges with hedges; the quick-answer box
 * and meta descriptions must remain accurate. Update `updatedAt` when any
 * figure is refreshed — freshness is a ranking signal.
 */

export const GUIDE_AUTHOR = {
  name: 'Mahim Rahman',
  title: 'Founder & Managing Director, MediportBD',
  description:
    '10+ years sourcing and distributing DGDA-registered medical equipment across Bangladesh — diagnostic devices, surgical instruments and laboratory reagents for hospitals, clinics and diagnostic centres.',
};

export const GUIDES = [
  {
    slug: 'medical-equipment-bangladesh-guide',
    type: 'pillar',
    title: 'Medical Equipment in Bangladesh: The Complete 2026 Buying Guide',
    metaTitle: 'Medical Equipment in Bangladesh — Complete 2026 Buying Guide | MediportBD',
    metaDescription:
      'Complete 2026 guide to buying medical equipment in Bangladesh: DGDA rules, price ranges, top brands, cold-chain reagents, B2B procurement and where to buy genuine devices.',
    keywords: [
      'medical equipment Bangladesh',
      'buy medical equipment BD',
      'medical equipment supplier Dhaka',
      'DGDA registered medical equipment',
      'hospital equipment Bangladesh',
    ],
    excerpt:
      'Medical equipment in Bangladesh ranges from ৳500 consumables to ৳25,00,000+ hospital machines. Every regulated device must be DGDA registered. This guide covers what to buy, what it costs, and how to procure safely.',
    quickAnswer:
      'Medical equipment in Bangladesh must be registered with the DGDA (Directorate General of Drug Administration) before it can be legally sold. Prices range from ৳500 for basic consumables to ৳25,00,000+ for advanced hospital machines like ultrasound systems and ventilators. MediportBD is a DGDA-registered supplier in Dhaka offering diagnostic equipment, surgical instruments, laboratory reagents and hospital machines with B2B bulk pricing, cold-chain delivery and free installation on equipment within Dhaka.',
    updatedAt: '2026-08-05',
    readMinutes: 9,
    relatedCategories: [
      { name: 'Diagnostic Equipment', href: '/products/category/diagnostic-equipment' },
      { name: 'Surgical Instruments', href: '/products/category/surgical-instruments' },
      { name: 'Laboratory Reagents', href: '/reagent-store' },
      { name: 'Hospital Machines', href: '/products/category/hospital-machines' },
    ],
    relatedGuides: [
      'diagnostic-equipment-guide-bangladesh',
      'laboratory-reagents-guide-bangladesh',
      'dgda-registration-explained',
      'ecg-machine-price-bangladesh-2026',
      'b2b-medical-procurement-bangladesh',
      'cold-chain-reagent-delivery-bangladesh',
    ],
    sections: [
      {
        heading: 'How medical device regulation works in Bangladesh',
        paragraphs: [
          'The Directorate General of Drug Administration (DGDA), under the Ministry of Health and Family Welfare, regulates medical devices in Bangladesh. Importers and distributors must hold valid DGDA registration for regulated products — buying from an unregistered supplier can mean seizure of stock, fines, and risk to patient safety.',
          'When buying medical equipment in Bangladesh, always ask the seller for: (1) the DGDA registration certificate of the product, (2) manufacturer authorisation letters for the brands they distribute, and (3) batch traceability documents for reagents and consumables. A supplier who cannot produce these documents cannot legally sell you the device.',
        ],
        bullets: [
          'DGDA registration is mandatory for medical devices sold in Bangladesh',
          'Reagents and IVDs are regulated under DGDA import guidelines with cold-chain requirements',
          'CE marking is the common safety certification for devices imported into Bangladesh',
          'Post-market surveillance and adverse event reporting are the importer\u2019s responsibility',
        ],
      },
      {
        heading: 'Medical equipment price ranges in Bangladesh (2026)',
        paragraphs: [
          'Prices below are indicative ranges seen in the Bangladesh market in 2026. Actual prices vary by brand, specification and supplier margins — always request a written quotation before committing.',
        ],
        table: {
          caption: 'Indicative price ranges for medical equipment in Bangladesh',
          headers: ['Category', 'Examples', 'Typical Price Range (BDT)'],
          rows: [
            ['Diagnostic devices', 'BP monitors, thermometers, pulse oximeters', '৳800 – ৳25,000'],
            ['ECG machines', '12-lead, 3/6 channel, portable', '৳45,000 – ৳250,000'],
            ['Patient monitors', 'Vital signs, multiparameter', '৳85,000 – ৳600,000'],
            ['Laboratory analysers', 'Hematology, biochemistry, ESR', '৳1,50,000 – ৳40,00,000'],
            ['Laboratory reagents', 'HbA1c, CBC, chemistry kits (per kit)', '৳3,000 – ৳150,000'],
            ['Surgical instrument sets', 'Basic minor OT set to full laparotomy', '৳8,000 – ৳250,000'],
            ['Nebulizers / respiratory', 'Compressor and ultrasonic units', '৳2,500 – ৳25,000'],
            ['Infusion & IV therapy', 'Cannulas, infusion sets, burettes', '৳60 – ৳600 per unit'],
            ['Diabetes care', 'Glucose meters and test strips', 'Meters ৳800 – ৳5,000; strips ৳700 – ৳2,000'],
            ['Mobility aids', 'Wheelchairs, walkers, crutches', '৳8,000 – ৳60,000'],
          ],
        },
      },
      {
        heading: 'What to look for before you buy medical equipment in Bangladesh',
        paragraphs: [
          'Check the product is DGDA registered and CE certified. Verify the supplier holds a physical office in Bangladesh, keeps spare parts, and can service the device locally — imported-only "grey market" equipment leaves hospitals stranded when support is needed.',
          'For reagents, confirm cold-chain integrity: the batch must have been transported and stored at the manufacturer-specified temperature (usually 2–8°C). For electrical equipment, confirm voltage compatibility (220V/50Hz in Bangladesh), warranty terms (typically 1–3 years) and free installation where applicable.',
        ],
        bullets: [
          'DGDA registration certificate for every regulated product',
          'Local service, spare parts and technical support in Bangladesh',
          'Cold-chain handling for reagents and temperature-sensitive IVDs',
          'Written warranty and installation terms before payment',
          'B2B buyers: demand bulk pricing, credit terms and a supply agreement',
        ],
      },
      {
        heading: 'Where to buy medical equipment in Bangladesh',
        paragraphs: [
          'Hospitals, clinics and diagnostic centres in Bangladesh buy from DGDA-registered distributors in Dhaka (Topkhana Road, Nawabpur and Segunbagicha areas host most suppliers). Online suppliers such as MediportBD (Topkhana Road, Dhaka) offer transparent pricing, nationwide delivery and B2B bulk discounts of 8–30% with 30–90 day credit terms for institutional buyers.',
          'For your first order, request a quotation, ask for a product demonstration, verify the DGDA registration number, and start with a small trial order to validate quality and delivery before committing to a bulk contract.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is DGDA registration required to buy medical equipment in Bangladesh?',
        a: 'Yes. Medical devices sold in Bangladesh must be registered with the DGDA. Buyers should verify the registration certificate before purchasing, and suppliers such as MediportBD provide DGDA-registered products with certificates on request.',
      },
      {
        q: 'How much does medical equipment cost in Bangladesh?',
        a: 'Medical equipment in Bangladesh ranges from ৳500 for consumables and ৳800 for basic diagnostic devices like thermometers and pulse oximeters, to ৳45,000–৳250,000 for ECG machines and over ৳25,00,000 for advanced systems such as ultrasound and full laboratory analysers. Exact pricing depends on brand, specification and import duties.',
      },
      {
        q: 'What is the fastest way to get medical equipment delivered in Dhaka?',
        a: 'Order before 12 PM from MediportBD for same-day delivery within Dhaka metro. Nationwide delivery to Chittagong, Sylhet and other divisions takes 2–4 business days. Installation and staff training are included free for diagnostic equipment in the Dhaka metro area.',
      },
      {
        q: 'Can hospitals and clinics get bulk discounts on medical equipment?',
        a: 'Yes. MediportBD offers B2B institutional pricing with bulk discounts of 8–30%, credit terms of 30–90 days, a dedicated account manager and priority processing for hospitals, clinics, diagnostic centres and pharmacies.',
      },
      {
        q: 'How do I know if a medical equipment supplier in Bangladesh is genuine?',
        a: 'Check the supplier has a physical address in Bangladesh, valid DGDA-registered products, manufacturer authorisation letters, and verifiable customer reviews. A genuine supplier provides written quotations, installation and after-sales service — beware of "grey market" imports sold without local support.',
      },
    ],
  },
  {
    slug: 'diagnostic-equipment-guide-bangladesh',
    type: 'guide',
    title: 'Diagnostic Equipment in Bangladesh: What Clinics Actually Need',
    metaTitle: 'Diagnostic Equipment Guide Bangladesh — BP Monitors, ECG, Oximeters | MediportBD',
    metaDescription:
      'Practical guide to diagnostic equipment in Bangladesh: what every clinic needs, price ranges, brands available (Rossmax, Omron, Microlife, Beurer), DGDA rules and where to buy in Dhaka.',
    keywords: [
      'diagnostic equipment Bangladesh',
      'diagnostic equipment Dhaka',
      'BP monitor price Bangladesh',
      'pulse oximeter price BD',
      'ECG machine Bangladesh',
    ],
    excerpt:
      'The essential diagnostic equipment for a Bangladesh clinic costs roughly ৳15,000–৳60,000: BP monitor, thermometer, stethoscope, pulse oximeter, weighing scale and glucometer. Larger setups add ECG, ultrasound and patient monitors.',
    quickAnswer:
      'A basic clinic in Bangladesh needs diagnostic equipment worth roughly ৳15,000–৳60,000: a digital BP monitor (৳1,500–৳12,000), digital thermometer (৳300–৳2,000), stethoscope (৳500–৳5,000), pulse oximeter (৳800–৳3,500), weighing scale (৳2,000–৳12,000) and glucometer with strips (৳800–৳4,000). For ECG and ultrasound, prices rise to ৳45,000–৳250,000 and ৳8,00,000+ respectively. MediportBD supplies DGDA-registered diagnostic equipment in Dhaka with free installation on equipment and B2B pricing for clinics.',
    updatedAt: '2026-08-05',
    readMinutes: 6,
    relatedCategories: [
      { name: 'Diagnostic Equipment', href: '/products/category/diagnostic-equipment' },
      { name: 'Diagnostic Devices', href: '/products/category/diagnostic-devices' },
      { name: 'Diabetes Care', href: '/products/category/diabetes-care' },
    ],
    relatedGuides: [
      'medical-equipment-bangladesh-guide',
      'bp-monitor-buying-guide-bangladesh',
      'ecg-machine-price-bangladesh-2026',
      'siemens-vs-ge-ecg-machines',
    ],
    sections: [
      {
        heading: 'The essential diagnostic equipment list for a Bangladesh clinic',
        paragraphs: [
          'Most Bangladesh clinics, GP chambers and diagnostic corners run on a small core of diagnostic devices. Brands commonly stocked by Dhaka distributors include Rossmax, Omron, Microlife, Beurer and Yuwell for patient-side devices.',
        ],
        table: {
          caption: 'Essential diagnostic devices for a Bangladesh clinic',
          headers: ['Device', 'Use', 'Typical Price Range (BDT)', 'Popular Brands in BD'],
          rows: [
            ['Digital BP monitor', 'Blood pressure measurement', '৳1,500 – ৳12,000', 'Rossmax, Omron, Microlife, Beurer'],
            ['Digital thermometer', 'Body temperature', '৳300 – ৳2,000', 'Microlife, Omron, Beurer'],
            ['Stethoscope', 'Auscultation', '৳500 – ৳5,000', 'Rossmax, Heine'],
            ['Pulse oximeter', 'SpO2 / pulse rate', '৳800 – ৳3,500', 'Rossmax, Yuwell, Beurer'],
            ['Weighing scale', 'Patient weight', '৳2,000 – ৳12,000', 'Rossmax, Beurer'],
            ['Glucometer + strips', 'Blood glucose', 'Meter ৳800 – ৳4,000', 'Accu-Chek, Omnitest, Yuwell'],
            ['Fetal doppler', 'Antenatal heart rate', '৳3,000 – ৳18,000', 'Rossmax, MicroLife'],
          ],
        },
      },
      {
        heading: 'ECG, ultrasound and patient monitors: when clinics upgrade',
        paragraphs: [
          'Clinics that move into chronic disease management typically add a 12-lead ECG machine (৳45,000–৳250,000), a multiparameter patient monitor (৳85,000–৳600,000) and, for diagnostic centres, ultrasound (৳8,00,000+). These are capital purchases — insist on DGDA registration, free installation and staff training, and a written service contract.',
        ],
      },
      {
        heading: 'DGDA and calibration: what to verify on diagnostic devices',
        paragraphs: [
          'Every diagnostic device sold in Bangladesh must be DGDA registered. For measurement devices (BP monitors, thermometers, scales), calibration traceability matters for clinical confidence. Ask the supplier whether the device ships with a calibration certificate and how to recalibrate locally.',
        ],
      },
    ],
    faqs: [
      {
        q: 'What diagnostic equipment does a new clinic in Bangladesh need?',
        a: 'A new clinic in Bangladesh typically starts with a digital BP monitor, thermometer, stethoscope, pulse oximeter, weighing scale and glucometer with test strips — a total investment of roughly ৳15,000–৳60,000. MediportBD supplies all of these DGDA-registered with B2B pricing for clinics.',
      },
      {
        q: 'How much does an ECG machine cost in Bangladesh?',
        a: 'ECG machines in Bangladesh cost between ৳45,000 and ৳250,000 depending on the number of channels (3, 6 or 12), portability and brand. 12-lead machines from Siemens, GE and Mindray are at the upper end of the range.',
      },
      {
        q: 'Are diagnostic devices in Bangladesh DGDA registered?',
        a: 'Yes — DGDA registration is mandatory for diagnostic devices sold in Bangladesh. All diagnostic equipment sold by MediportBD is DGDA registered and CE certified, and certificates are available on request.',
      },
      {
        q: 'Where can I buy diagnostic equipment in Dhaka?',
        a: 'Diagnostic equipment is available from DGDA-registered distributors along Topkhana Road and Nawabpur Road in Dhaka, and online from MediportBD, which delivers nationwide and includes free installation for equipment in the Dhaka metro area.',
      },
    ],
  },
  {
    slug: 'surgical-instruments-guide-bangladesh',
    type: 'guide',
    title: 'Surgical Instruments in Bangladesh: Types, Grades and Buying Tips',
    metaTitle: 'Surgical Instruments Bangladesh — Types, Grades & Suppliers | MediportBD',
    metaDescription:
      'Guide to buying surgical instruments in Bangladesh: stainless steel grades (SS304/SS316), essential instruments for minor OT, autoclave compatibility, price ranges and B2B hospital pricing.',
    keywords: [
      'surgical instruments Bangladesh',
      'surgical instruments supplier Dhaka',
      'minor OT instruments set price BD',
      'forceps scissors BD',
      'hospital surgical sets',
    ],
    excerpt:
      'Surgical instruments in Bangladesh are sold in CE-certified stainless steel (SS304 or SS316), typically ৳8,000–৳250,000 per set. Always confirm autoclave compatibility and DGDA registration before purchase.',
    quickAnswer:
      'Surgical instruments in Bangladesh are made from medical-grade stainless steel (SS304 or SS316), are fully autoclavable at 134°C, and cost between ৳8,000 for a basic minor OT set and ৳250,000+ for full specialised sets. Buy from DGDA-registered suppliers with CE-certified manufacturing — MediportBD supplies scissors, forceps, needle holders, trocars and custom hospital sets in Dhaka with bulk B2B pricing.',
    updatedAt: '2026-08-05',
    readMinutes: 5,
    relatedCategories: [
      { name: 'Surgical Instruments', href: '/products/category/surgical-instruments' },
      { name: 'Surgical & Wound Care', href: '/products/category/surgical-and-wound-care' },
      { name: 'IV & Infusion Therapy', href: '/products/category/iv-and-infusion-therapy' },
    ],
    relatedGuides: [
      'medical-equipment-bangladesh-guide',
      'hospital-equipment-guide-bangladesh',
      'b2b-medical-procurement-bangladesh',
    ],
    sections: [
      {
        heading: 'Stainless steel grades explained for surgical instruments',
        paragraphs: [
          'Two grades dominate the Bangladesh surgical instrument market: SS304 (austenitic, corrosion-resistant, the standard for general instruments) and SS316 (with molybdenum for higher corrosion resistance — preferred for implants and instruments exposed to aggressive chemicals). Ask your supplier which grade the instrument is, and demand a lifetime rust-free guarantee on surgical steel.',
        ],
        bullets: [
          'SS304: standard surgical instruments — forceps, scissors, needle holders',
          'SS316: higher-grade steel for implants and chemical-heavy environments',
          'All instruments from DGDA-registered suppliers are CE certified and autoclave-safe at 134°C',
        ],
      },
      {
        heading: 'What a minor OT instrument set includes',
        paragraphs: [
          'A typical minor operating theatre set in Bangladesh includes: scissors (straight and curved Mayo), artery forceps, needle holders, tissue forceps, Allis forceps, towel clips, scalpel handles, retractors and skin hooks. Sets of 20–40 instruments typically cost ৳8,000–৳40,000 depending on steel grade and brand.',
        ],
      },
      {
        heading: 'Buying surgical instruments for hospitals (B2B)',
        paragraphs: [
          'Hospitals and surgical centres buy instruments in bulk. Ask for: custom sets built from your instrument list, batch certificates, sterilisation-compatibility documentation and a replacement warranty. MediportBD prepares custom surgical sets on request with hospital bulk pricing.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are surgical instruments in Bangladesh autoclave compatible?',
        a: 'Yes. Surgical instruments sold in Bangladesh are made from medical-grade stainless steel and are fully autoclavable at 134°C. Always confirm the steel grade (SS304 or SS316) with the supplier.',
      },
      {
        q: 'How much does a surgical instrument set cost in Bangladesh?',
        a: 'A basic minor OT set of 20–40 instruments costs ৳8,000–৳40,000 in Bangladesh. Full specialised sets (laparotomy, orthopaedic, gynaecology) range from ৳40,000 to ৳250,000+ depending on steel grade and brand.',
      },
      {
        q: 'Can I order custom surgical instrument sets for my hospital?',
        a: 'Yes. DGDA-registered suppliers like MediportBD build custom surgical sets from your hospital\u2019s instrument list, with bulk B2B pricing for hospitals and surgical centres.',
      },
    ],
  },
  {
    slug: 'laboratory-reagents-guide-bangladesh',
    type: 'guide',
    title: 'Laboratory Reagents in Bangladesh: HbA1c, CBC & Cold-Chain Buying Guide',
    metaTitle: 'Laboratory Reagents Bangladesh — HbA1c, CBC, Chemistry Kits | MediportBD',
    metaDescription:
      'Buy laboratory reagents in Bangladesh safely: cold chain requirements, analyzer compatibility (Cobas, ARCHITECT, UniCel), shelf-life rules, price ranges and DGDA-approved suppliers.',
    keywords: [
      'laboratory reagents Bangladesh',
      'HbA1c reagent price BD',
      'CBC reagent supplier Dhaka',
      'cold chain reagents Bangladesh',
      'biochemistry reagent BD',
    ],
    excerpt:
      'Laboratory reagents in Bangladesh must be cold-chain handled (2–8°C or −20°C), DGDA approved and analyzer-matched. Kits range from ৳3,000–৳150,000 depending on test and volume.',
    quickAnswer:
      'Laboratory reagents in Bangladesh must be DGDA approved, transported with cold-chain management (2–8°C or −20°C as specified), and matched to your analyzer (Cobas, ARCHITECT, UniCel, Sysmex etc.). HbA1c and CBC kits typically cost ৳3,000–৳150,000 per kit depending on test volume. MediportBD supplies Roche, Siemens and Abbott-compatible reagents in Dhaka with temperature-monitored delivery and bulk B2B supply contracts.',
    updatedAt: '2026-08-05',
    readMinutes: 6,
    relatedCategories: [
      { name: 'Laboratory Reagents', href: '/reagent-store' },
      { name: 'Laboratory Equipment', href: '/products/category/laboratory-equipment' },
    ],
    relatedGuides: [
      'medical-equipment-bangladesh-guide',
      'hba1c-reagent-comparison-bangladesh',
      'cold-chain-reagent-delivery-bangladesh',
    ],
    sections: [
      {
        heading: 'Why cold chain matters for reagents in Bangladesh',
        paragraphs: [
          'Most chemistry, immunoassay and hematology reagents degrade above 8°C. In Bangladesh\u2019s climate, a broken cold chain silently invalidates results — the kit may look fine while the assay is compromised. Reputable suppliers ship in insulated packaging with temperature monitoring and refrigerated vehicles for bulk orders.',
          'Before accepting a reagent delivery, check: (1) the temperature log where provided, (2) remaining shelf life (suppliers should guarantee 6+ months), and (3) batch numbers for traceability.',
        ],
      },
      {
        heading: 'Choosing reagents that match your analyzer',
        paragraphs: [
          'Reagents must match the analyzer platform. The most common platforms in Bangladesh include Roche Cobas, Abbott ARCHITECT, Beckman Coulter UniCel, Sysmex hematology and Mindray systems. Original reagents carry the analyzer brand; compatible (third-party) reagents cost less but must be validated. MediportBD supplies both, with a compatibility check before dispatch.',
        ],
      },
      {
        heading: 'Typical reagent price ranges in Bangladesh',
        paragraphs: [
          'Prices depend on the platform, test menu and pack size — bulk packs cost far less per test.',
        ],
        table: {
          caption: 'Indicative reagent kit price ranges in Bangladesh (2026)',
          headers: ['Test / Kit', 'Typical Kit Price (BDT)', 'Note'],
          rows: [
            ['HbA1c (HPLC/immunoassay)', '৳15,000 – ৳120,000', 'Depends on platform and pack size'],
            ['CBC (3-part / 5-part)', '৳10,000 – ৳80,000', 'Lysers and diluents often separate'],
            ['Clinical chemistry (lipid, renal, liver)', '৳8,000 – ৳150,000', 'Single or multi-analyte kits'],
            ['Rapid test kits (TSH, Dengue, HBsAg)', '৳3,000 – ৳25,000', 'Per 25/50/100 test pack'],
          ],
        },
      },
      {
        heading: 'Shelf life, storage and audit trails',
        paragraphs: [
          'Most reagents carry 12–24 months of shelf life from manufacture; suppliers should only deliver stock with 6+ months remaining. Laboratories should keep storage logs at 2–8°C or −20°C, rotate stock by expiry, and retain batch records — this is also what DGDA inspection expects.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How do I know my reagent delivery kept the cold chain in Bangladesh?',
        a: 'Use suppliers who ship with temperature-controlled packaging and monitoring, refrigerated vehicles for bulk orders, and who record transport temperature. MediportBD provides temperature-monitored cold-chain delivery for all temperature-sensitive reagents in Bangladesh.',
      },
      {
        q: 'What is the shelf life of laboratory reagents in Bangladesh?',
        a: 'Most reagents have 12–24 months of shelf life from the manufacturing date. Reputable suppliers deliver only stock with a minimum of 6 months validity remaining.',
      },
      {
        q: 'Are compatible (third-party) reagents safe to use on Roche or Abbott analyzers?',
        a: 'Compatible reagents can be cost-effective and are widely used, but they must be validated for your analyzer and meet DGDA approval. MediportBD supplies both original and compatible reagents and confirms compatibility with your platform before dispatch.',
      },
      {
        q: 'How much do HbA1c reagents cost in Bangladesh?',
        a: 'HbA1c reagent kits in Bangladesh typically cost ৳15,000–৳120,000 depending on the analyzer platform (HPLC vs immunoassay), pack size and whether they are original or compatible reagents.',
      },
    ],
  },
  {
    slug: 'hospital-equipment-guide-bangladesh',
    type: 'guide',
    title: 'Hospital Equipment in Bangladesh: ICU, Ventilators, Patient Monitors',
    metaTitle: 'Hospital Equipment Bangladesh — ICU, Ventilators & Patient Monitors | MediportBD',
    metaDescription:
      'Hospital equipment buying guide for Bangladesh: ICU machines, ventilators, patient monitors, nebulizers, suction units and CPAP — DGDA rules, price ranges and B2B procurement.',
    keywords: [
      'hospital equipment Bangladesh',
      'ICU equipment supplier Dhaka',
      'ventilator price Bangladesh',
      'patient monitor price BD',
      'hospital machines supplier',
    ],
    excerpt:
      'Hospital machines in Bangladesh — nebulizers, suction units, CPAP and patient monitors — run from ৳2,500 to ৳600,000+. Capital ICU purchases like ventilators and defibrillators need DGDA registration, installation and service contracts.',
    quickAnswer:
      'Hospital equipment in Bangladesh spans small patient-side machines (nebulizers ৳2,500–৳25,000, suction units ৳6,000–৳60,000, CPAP/BiPAP ৳40,000–৳200,000) to capital ICU systems (patient monitors ৳85,000–৳600,000, ventilators and defibrillators from ৳6,00,000). Every machine must be CE certified and DGDA registered, with local installation, commissioning and 24/7 technical support. MediportBD supplies hospital machines in Dhaka with free installation, AMC service options and B2B credit terms.',
    updatedAt: '2026-08-05',
    readMinutes: 6,
    relatedCategories: [
      { name: 'Hospital Machines', href: '/products/category/hospital-machines' },
      { name: 'Respiratory Equipment', href: '/products/category/respiratory-equipment' },
      { name: 'Medical Supplies', href: '/products/category/medical-supplies' },
    ],
    relatedGuides: [
      'medical-equipment-bangladesh-guide',
      'surgical-instruments-guide-bangladesh',
      'b2b-medical-procurement-bangladesh',
    ],
    sections: [
      {
        heading: 'Hospital machine price ranges in Bangladesh',
        paragraphs: [
          'Hospital equipment pricing varies widely with brand and specification. The ranges below reflect the Bangladesh market in 2026 and are indicative only.',
        ],
        table: {
          caption: 'Indicative hospital machine price ranges in Bangladesh',
          headers: ['Equipment', 'Typical Price Range (BDT)'],
          rows: [
            ['Compressor nebulizer', '৳2,500 – ৳15,000'],
            ['Ultrasonic nebulizer', '৳5,000 – ৳25,000'],
            ['Suction unit (portable)', '৳6,000 – ৳60,000'],
            ['CPAP / BiPAP machine', '৳40,000 – ৳200,000'],
            ['Multiparameter patient monitor', '৳85,000 – ৳600,000'],
            ['Defibrillator', '৳1,50,000 – ৳8,00,000'],
            ['Ventilator (ICU)', '৳6,00,000 – ৳30,00,000+'],
          ],
        },
      },
      {
        heading: 'What to verify before buying ICU equipment',
        paragraphs: [
          'For capital ICU purchases, verify: DGDA registration, CE certification, 220V/50Hz compatibility, warranty (1–3 years typical), availability of spare parts in Bangladesh, installation and commissioning services, and a service contract (AMC) for post-warranty support. Imported equipment without local support is a common and costly mistake in Bangladesh.',
        ],
      },
      {
        heading: 'B2B procurement for hospitals',
        paragraphs: [
          'Hospitals typically procure through tenders or rate contracts. DGDA-registered distributors like MediportBD provide written quotations, bulk pricing (8–30% off), 30–90 day credit terms, installation, staff training and 24/7 technical support for B2B clients.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How much does a patient monitor cost in Bangladesh?',
        a: 'Multiparameter patient monitors in Bangladesh typically cost ৳85,000–৳600,000 depending on the number of parameters, display size and brand. CE certified and DGDA registered units include installation and staff training.',
      },
      {
        q: 'Are ventilators available for hospitals in Bangladesh?',
        a: 'Yes. ICU ventilators are available in Bangladesh from DGDA-registered suppliers, typically from ৳6,00,000. Hospitals should insist on commissioning, spare parts availability and an AMC service contract.',
      },
      {
        q: 'What warranty do hospital machines come with in Bangladesh?',
        a: 'Hospital machines typically carry a 1–3 year manufacturer warranty depending on the product. Extended warranty and annual maintenance contracts (AMC) are available from MediportBD for most equipment.',
      },
      {
        q: 'Do you install and train staff on hospital equipment in Bangladesh?',
        a: 'Yes. MediportBD provides professional installation, commissioning and staff training for all equipment within Dhaka metro, and nationwide installation for larger projects.',
      },
    ],
  },
  {
    slug: 'dgda-registration-explained',
    type: 'explainer',
    title: 'DGDA Registration Explained: Medical Devices in Bangladesh',
    metaTitle: 'DGDA Registration Explained — Medical Devices in Bangladesh | MediportBD',
    metaDescription:
      'What DGDA registration means for medical equipment in Bangladesh: who needs it, what it covers, how buyers can verify it, and why it protects your hospital or clinic.',
    keywords: [
      'DGDA registration Bangladesh',
      'DGDA medical device registration',
      'DGDA registered medical equipment',
      'medical device regulation Bangladesh',
    ],
    excerpt:
      'DGDA registration is the legal approval that allows a medical device to be imported and sold in Bangladesh. Buyers should verify it on every regulated product — it is your legal protection.',
    quickAnswer:
      'DGDA (Directorate General of Drug Administration) is Bangladesh\u2019s national regulatory authority for drugs, medical devices and cosmetics. DGDA registration is mandatory for medical devices sold in Bangladesh: it confirms the product was assessed for safety, quality and efficacy before entering the market. Buyers should verify the product registration certificate and buy only from registered importers/distributors such as MediportBD, which maintains DGDA registration for all regulated products it sells.',
    updatedAt: '2026-08-05',
    readMinutes: 5,
    relatedCategories: [
      { name: 'Diagnostic Equipment', href: '/products/category/diagnostic-equipment' },
      { name: 'Laboratory Reagents', href: '/reagent-store' },
    ],
    relatedGuides: [
      'medical-equipment-bangladesh-guide',
      'laboratory-reagents-guide-bangladesh',
      'b2b-medical-procurement-bangladesh',
    ],
    sections: [
      {
        heading: 'What DGDA registration actually means',
        paragraphs: [
          'The Directorate General of Drug Administration regulates drugs, medical devices, cosmetics and related products under the Ministry of Health and Family Welfare. DGDA registration means a specific product has been assessed and approved for import and sale in Bangladesh — it is the buyer\u2019s assurance the device meets national safety and quality standards.',
        ],
      },
      {
        heading: 'How buyers can verify DGDA registration',
        paragraphs: [
          'Ask the supplier for the product\u2019s DGDA registration certificate and cross-check the product name and manufacturer on the certificate. For regulated products (most devices, all reagents and IVDs), the supplier must hold valid registration — if they cannot show it, the product is not legally on the market.',
        ],
      },
      {
        heading: 'Why DGDA compliance matters for hospitals and clinics',
        paragraphs: [
          'Beyond legality, DGDA compliance protects patients, ensures batch traceability for reagents, and keeps your institution clear of import/regulatory penalties. Post-market surveillance and adverse event reporting are part of the importer\u2019s obligations — a compliant distributor keeps these records for you.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is DGDA registration required for all medical equipment in Bangladesh?',
        a: 'DGDA registration is required for regulated medical devices, reagents and IVDs sold in Bangladesh. Suppliers must maintain valid registration for every regulated product they import and distribute.',
      },
      {
        q: 'How can I verify a product is DGDA registered?',
        a: 'Request the product\u2019s DGDA registration certificate from the supplier and confirm the product name and manufacturer match. MediportBD provides DGDA certificates for all regulated products on request.',
      },
      {
        q: 'Does MediportBD sell DGDA-registered products only?',
        a: 'Yes. MediportBD maintains DGDA registration for all regulated products and provides certificates on request. Products are also CE certified where applicable.',
      },
    ],
  },
  {
    slug: 'ecg-machine-price-bangladesh-2026',
    type: 'compare',
    title: 'ECG Machine Price in Bangladesh (2026): Brands Compared',
    metaTitle: 'ECG Machine Price in Bangladesh 2026 — 12-Lead, 3-Channel Brands | MediportBD',
    metaDescription:
      'ECG machine prices in Bangladesh 2026: 3/6/12-channel comparisons, portable vs tabletop, brand ranges (Siemens, GE, Mindray), DGDA rules and where to buy in Dhaka.',
    keywords: [
      'ECG machine price Bangladesh',
      '12 lead ECG machine price BD',
      'ECG machine brands Bangladesh',
      'buy ECG machine Dhaka',
      'portable ECG machine price',
    ],
    excerpt:
      'ECG machines in Bangladesh cost ৳45,000–৳250,000 in 2026: 3-channel portable units from ~৳45,000, 6-channel from ~৳80,000, and 12-lead machines from ৳1,00,000–৳250,000 depending on brand and features.',
    quickAnswer:
      'An ECG machine in Bangladesh costs between ৳45,000 and ৳250,000 in 2026. Budget: 3-channel portable units from ৳45,000; mid-range 6-channel from ৳80,000; 12-lead diagnostic machines from ৳1,00,000 up to ৳250,000 for premium brands like Siemens, GE and Mindray. All DGDA-registered ECG machines sold by MediportBD include free installation and staff training in Dhaka, with B2B pricing for hospitals and clinics.',
    updatedAt: '2026-08-05',
    readMinutes: 6,
    howTo: {
      name: 'How to Verify and Accept an ECG Machine Delivery in Bangladesh',
      description:
        'Checklist buyers can run when an ECG machine arrives — DGDA registration, model match, accessories, functional test and warranty paperwork.',
      totalTime: 'PT30M',
      steps: [
        {
          name: 'Check the DGDA registration and model match',
          text: 'Confirm the machine model on the box matches the invoice, and the product carries a valid DGDA registration. Note the serial number for your records.',
        },
        {
          name: 'Inspect the accessory kit',
          text: 'Verify the standard accessory set: patient cable, chest and limb electrodes, ECG paper rolls, power adapter and any rechargeable battery.',
        },
        {
          name: 'Run a recording test',
          text: 'Connect a test subject, run a 12-lead capture, print/export the trace and check waveform clarity, lead alignment and paper quality.',
        },
        {
          name: 'Get installation, training and warranty signed off',
          text: 'Have the supplier complete installation and staff training, and issue the warranty card and AMC quote before you accept the machine.',
        },
      ],
    },
    relatedCategories: [
      { name: 'Diagnostic Equipment', href: '/products/category/diagnostic-equipment' },
      { name: 'Hospital Machines', href: '/products/category/hospital-machines' },
    ],
    relatedGuides: [
      'diagnostic-equipment-guide-bangladesh',
      'medical-equipment-bangladesh-guide',
      'siemens-vs-ge-ecg-machines',
    ],
    sections: [
      {
        heading: 'ECG machine price ranges in Bangladesh (2026)',
        paragraphs: [
          'ECG machine pricing in Bangladesh is driven by channel count, portability and brand. The table below summarises indicative 2026 market ranges.',
        ],
        table: {
          caption: 'ECG machine price ranges in Bangladesh (2026)',
          headers: ['Type', 'Typical Price (BDT)', 'Best For'],
          rows: [
            ['3-channel portable', '৳45,000 – ৳90,000', 'GP chambers, home visits, small clinics'],
            ['6-channel', '৳80,000 – ৳1,50,000', 'Medium clinics, CHCP centres'],
            ['12-lead tabletop (entry)', '৳1,00,000 – ৳1,80,000', 'Hospitals, diagnostic centres'],
            ['12-lead premium (Siemens, GE, Mindray)', '৳1,80,000 – ৳250,000+', 'Cardiology departments, large hospitals'],
          ],
        },
      },
      {
        heading: '3-channel vs 6-channel vs 12-lead: which do you need?',
        paragraphs: [
          'A 3-channel ECG prints three leads at a time and is sufficient for routine screening in a GP chamber or home-care practice. A 6-channel machine suits mid-size clinics. A 12-lead machine is the standard for hospitals and diagnostic centres — it records all 12 leads synchronously, which is what cardiologists expect for definitive interpretation.',
        ],
      },
      {
        heading: 'Brand comparison: what you get for the price',
        paragraphs: [
          'In Bangladesh, entry-to-mid range machines come from brands like Rossmax and Yuwell; premium diagnostic machines come from Siemens Healthineers, GE Healthcare and Mindray. Premium machines add automated interpretation, larger storage, thermal print quality, and — critically — local service networks with spare parts in Dhaka.',
        ],
      },
      {
        heading: 'What to check before buying an ECG machine',
        paragraphs: [
          'Verify DGDA registration and CE certification, confirm free installation and staff training, check the warranty (typically 1–3 years), and confirm the supplier can service the machine locally. For B2B buyers, ask for a demonstration before committing to bulk purchase.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How much does a 12-lead ECG machine cost in Bangladesh?',
        a: 'A 12-lead ECG machine costs ৳1,00,000–৳250,000 in Bangladesh depending on brand and features. Premium 12-lead machines from Siemens, GE and Mindray sit at the top of the range.',
      },
      {
        q: 'Which ECG machine brand is best in Bangladesh?',
        a: 'For hospitals and diagnostic centres, 12-lead machines from Siemens Healthineers, GE Healthcare and Mindray are the market standards. For GP chambers and small clinics, Rossmax and Yuwell offer good value 3-channel machines.',
      },
      {
        q: 'Is installation and training included with ECG machines in Bangladesh?',
        a: 'MediportBD provides free installation and staff training for all ECG machines in the Dhaka metro area, with installation available nationwide at nominal charges for larger orders.',
      },
      {
        q: 'Can I get a B2B discount on ECG machines for my clinic?',
        a: 'Yes. MediportBD offers 8–30% bulk discounts and 30–90 day credit terms for B2B clients buying ECG machines and other diagnostic equipment for hospitals and clinics.',
      },
    ],
  },
  {
    slug: 'bp-monitor-buying-guide-bangladesh',
    type: 'compare',
    title: 'BP Monitor Buying Guide Bangladesh: Wrist vs Upper Arm (2026)',
    metaTitle: 'BP Monitor Buying Guide Bangladesh — Wrist vs Upper Arm 2026 | MediportBD',
    metaDescription:
      'How to choose a blood pressure monitor in Bangladesh: upper arm vs wrist accuracy, cuff size, validated brands (Rossmax, Omron, Microlife, Beurer), price ranges and buying tips.',
    keywords: [
      'BP monitor Bangladesh',
      'blood pressure machine price BD',
      'best BP monitor Dhaka',
      'upper arm BP monitor',
      'digital BP machine price Bangladesh',
    ],
    excerpt:
      'Upper-arm BP monitors are the accurate choice for home and clinic use in Bangladesh (৳1,500–৳12,000); wrist monitors (৳1,200–৳6,000) suit travel and convenience but are less accurate. Choose a validated brand with the correct cuff size.',
    quickAnswer:
      'For accurate blood pressure monitoring in Bangladesh, choose an upper-arm digital BP monitor from a clinically validated brand — Rossmax, Omron, Microlife or Beurer — priced between ৳1,500 and ৳12,000. Wrist monitors cost ৳1,200–৳6,000 and are convenient but less accurate. Match the cuff size to the patient\u2019s arm circumference (regular 22–32cm, large 32–42cm). MediportBD supplies DGDA-registered BP monitors in Dhaka with nationwide delivery and B2B pricing for clinics.',
    updatedAt: '2026-08-05',
    readMinutes: 5,
    howTo: {
      name: 'How to Measure Blood Pressure Correctly',
      description:
        'Steps for getting an accurate blood pressure reading at home in Bangladesh — correct posture, cuff placement and measurement technique.',
      totalTime: 'PT5M',
      steps: [
        {
          name: 'Sit still for 5 minutes before measuring',
          text: 'Sit quietly in a chair with your back supported and both feet flat on the floor. Do not drink coffee or smoke for 30 minutes before the reading.',
        },
        {
          name: 'Place the cuff on the bare upper arm',
          text: 'Wrap the cuff 2cm above the elbow crease on your bare left arm. The cuff should be snug but not tight — it must be the correct size for your arm circumference.',
        },
        {
          name: 'Rest your arm at heart level',
          text: 'Rest your forearm on a table so the cuff sits at the level of your heart. Keep your palm facing up and relax your arm completely.',
        },
        {
          name: 'Take the reading and record it',
          text: 'Press start and stay silent while the cuff inflates. Record the systolic and diastolic numbers, plus the date and time. Take two readings one minute apart and average them.',
        },
      ],
    },
    relatedCategories: [
      { name: 'Diagnostic Equipment', href: '/products/category/diagnostic-equipment' },
      { name: 'Medical Devices', href: '/products/category/medical-devices' },
    ],
    relatedGuides: [
      'diagnostic-equipment-guide-bangladesh',
      'medical-equipment-bangladesh-guide',
    ],
    sections: [
      {
        heading: 'Upper arm vs wrist BP monitors: accuracy matters',
        paragraphs: [
          'Upper-arm monitors measure at brachial artery level and are the gold standard for home and clinic use. Wrist monitors are convenient for travel but sensitive to wrist positioning — readings are only reliable when the wrist is held at heart level. For hypertension management in Bangladesh, clinicians overwhelmingly recommend upper-arm devices.',
        ],
        table: {
          caption: 'BP monitor comparison for Bangladesh buyers',
          headers: ['Feature', 'Upper Arm', 'Wrist'],
          rows: [
            ['Accuracy', 'High — gold standard', 'Moderate — position sensitive'],
            ['Typical price (BDT)', '৳1,500 – ৳12,000', '৳1,200 – ৳6,000'],
            ['Recommended for', 'Home monitoring, clinics, elderly', 'Travel, quick checks'],
            ['Cuff sizes', 'Regular 22–32cm, Large 32–42cm', 'Fixed, small range'],
            ['Validation', 'Clinically validated (ESH/AAMI)', 'Fewer validated models'],
          ],
        },
      },
      {
        heading: 'Cuff size: the most common buying mistake',
        paragraphs: [
          'Using the wrong cuff size produces falsely high or low readings — the most common error in Bangladesh clinics. Measure the patient\u2019s mid-upper-arm circumference and match: regular cuff 22–32cm, large cuff 32–42cm. Most brands ship a regular cuff; confirm the large cuff is available before buying for larger patients.',
        ],
      },
      {
        heading: 'Which BP monitor brands are available in Bangladesh?',
        paragraphs: [
          'Rossmax, Omron, Microlife and Beurer are the established brands in the Bangladesh market, all DGDA registered. Rossmax and Omron dominate clinic supply; Beurer is popular for home use. Prices scale with features: irregular heartbeat detection, multi-user memory and Bluetooth app connectivity.',
        ],
      },
      {
        heading: 'Buying BP monitors in bulk for clinics',
        paragraphs: [
          'Clinics and health programmes buy BP monitors in dozens. B2B buyers should request validated-model pricing, calibration documentation and a replacement warranty. MediportBD offers 8–30% bulk discounts with credit terms for institutions.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Which BP monitor is best for home use in Bangladesh?',
        a: 'An upper-arm digital BP monitor from a clinically validated brand (Rossmax, Omron, Microlife or Beurer) is best for home use in Bangladesh, priced ৳1,500–৳12,000. Choose the cuff size that matches your arm circumference.',
      },
      {
        q: 'Are wrist BP monitors accurate?',
        a: 'Wrist monitors are convenient but less accurate than upper-arm models — readings depend on holding the wrist at heart level. For reliable hypertension monitoring, clinicians recommend upper-arm monitors.',
      },
      {
        q: 'How much does a BP machine cost in Bangladesh?',
        a: 'Upper-arm BP monitors cost ৳1,500–৳12,000 and wrist monitors ৳1,200–৳6,000 in Bangladesh, depending on brand, cuff size and features.',
      },
      {
        q: 'Do you offer bulk pricing on BP monitors for clinics?',
        a: 'Yes. MediportBD offers 8–30% bulk discounts on BP monitors and other diagnostic devices for clinics, hospitals and health programmes, with 30–90 day credit terms for B2B clients.',
      },
    ],
  },
  {
    slug: 'hba1c-reagent-comparison-bangladesh',
    type: 'compare',
    title: 'HbA1c Reagent Comparison Bangladesh: HPLC vs Immunoassay (2026)',
    metaTitle: 'HbA1c Reagent Comparison Bangladesh — HPLC vs Immunoassay 2026 | MediportBD',
    metaDescription:
      'Compare HbA1c reagent options in Bangladesh: HPLC vs immunoassay, original vs compatible reagents, analyzer platforms, 2026 kit prices and the best choice for your lab.',
    keywords: [
      'HbA1c reagent Bangladesh',
      'HbA1c kit price BD',
      'HPLC vs immunoassay HbA1c',
      'HbA1c reagent supplier Dhaka',
      'diabetes testing Bangladesh',
    ],
    excerpt:
      'HbA1c reagents in Bangladesh cost ৳15,000–৳120,000 per kit. HPLC platforms (like Bio-Rad) are the gold standard; immunoassay reagents (Roche, Abbott-compatible) cost less per test on open analyzers.',
    quickAnswer:
      'For HbA1c testing in Bangladesh, HPLC platforms (e.g., Bio-Rad D-10 style systems) are the gold standard with ৳15,000–৳120,000 kit prices, while immunoassay reagents on open analyzers (Roche Cobas, Abbott ARCHITECT compatible) typically cost ৳15,000–৳80,000 per kit with lower per-test cost at volume. Choose HPLC for high-throughput dedicated HbA1c testing and immunoassay for labs already running an open chemistry platform. MediportBD supplies both original and validated compatible HbA1c reagents in Dhaka with cold-chain delivery and B2B supply contracts.',
    updatedAt: '2026-08-05',
    readMinutes: 6,
    relatedCategories: [
      { name: 'Laboratory Reagents', href: '/reagent-store' },
      { name: 'Laboratory Equipment', href: '/products/category/laboratory-equipment' },
      { name: 'Diabetes Care', href: '/products/category/diabetes-care' },
    ],
    relatedGuides: [
      'laboratory-reagents-guide-bangladesh',
      'cold-chain-reagent-delivery-bangladesh',
      'medical-equipment-bangladesh-guide',
    ],
    sections: [
      {
        heading: 'HbA1c testing methods compared for Bangladesh labs',
        paragraphs: [
          'Two methods dominate HbA1c testing in Bangladesh: HPLC (high-performance liquid chromatography) and immunoassay. HPLC is the NGSP/IFCC gold standard — it separates and quantifies HbA1c directly and automatically detects common haemoglobin variants. Immunoassay reagents run on existing open chemistry or immunoassay platforms, which avoids buying a dedicated analyzer.',
        ],
        table: {
          caption: 'HPLC vs immunoassay HbA1c — Bangladesh comparison',
          headers: ['Factor', 'HPLC', 'Immunoassay'],
          rows: [
            ['Accuracy standard', 'NGSP/IFCC gold standard', 'Calibrated to NGSP — good'],
            ['Dedicated analyzer needed?', 'Yes', 'No — runs on open platforms'],
            ['Haemoglobin variant detection', 'Yes (built-in flagging)', 'Limited / method dependent'],
            ['Typical kit price (BDT)', '৳30,000 – ৳120,000', '৳15,000 – ৳80,000'],
            ['Best for', 'High-volume diabetes labs', 'Small–medium labs with open analyzers'],
          ],
        },
      },
      {
        heading: 'Original vs compatible HbA1c reagents',
        paragraphs: [
          'Original reagents come from the analyzer manufacturer and are guaranteed validated for that platform. Compatible reagents are third-party kits validated for common platforms (Roche Cobas, Abbott ARCHITECT, Beckman UniCel) — they typically cost 15–30% less and are widely used in Bangladesh labs. Whichever you choose, the reagent must be DGDA approved and cold-chain delivered.',
        ],
      },
      {
        heading: '2026 HbA1c reagent price ranges in Bangladesh',
        paragraphs: [
          'Kit prices depend on the platform, pack size and whether the reagent is original or compatible. The table below is indicative for the Bangladesh market in 2026 — request a written quotation for your platform and volume.',
        ],
        table: {
          caption: 'Indicative HbA1c reagent pricing in Bangladesh (2026)',
          headers: ['Reagent type', 'Typical Kit Price (BDT)', 'Typical pack'],
          rows: [
            ['Original (HPLC platform)', '৳30,000 – ৳120,000', '100–500 tests'],
            ['Original (immunoassay)', '৳20,000 – ৳80,000', '100–400 tests'],
            ['Compatible (open chemistry)', '৳15,000 – ৳60,000', '100–300 tests'],
          ],
        },
      },
      {
        heading: 'Verdict: which HbA1c reagent should you choose?',
        paragraphs: [
          'If you run a dedicated diabetes or high-volume testing lab, invest in an HPLC system with original reagents — the accuracy and variant flagging justify the cost. If you already run an open chemistry analyzer, validated compatible immunoassay reagents give the best cost per test. In both cases, buy only DGDA-approved reagents with documented cold-chain handling.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Which is better for HbA1c testing: HPLC or immunoassay?',
        a: 'HPLC is the NGSP/IFCC gold standard for HbA1c and detects haemoglobin variants automatically, making it best for high-volume diabetes labs. Immunoassay reagents are cost-effective on existing open analyzers and are suitable for most small and medium labs when properly calibrated.',
      },
      {
        q: 'How much do HbA1c reagents cost in Bangladesh?',
        a: 'HbA1c reagent kits in Bangladesh cost ৳15,000–৳120,000 depending on the platform (HPLC vs immunoassay), pack size and whether the reagent is original or compatible. Compatible reagents are typically 15–30% cheaper than original.',
      },
      {
        q: 'Are compatible HbA1c reagents safe to use in Bangladesh labs?',
        a: 'Yes — when they are DGDA approved and validated for your analyzer platform. MediportBD confirms platform compatibility before dispatch and supplies both original and compatible options with cold-chain delivery.',
      },
      {
        q: 'Do you supply HbA1c reagents in bulk to diabetes centres?',
        a: 'Yes. MediportBD offers bulk B2B pricing and regular supply contracts for HbA1c reagents to diabetes centres, diagnostic labs and hospitals across Bangladesh.',
      },
    ],
  },
  {
    slug: 'siemens-vs-ge-ecg-machines',
    type: 'compare',
    title: 'Siemens vs GE ECG Machines in Bangladesh: Which to Buy?',
    metaTitle: 'Siemens vs GE ECG Machines Bangladesh — Comparison & Prices | MediportBD',
    metaDescription:
      'Siemens vs GE ECG machines for Bangladesh hospitals: feature comparison, 2026 price ranges, service availability, warranty and a clear verdict for cardiology departments.',
    keywords: [
      'Siemens ECG machine Bangladesh',
      'GE ECG machine price BD',
      'best ECG machine Bangladesh',
      'ECG machine comparison',
      '12 lead ECG machine price Bangladesh',
    ],
    excerpt:
      'In Bangladesh, both Siemens and GE 12-lead ECG machines cost ৳1,80,000–৳250,000+. Siemens leads on connectivity options; GE is known for rugged build and fast local service. Pick on after-sales support, not brand alone.',
    quickAnswer:
      'Siemens and GE 12-lead ECG machines both cost roughly ৳1,80,000–৳250,000+ in Bangladesh (2026). Siemens machines offer strong digital connectivity and automated interpretation; GE machines are known for rugged build quality and widely available local service networks. For a Bangladesh hospital, the deciding factor should be local service response, spare-part availability and staff familiarity — verify both before purchase. MediportBD supplies DGDA-registered 12-lead ECG machines from both brands with free installation in Dhaka and B2B pricing.',
    updatedAt: '2026-08-05',
    readMinutes: 5,
    relatedCategories: [
      { name: 'Diagnostic Equipment', href: '/products/category/diagnostic-equipment' },
      { name: 'Hospital Machines', href: '/products/category/hospital-machines' },
    ],
    relatedGuides: [
      'ecg-machine-price-bangladesh-2026',
      'diagnostic-equipment-guide-bangladesh',
      'medical-equipment-bangladesh-guide',
    ],
    sections: [
      {
        heading: 'Siemens vs GE ECG machines: side-by-side',
        paragraphs: [
          'Both brands offer 3/6/12-channel machines, but hospitals in Bangladesh typically compare their 12-lead diagnostic units. The comparison below reflects the 2026 Bangladesh market.',
        ],
        table: {
          caption: 'Siemens vs GE 12-lead ECG machines — Bangladesh comparison',
          headers: ['Factor', 'Siemens', 'GE'],
          rows: [
            ['Typical price (BDT)', '৳1,80,000 – ৳250,000+', '৳1,80,000 – ৳250,000+'],
            ['Strengths', 'Connectivity, automated interpretation, modular design', 'Rugged build, simple workflow, fast service response'],
            ['Service network in BD', 'Authorised distributor support', 'Widely supported by local engineers'],
            ['Best for', 'Large cardiology departments, network reporting', 'Hospitals and clinics prioritising uptime'],
            ['Warranty (typical)', '1–3 years', '1–3 years'],
          ],
        },
      },
      {
        heading: 'What really matters when choosing between them',
        paragraphs: [
          'At similar price points, the difference is not raw performance — both produce accurate 12-lead diagnostics. What matters in Bangladesh is: (1) how quickly the supplier\u2019s engineers can respond, (2) whether spare parts (cables, electrodes, thermal paper) are stocked locally, and (3) whether your staff already know the workflow. Ask for a demonstration of both and check references from other Bangladesh hospitals.',
        ],
      },
      {
        heading: 'Verdict',
        paragraphs: [
          'Choose Siemens if you need advanced connectivity and digital reporting for a cardiology department. Choose GE if you want a proven, rugged machine with broad local engineering support. Either way, buy through a DGDA-registered supplier that includes installation, training and an AMC option.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How much does a Siemens ECG machine cost in Bangladesh?',
        a: 'Siemens 12-lead ECG machines cost roughly ৳1,80,000–৳250,000+ in Bangladesh depending on model and features. GE 12-lead machines sit in a similar range.',
      },
      {
        q: 'Which ECG machine brand is better for hospitals in Bangladesh?',
        a: 'Both Siemens and GE produce excellent 12-lead ECG machines. The best choice depends on local service response, spare-part availability and your staff\u2019s familiarity — compare demonstrations and hospital references before deciding.',
      },
      {
        q: 'Do you supply Siemens and GE ECG machines in Bangladesh?',
        a: 'Yes. MediportBD supplies DGDA-registered 12-lead ECG machines from Siemens and GE with free installation and staff training in Dhaka, plus B2B pricing for hospitals.',
      },
      {
        q: 'Is warranty included with ECG machines in Bangladesh?',
        a: 'Yes, typically 1–3 years depending on the model. Extended warranty and annual maintenance contracts (AMC) are available through MediportBD.',
      },
    ],
  },
  {
    slug: 'b2b-medical-procurement-bangladesh',
    type: 'guide',
    title: 'B2B Medical Procurement in Bangladesh: A Hospital Buyer\u2019s Guide',
    metaTitle: 'B2B Medical Procurement Bangladesh — Hospital Buying Guide | MediportBD',
    metaDescription:
      'How hospitals, clinics and diagnostic centres buy medical equipment in Bangladesh: tenders, quotations, bulk discounts, credit terms, DGDA verification and supply contracts.',
    keywords: [
      'B2B medical procurement Bangladesh',
      'hospital procurement Dhaka',
      'medical equipment tender Bangladesh',
      'bulk medical supplies BD',
      'clinic supply contract',
    ],
    excerpt:
      'Hospitals in Bangladesh typically save 8–30% on medical equipment through B2B procurement: written quotations, bulk pricing, 30–90 day credit terms and supply contracts beat retail buying.',
    quickAnswer:
      'B2B medical procurement in Bangladesh works through written quotations, bulk discounts of 8–30%, credit terms of 30–90 days and supply contracts. Hospitals should verify DGDA registration on every product, demand installation and staff training, and lock in spare-part and AMC commitments. MediportBD provides hospitals, clinics and diagnostic centres a dedicated account manager, priority processing and custom quotations across diagnostic equipment, surgical instruments and laboratory reagents.',
    updatedAt: '2026-08-05',
    readMinutes: 5,
    relatedCategories: [
      { name: 'Diagnostic Equipment', href: '/products/category/diagnostic-equipment' },
      { name: 'Surgical Instruments', href: '/products/category/surgical-instruments' },
      { name: 'Laboratory Reagents', href: '/reagent-store' },
    ],
    relatedGuides: [
      'medical-equipment-bangladesh-guide',
      'dgda-registration-explained',
      'hospital-equipment-guide-bangladesh',
    ],
    sections: [
      {
        heading: 'How institutional pricing works in Bangladesh',
        paragraphs: [
          'B2B buyers in Bangladesh typically receive 8–30% off listed prices depending on order value and contract terms. Institutional pricing usually includes: written quotations, dedicated account management, priority processing, free installation on equipment, and credit terms of 30–90 days for registered institutions. Retail pricing rarely includes these — that is the core value of B2B procurement.',
        ],
      },
      {
        heading: 'The procurement checklist for hospitals and clinics',
        paragraphs: [
          'Before signing a supply agreement, verify: DGDA registration certificates for regulated products, manufacturer authorisation letters, written warranty and AMC terms, spare-part availability, and a delivery schedule. For reagents, add cold-chain documentation and batch traceability. Keep every certificate on file — inspectors routinely ask for them.',
        ],
        bullets: [
          'Written quotation with itemised pricing and validity date',
          'DGDA registration certificates for regulated products',
          'Installation, training and AMC terms in the agreement',
          'Delivery lead times and cold-chain handling for reagents',
          'Credit terms, payment schedule and order minimums',
        ],
      },
      {
        heading: 'Tenders and rate contracts',
        paragraphs: [
          'Government and large private hospitals in Bangladesh procure through tenders and rate contracts. DGDA-registered distributors like MediportBD support tender submissions with required documentation (trade licence, DGDA registration, bank statements, product certificates) and competitive institutional rates.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How much can hospitals save with B2B medical procurement in Bangladesh?',
        a: 'Hospitals and clinics typically save 8–30% on medical equipment through B2B pricing, plus gain credit terms, priority processing, free installation and dedicated account management that retail buyers do not receive.',
      },
      {
        q: 'What documents do I need for B2B medical procurement in Bangladesh?',
        a: 'Institutions typically need a trade licence, VAT/BIN registration, and proof of the purchasing authority. Suppliers provide DGDA certificates, manufacturer authorisation letters and written quotations to complete the procurement file.',
      },
      {
        q: 'Do you support hospital tenders in Bangladesh?',
        a: 'Yes. MediportBD supports tender and rate-contract submissions with the required compliance documentation and competitive institutional pricing.',
      },
      {
        q: 'What are the credit terms for B2B buyers in Bangladesh?',
        a: 'Registered B2B institutions receive credit terms of 30–90 days depending on the agreement, with bulk discounts of 8–30% applied to orders.',
      },
    ],
  },
  {
    slug: 'cold-chain-reagent-delivery-bangladesh',
    type: 'guide',
    title: 'Cold-Chain Reagent Delivery in Bangladesh: What Labs Must Check',
    metaTitle: 'Cold Chain Reagent Delivery Bangladesh — 2–8°C Guide | MediportBD',
    metaDescription:
      'How cold-chain reagent delivery works in Bangladesh: temperature requirements (2–8°C / −20°C), monitoring, acceptance checks, and how to avoid silently spoiled reagents.',
    keywords: [
      'cold chain Bangladesh',
      'reagent delivery temperature',
      'cold chain logistics medical Bangladesh',
      '2-8 degree reagent storage',
      'laboratory reagent transport BD',
    ],
    excerpt:
      'Reagents shipped without cold-chain control in Bangladesh can be silently ruined — assays fail or, worse, give wrong results. Verify temperature logs, packaging and remaining shelf life on every delivery.',
    quickAnswer:
      'Cold-chain reagent delivery in Bangladesh must maintain 2–8°C (or −20°C for frozen products) from warehouse to laboratory door. Labs should verify insulated packaging, temperature monitoring records, remaining shelf life (6+ months) and batch numbers on every delivery. MediportBD ships all temperature-sensitive reagents with temperature-monitored insulated packaging and refrigerated transport for bulk orders, so Bangladeshi labs receive reagents in specification.',
    updatedAt: '2026-08-05',
    readMinutes: 5,
    relatedCategories: [
      { name: 'Laboratory Reagents', href: '/reagent-store' },
      { name: 'Laboratory Equipment', href: '/products/category/laboratory-equipment' },
    ],
    relatedGuides: [
      'laboratory-reagents-guide-bangladesh',
      'hba1c-reagent-comparison-bangladesh',
      'medical-equipment-bangladesh-guide',
    ],
    sections: [
      {
        heading: 'Why cold chain breaks silently in Bangladesh',
        paragraphs: [
          'Most reagent damage happens during transit, not storage: vehicles without refrigeration, long customs holds and uninsulated packaging. The reagent looks normal but the assay chemistry has degraded — the risk is not a failed test you notice, but a wrong result you trust. In Bangladesh\u2019s heat, even a few unrefrigerated hours can exceed the 8°C limit.',
        ],
      },
      {
        heading: 'Temperature requirements by reagent type',
        paragraphs: [
          'Check the manufacturer\u2019s stated storage temperature on the kit label — it is always the legal requirement. The most common bands are 2–8°C (refrigerated, most chemistry and immunoassay reagents) and −20°C (frozen, some enzymes and controls). Some dry reagents are stable at 15–25°C, but any kit marked "store at 2–8°C" must be transported cold.',
        ],
      },
      {
        heading: 'Acceptance checklist for every reagent delivery',
        paragraphs: [
          'On receipt, check: (1) packaging — insulated box, gel packs or data logger present, (2) temperature record where supplied, (3) remaining shelf life — at least 6 months, (4) batch numbers match the packing list, and (5) seals intact. Photograph any doubt and report it immediately. Good suppliers replace compromised stock without argument.',
        ],
        bullets: [
          'Insulated packaging and temperature monitoring in transit',
          'Remaining shelf life of 6+ months on receipt',
          'Batch numbers matching packing list for traceability',
          'Immediate rejection and replacement of compromised stock',
        ],
      },
    ],
    faqs: [
      {
        q: 'What temperature must reagents be kept at in Bangladesh?',
        a: 'Most chemistry and immunoassay reagents must be kept at 2–8°C; some enzymes and controls require −20°C. Always follow the manufacturer\u2019s stated storage temperature on the kit label.',
      },
      {
        q: 'How do I know my reagent delivery kept the cold chain?',
        a: 'Check the packaging (insulated box with temperature monitoring), request the transit temperature record, verify remaining shelf life and inspect seals. MediportBD provides temperature-monitored cold-chain delivery for all temperature-sensitive reagents.',
      },
      {
        q: 'What happens if a reagent delivery is compromised?',
        a: 'Reject or quarantine the shipment immediately and notify the supplier. Reputable suppliers such as MediportBD replace compromised stock without argument — never use reagents of doubtful temperature history.',
      },
      {
        q: 'Do you deliver frozen (−20°C) reagents in Bangladesh?',
        a: 'Yes. MediportBD handles both refrigerated (2–8°C) and frozen (−20°C) reagent categories with appropriate packaging and transport for the Bangladesh market.',
      },
    ],
  },
];

/**
 * Guides that live under /compare (type === 'compare')
 */
export const COMPARISON_GUIDES = GUIDES.filter(g => g.type === 'compare');

/**
 * Guide hub (pillar) entry — the /guides index doubles as the pillar page.
 */
export const PILLAR_GUIDE = GUIDES.find(g => g.type === 'pillar');

/**
 * Resolve a single guide by slug.
 */
export function getGuideBySlug(slug) {
  return GUIDES.find(g => g.slug === slug) || null;
}
