/**
 * Category-level GEO content for MediportBD
 *
 * Answer-first Quick Answer text + FAQPage schema content per category slug.
 * Written so AI engines (ChatGPT, Perplexity, Google AI Overviews) can
 * extract and cite MediportBD directly for "[category] Bangladesh / price /
 * DGDA" style queries. Content must stay accurate — update with the market.
 */

export const CATEGORY_GEO = {
  'diagnostic-equipment': {
    quickAnswer:
      'Diagnostic equipment in Bangladesh ranges from ৳800 for basic devices (thermometers, pulse oximeters) to ৳45,000–৳250,000 for ECG machines and above for ultrasound systems. MediportBD is a DGDA-registered supplier in Dhaka stocking BP monitors, pulse oximeters, weighing scales, fetal dopplers and ECG machines from Rossmax, Omron, Microlife and Beurer, with free installation in Dhaka and B2B bulk pricing.',
    faqs: [
      {
        q: 'What is the price range for diagnostic equipment in Bangladesh?',
        a: 'Diagnostic equipment in Bangladesh ranges from ৳800 for basic devices like thermometers and pulse oximeters to ৳45,000–৳250,000 for ECG machines and ৳8,00,000+ for ultrasound systems. MediportBD offers DGDA-registered diagnostic equipment across all price ranges with B2B bulk pricing available.',
      },
      {
        q: 'Is DGDA registration required to buy diagnostic equipment in Bangladesh?',
        a: 'Yes, DGDA registration is mandatory for medical devices sold in Bangladesh. All diagnostic equipment sold by MediportBD is DGDA registered and CE certified, with certificates available on request.',
      },
      {
        q: 'How long does delivery take for diagnostic equipment in Bangladesh?',
        a: 'MediportBD delivers within Dhaka metro same-day for orders placed before 12 PM. Nationwide delivery to other divisions takes 2–4 business days, with free installation included for diagnostic equipment in Dhaka.',
      },
      {
        q: 'Which diagnostic equipment brands are available in Bangladesh?',
        a: 'MediportBD stocks Rossmax, Omron, Microlife, Beurer and Yuwell diagnostic devices — BP monitors, thermometers, pulse oximeters, weighing scales and fetal dopplers — all DGDA registered with genuine warranties.',
      },
    ],
  },
  'surgical-instruments': {
    quickAnswer:
      'Surgical instruments in Bangladesh cost ৳8,000–৳250,000 per set depending on steel grade (SS304/SS316), instruments included and brand. MediportBD supplies CE-certified, autoclave-safe scissors, forceps, needle holders, trocar sets and custom hospital sets in Dhaka with bulk B2B pricing.',
    faqs: [
      {
        q: 'How much do surgical instruments cost in Bangladesh?',
        a: 'A basic minor OT set of 20–40 instruments costs ৳8,000–৳40,000 in Bangladesh, while full specialised sets range from ৳40,000 to ৳250,000+ depending on steel grade and brand.',
      },
      {
        q: 'Are surgical instruments in Bangladesh autoclave compatible?',
        a: 'Yes. Surgical instruments sold in Bangladesh are made from medical-grade stainless steel (SS304 or SS316) and are fully autoclavable at 134°C for sterilisation.',
      },
      {
        q: 'Can I order custom surgical instrument sets in Bangladesh?',
        a: 'Yes. MediportBD prepares custom surgical sets from your hospital\u2019s instrument list, with batch certificates and bulk B2B pricing for hospitals and surgical centres.',
      },
    ],
  },
  'laboratory-reagents': {
    quickAnswer:
      'Laboratory reagents in Bangladesh must be DGDA approved and cold-chain handled (2–8°C or −20°C). HbA1c and CBC kits typically cost ৳3,000–৳150,000 depending on analyzer platform and pack size. MediportBD supplies Roche, Siemens and Abbott-compatible reagents in Dhaka with temperature-monitored delivery and B2B supply contracts.',
    faqs: [
      {
        q: 'How do I ensure reagent cold chain in Bangladesh?',
        a: 'Use suppliers who ship temperature-sensitive reagents in monitored, insulated packaging with refrigerated transport for bulk orders. MediportBD provides temperature-monitored cold-chain delivery (2–8°C) for all reagent shipments in Bangladesh.',
      },
      {
        q: 'Which analyzer brands do you supply reagents for?',
        a: 'MediportBD supplies reagents for Roche Cobas, Abbott ARCHITECT, Beckman Coulter UniCel, Sysmex and Mindray analyzers — both original and validated compatible reagents, with compatibility confirmed before dispatch.',
      },
      {
        q: 'What is the shelf life of laboratory reagents in Bangladesh?',
        a: 'Most reagents have 12–24 months shelf life from manufacturing. MediportBD supplies only stock with a minimum of 6 months validity remaining.',
      },
      {
        q: 'How much do HbA1c reagents cost in Bangladesh?',
        a: 'HbA1c reagent kits in Bangladesh typically cost ৳15,000–৳120,000 depending on the analyzer platform, pack size and whether they are original or compatible reagents.',
      },
    ],
  },
  'laboratory-equipment': {
    quickAnswer:
      'Laboratory equipment in Bangladesh — hematology analyzers, ESR machines and calibration systems — typically starts at ৳1,50,000 and ranges into ৳40,00,000+ for full chemistry systems. MediportBD supplies STEL, Bio-Max, THERMA and Rossmax equipment in Dhaka with installation, calibration and B2B pricing for laboratories.',
    faqs: [
      {
        q: 'How much does a hematology analyzer cost in Bangladesh?',
        a: 'Hematology analyzers in Bangladesh typically cost ৳1,50,000–৳15,00,000 depending on throughput (3-part vs 5-part) and brand. Installation, training and calibration are included with equipment from MediportBD.',
      },
      {
        q: 'Do you install and calibrate laboratory equipment in Bangladesh?',
        a: 'Yes. MediportBD provides professional installation, calibration and staff training for laboratory equipment across Bangladesh, with AMC service options.',
      },
      {
        q: 'What laboratory equipment brands are available in Bangladesh?',
        a: 'MediportBD supplies STEL, Bio-Max, THERMA and Rossmax laboratory equipment — hematology analyzers, ESR machines, and calibration systems — all DGDA registered.',
      },
    ],
  },
  'hospital-machines': {
    quickAnswer:
      'Hospital machines in Bangladesh range from ৳2,500 nebulizers to ৳30,00,000+ ICU ventilators. Multiparameter patient monitors cost ৳85,000–৳600,000. Every machine must be CE certified and DGDA registered. MediportBD supplies hospital machines in Dhaka with free installation, AMC options and B2B credit terms.',
    faqs: [
      {
        q: 'How much does a patient monitor cost in Bangladesh?',
        a: 'Multiparameter patient monitors in Bangladesh typically cost ৳85,000–৳600,000 depending on parameters, display and brand. CE certified and DGDA registered units include installation and staff training.',
      },
      {
        q: 'Are ventilators available for hospitals in Bangladesh?',
        a: 'Yes. ICU ventilators are available from DGDA-registered suppliers in Bangladesh, typically from ৳6,00,000, with commissioning, spare parts and AMC service contracts.',
      },
      {
        q: 'What warranty do hospital machines come with in Bangladesh?',
        a: 'Hospital machines typically carry a 1–3 year manufacturer warranty. Extended warranty and annual maintenance contracts (AMC) are available from MediportBD for most equipment.',
      },
      {
        q: 'Do you provide installation and training for hospital machines?',
        a: 'Yes. MediportBD provides professional installation, commissioning and staff training for all hospital machines in Dhaka metro, and nationwide for larger projects.',
      },
    ],
  },
  'ppe-and-safety': {
    quickAnswer:
      'PPE and safety supplies in Bangladesh — surgical gloves, N95 respirators, masks and gowns — are available in bulk from DGDA-registered suppliers. MediportBD supplies Ansell, 3M and Cardinal Health-compatible PPE with fast Dhaka delivery and B2B contracts for hospitals and clinics.',
    faqs: [
      {
        q: 'Can I order PPE in bulk for my hospital in Bangladesh?',
        a: 'Yes. MediportBD supplies surgical gloves, N95 respirators, masks and gowns in bulk with B2B pricing and regular supply contracts for hospitals and clinics across Bangladesh.',
      },
      {
        q: 'What PPE brands are available in Bangladesh?',
        a: 'MediportBD supplies PPE from leading brands including Ansell, 3M and Cardinal Health, all DGDA registered with quality documentation.',
      },
      {
        q: 'How fast is PPE delivery in Dhaka?',
        a: 'PPE orders placed before 12 PM are delivered same-day within Dhaka metro. Nationwide delivery takes 2–4 business days.',
      },
    ],
  },
  'orthopedic-supports': {
    quickAnswer:
      'Orthopedic supports in Bangladesh — knee braces, lumbar belts, cervical collars and splints — typically cost ৳500–৳8,000 from Tynor and similar DGDA-registered brands. MediportBD supplies orthopedic supports in Dhaka with free delivery over ৳50,000 and bulk pricing for hospitals.',
    faqs: [
      {
        q: 'How much do orthopedic supports cost in Bangladesh?',
        a: 'Orthopedic supports in Bangladesh cost ৳500–৳8,000 depending on the product — cervical collars and wrist supports at the lower end, knee braces and lumbar belts at the higher end.',
      },
      {
        q: 'Which orthopedic support brands are available in Bangladesh?',
        a: 'MediportBD supplies orthopedic supports from Tynor, a DGDA-registered brand known for quality braces, belts, collars and splints.',
      },
      {
        q: 'Do you offer bulk pricing on orthopedic supports for hospitals?',
        a: 'Yes. Hospitals and clinics get 8–30% bulk discounts on orthopedic supports with 30–90 day credit terms for B2B clients.',
      },
    ],
  },
  'diabetes-care': {
    quickAnswer:
      'Diabetes care products in Bangladesh — glucose meters (৳800–৳5,000) and test strips (৳700–৳2,000 per pack) — from Accu-Chek, Omnitest, Yuwell and PCL Care. All are DGDA registered. MediportBD supplies diabetes care products in Dhaka with same-day delivery and bulk B2B pricing.',
    faqs: [
      {
        q: 'How much does a glucose meter cost in Bangladesh?',
        a: 'Blood glucose meters in Bangladesh cost ৳800–৳5,000 depending on brand and features, with test strips typically ৳700–৳2,000 per pack of 25–50.',
      },
      {
        q: 'Which glucose meter brands are available in Bangladesh?',
        a: 'MediportBD supplies Accu-Chek, Omnitest, Yuwell, PCL Care and eBcare glucose meters and test strips, all DGDA registered.',
      },
      {
        q: 'Are diabetes test strips available in bulk in Bangladesh?',
        a: 'Yes. MediportBD offers bulk B2B pricing on glucose test strips for clinics, pharmacies and diabetes centres with regular supply contracts.',
      },
    ],
  },
  'medical-supplies': {
    quickAnswer:
      'Medical supplies in Bangladesh — anti-decubitus mattresses, medical tapes and general consumables — are available from DGDA-registered suppliers like MediportBD with nationwide delivery and bulk hospital pricing.',
    faqs: [
      {
        q: 'What medical supplies does MediportBD supply in Bangladesh?',
        a: 'MediportBD supplies anti-decubitus mattresses, medical tapes and general medical consumables from Rossmax, PCL Care and JMS, all DGDA registered.',
      },
      {
        q: 'Do you supply medical consumables in bulk to hospitals?',
        a: 'Yes. Hospitals and clinics receive 8–30% bulk discounts on medical supplies with 30–90 day credit terms for B2B clients.',
      },
    ],
  },
  'blood-bank-supplies': {
    quickAnswer:
      'Blood bank supplies in Bangladesh — blood collection bags, transfusion sets and CPDA bags from JMS — are DGDA registered and available with hospital B2B pricing from MediportBD in Dhaka.',
    faqs: [
      {
        q: 'What blood bank supplies are available in Bangladesh?',
        a: 'MediportBD supplies blood collection bags, triple blood bags, CPDA blood bags and transfusion sets from JMS, all DGDA registered.',
      },
      {
        q: 'Do you supply blood bags in bulk to blood banks?',
        a: 'Yes. Blood banks and hospitals get bulk B2B pricing with 30–90 day credit terms and regular supply contracts.',
      },
    ],
  },
  'iv-and-infusion-therapy': {
    quickAnswer:
      'IV and infusion therapy supplies in Bangladesh — IV cannulas (৳60–৳300 per unit) and infusion sets — from Vasofix, JMS and Romsons, all DGDA registered. MediportBD supplies IV therapy consumables in Dhaka with bulk hospital pricing.',
    faqs: [
      {
        q: 'How much do IV cannulas cost in Bangladesh?',
        a: 'IV cannulas in Bangladesh cost approximately ৳60–৳300 per unit depending on gauge and brand. Bulk hospital pricing reduces the per-unit cost significantly.',
      },
      {
        q: 'Which IV therapy brands are available in Bangladesh?',
        a: 'MediportBD supplies IV cannulas, infusion sets, scalp vein sets and central venous catheters from Vasofix, JMS and Romsons, all DGDA registered.',
      },
    ],
  },
  'respiratory-equipment': {
    quickAnswer:
      'Respiratory equipment in Bangladesh — nebulizers (৳2,500–৳25,000), suction units (৳6,000–৳60,000) and CPAP/BiPAP machines (৳40,000–৳200,000) — from Rossmax, Romsons, Yuwell and Beurer. MediportBD supplies CE-certified respiratory equipment in Dhaka with installation and B2B pricing.',
    faqs: [
      {
        q: 'How much does a nebulizer cost in Bangladesh?',
        a: 'Compressor nebulizers in Bangladesh cost ৳2,500–৳15,000 and ultrasonic nebulizers ৳5,000–৳25,000, depending on brand and features.',
      },
      {
        q: 'Do you supply CPAP machines in Bangladesh?',
        a: 'Yes. MediportBD supplies CPAP/BiPAP machines priced ৳40,000–৳200,000 from Rossmax and Yuwell with mask fitting support.',
      },
      {
        q: 'What respiratory brands are available in Bangladesh?',
        a: 'MediportBD supplies respiratory equipment from Rossmax, Romsons, Yuwell and Beurer, all CE certified and DGDA registered.',
      },
    ],
  },
  'physiotherapy-and-rehabilitation': {
    quickAnswer:
      'Physiotherapy equipment in Bangladesh — TENS devices (৳1,500–৳15,000), heating pads and infrared lamps — from Jumper, Rossmax and Beurer. MediportBD supplies physiotherapy and rehabilitation equipment in Dhaka with nationwide delivery.',
    faqs: [
      {
        q: 'How much does a TENS machine cost in Bangladesh?',
        a: 'TENS therapy devices in Bangladesh cost ৳1,500–৳15,000 depending on channels, programs and brand.',
      },
      {
        q: 'What physiotherapy equipment is available in Bangladesh?',
        a: 'MediportBD supplies TENS devices, heating pads, infrared lamps and rehabilitation aids from Jumper, Rossmax and Beurer.',
      },
    ],
  },
  'ophthalmology-and-ent-equipment': {
    quickAnswer:
      'Ophthalmology and ENT equipment in Bangladesh — ophthalmoscopes, otoscopes and retinoscopes — from Heine and Beurer, DGDA registered. MediportBD supplies diagnostic eye and ENT instruments in Dhaka with fast delivery.',
    faqs: [
      {
        q: 'What ophthalmology equipment is available in Bangladesh?',
        a: 'MediportBD supplies ophthalmoscopes, retinoscopes, otoscopes and hearing amplifiers from Heine and Beurer, all genuine and DGDA registered.',
      },
      {
        q: 'Do you supply ENT equipment for clinics in Bangladesh?',
        a: 'Yes. MediportBD supplies ENT diagnostic equipment to clinics and hospitals with B2B pricing and nationwide delivery.',
      },
    ],
  },
  'compression-garments': {
    quickAnswer:
      'Compression garments in Bangladesh — DVT and anti-embolism stockings from Tynor — are available with bulk hospital pricing from MediportBD, a DGDA-registered supplier in Dhaka.',
    faqs: [
      {
        q: 'What compression garments are available in Bangladesh?',
        a: 'MediportBD supplies DVT stockings and anti-embolism stockings from Tynor for post-surgical and hospital use.',
      },
      {
        q: 'Do you supply compression stockings in bulk to hospitals?',
        a: 'Yes. Hospitals receive bulk B2B pricing on compression garments with credit terms for institutional clients.',
      },
    ],
  },
  'consumables': {
    quickAnswer:
      'Medical consumables in Bangladesh — needles, syringes, catheters, urinary bags and filters — from Romsons and B.Braun, all DGDA registered. MediportBD supplies consumables in Dhaka with same-day delivery and bulk hospital pricing.',
    faqs: [
      {
        q: 'What medical consumables does MediportBD supply in Bangladesh?',
        a: 'MediportBD supplies spinal needles, catheters, urinary bags, stop cocks, HME filters and adult diapers from Romsons and B.Braun, all DGDA registered.',
      },
      {
        q: 'Can I get bulk pricing on medical consumables?',
        a: 'Yes. Hospitals, clinics and pharmacies get 8–30% bulk discounts on consumables with 30–90 day credit terms for B2B clients.',
      },
    ],
  },
  'surgical-and-wound-care': {
    quickAnswer:
      'Surgical and wound care supplies in Bangladesh — ostomy bags, wound dressings, surgical tapes and drain kits — from ConvaTec, B.Braun and JMS, all DGDA registered. MediportBD supplies wound care products in Dhaka with bulk hospital pricing and nationwide delivery.',
    faqs: [
      {
        q: 'What wound care products are available in Bangladesh?',
        a: 'MediportBD supplies ostomy bags, colostomy sets, wound dressings, surgical tapes and drain kits from ConvaTec, B.Braun and JMS, all DGDA registered.',
      },
      {
        q: 'Do you supply wound care products in bulk to hospitals?',
        a: 'Yes. Hospitals and surgical centres receive 8–30% bulk discounts on surgical and wound care supplies with 30–90 day credit terms for B2B clients.',
      },
      {
        q: 'How fast is wound care delivery in Dhaka?',
        a: 'Orders placed before 12 PM are delivered same-day within Dhaka metro. Nationwide delivery to other divisions takes 2–4 business days.',
      },
    ],
  },
  'medical-devices': {
    quickAnswer:
      'Medical devices in Bangladesh — body composition analyzers, patient monitors and monitoring equipment — from CE-certified global brands, all DGDA registered. MediportBD supplies medical devices in Dhaka with installation, staff training and B2B institutional pricing.',
    faqs: [
      {
        q: 'What medical devices does MediportBD supply in Bangladesh?',
        a: 'MediportBD supplies body composition analyzers, monitoring equipment and diagnostic devices from leading global brands, all CE certified and DGDA registered.',
      },
      {
        q: 'Do you install and train staff on medical devices in Bangladesh?',
        a: 'Yes. MediportBD provides free installation and staff training for medical devices in the Dhaka metro area, with nationwide installation available for institutional orders.',
      },
      {
        q: 'Are medical devices in Bangladesh DGDA registered?',
        a: 'Yes. Medical devices sold in Bangladesh must be DGDA registered. All devices supplied by MediportBD carry valid DGDA registration, with certificates available on request.',
      },
    ],
  },
  'mobility-aids': {
    quickAnswer:
      'Mobility aids in Bangladesh — wheelchairs (৳8,000–৳60,000), walkers and crutches — from quality DGDA-registered brands. MediportBD supplies mobility aids in Dhaka with free delivery over ৳50,000 and B2B pricing for hospitals and rehabilitation centres.',
    faqs: [
      {
        q: 'How much does a wheelchair cost in Bangladesh?',
        a: 'Wheelchairs in Bangladesh cost ৳8,000–৳60,000 depending on type (standard, commode, sports) and build quality. Walkers and crutches are available from ৳1,500.',
      },
      {
        q: 'Do you supply mobility aids in bulk to hospitals?',
        a: 'Yes. Hospitals and rehabilitation centres get 8–30% bulk discounts on mobility aids with 30–90 day credit terms for B2B clients.',
      },
      {
        q: 'What mobility aid brands are available in Bangladesh?',
        a: 'MediportBD supplies wheelchairs, walkers, crutches and mobility equipment from quality DGDA-registered brands with genuine warranties.',
      },
    ],
  },
  'diagnostic-devices': {
    quickAnswer:
      'Diagnostic devices in Bangladesh — blood glucose meters and patient monitoring devices — from Accu-Chek and other leading brands, all DGDA registered. MediportBD supplies diagnostic devices in Dhaka with same-day delivery and bulk clinic pricing.',
    faqs: [
      {
        q: 'What diagnostic devices are available in Bangladesh?',
        a: 'MediportBD supplies blood glucose meters, monitoring devices and related diagnostics from Accu-Chek and other leading brands, all DGDA registered.',
      },
      {
        q: 'Do you offer bulk pricing on diagnostic devices for clinics?',
        a: 'Yes. Clinics, diagnostic centres and health programmes get 8–30% bulk discounts on diagnostic devices with 30–90 day credit terms for B2B clients.',
      },
      {
        q: 'Are glucose meters and test strips DGDA registered?',
        a: 'Yes. All glucose meters and test strips supplied by MediportBD are DGDA registered and compliant with Bangladesh medical device regulations.',
      },
    ],
  },
};

/**
 * Per-category FAQPage schema content keyed by slug.
 */
export function getCategoryFaqs(slug) {
  return CATEGORY_GEO[slug]?.faqs || [];
}

/**
 * Quick Answer box content keyed by slug.
 */
export function getCategoryQuickAnswer(slug) {
  return CATEGORY_GEO[slug]?.quickAnswer || '';
}
