/**
 * Brand-level GEO content for MediportBD
 *
 * Answer-first Quick Answer text + FAQPage schema content per brand slug.
 * Targets "[brand] price in Bangladesh" and brand-research queries that AI
 * engines (ChatGPT, Perplexity, Google AI Overviews) answer directly.
 * Content must stay accurate - update as the product range changes.
 */

const FALLBACK_FAQS = [
  {
    q: 'Are {brand} products in Bangladesh genuine and DGDA registered?',
    a: 'Yes. All {brand} products sold by MediportBD are sourced through authorised channels, are DGDA registered where regulation applies, and come with manufacturer warranty documentation available on request.',
  },
  {
    q: 'How much do {brand} products cost in Bangladesh?',
    a: 'Prices vary by model and specification. MediportBD publishes prices online where possible and provides written quotations for institutional buyers, with B2B bulk discounts of 8-30% and credit terms of 30-90 days.',
  },
];

const BRAND_GEO = {
  mindray: {
    quickAnswer:
      'Mindray is one of the world\u2019s largest medical device manufacturers, and its ultrasound systems, patient monitors and laboratory analysers are widely used in Bangladeshi hospitals and diagnostic centres. MediportBD supplies Mindray equipment in Bangladesh \u2014 including DC-40, DC-30 and DC-N2 colour doppler ultrasound systems and DC-60 Exp models \u2014 with installation, staff training, warranty support and B2B pricing. Machine pricing is quotation-based as configuration (probes, software options, printer) drives the final price.',
    faqs: [
      {
        q: 'What is the Mindray DC-40 price in Bangladesh?',
        a: 'The Mindray DC-40 4D colour doppler ultrasound machine is quotation-priced in Bangladesh because probes, transducer configuration and software options change the final price significantly. MediportBD provides written quotations with installation and training included for hospitals, clinics and diagnostic centres nationwide.',
      },
      {
        q: 'Which Mindray products does MediportBD supply in Bangladesh?',
        a: 'MediportBD stocks Mindray colour doppler ultrasound systems \u2014 including the DC-40, DC-30, DC-N2 and DC-60 Exp \u2014 along with Mindray patient monitors and laboratory analysers, all supplied with DGDA documentation, warranty and local technical support.',
      },
      {
        q: 'Does Mindray ultrasound equipment include installation and training in Bangladesh?',
        a: 'Yes. MediportBD includes on-site installation and user training with Mindray ultrasound systems, plus after-sales service and spare-parts support from Dhaka. Nationwide delivery covers all divisions within 2-4 business days.',
      },
      {
        q: 'Is Mindray a good brand for diagnostic centres in Bangladesh?',
        a: 'Mindray is one of the most widely installed brands in Bangladeshi diagnostic centres thanks to strong image quality per taka, reliable service networks and readily available probes and spare parts. It is a safe long-term choice for 4D obstetric scanning and general imaging.',
      },
    ],
  },
  jms: {
    quickAnswer:
      'JMS (Japan Medical Supply) is a leading Japanese manufacturer of single-use medical consumables \u2014 infusion sets, syringes, IV cannulas and blood bags \u2014 trusted by hospitals across Bangladesh. MediportBD supplies genuine JMS infusion sets, triple blood bags and related disposables with DGDA registration, batch traceability and bulk hospital pricing.',
    faqs: [
      {
        q: 'What is the JMS infusion set price in Bangladesh?',
        a: 'JMS infusion sets in Bangladesh typically retail at a small premium over generic sets, reflecting their Japanese manufacturing quality control. MediportBD lists current pricing online and offers bulk carton pricing for hospitals \u2014 B2B discounts of 8-30% apply on volume orders.',
      },
      {
        q: 'What is the blood bag price in Bangladesh hospitals?',
        a: 'Blood bag pricing in Bangladesh depends on capacity (single, double, triple or quadruple bags) and anticoagulant volume. JMS triple blood bags supplied by MediportBD are DGDA registered with batch traceability; hospitals receive dedicated B2B pricing on standing orders.',
      },
      {
        q: 'Are JMS products in Bangladesh authentic?',
        a: 'MediportBD sources JMS products through authorised supply channels with import documentation and batch traceability. Counterfeit disposables are a real risk in the market \u2014 always ask your supplier for batch documents and DGDA registration.',
      },
      {
        q: 'Which JMS products are available from MediportBD?',
        a: 'Current stock includes the JMS infusion set and JMS triple blood bags, with syringes, IV cannulas and other JMS consumables available on order. Institutional buyers can request a standing supply agreement.',
      },
    ],
  },
  gpl: {
    quickAnswer:
      'GPL clinical chemistry reagents \u2014 including the GPL Calcium OCPC kit \u2014 are used by diagnostic laboratories across Bangladesh for biochemistry analysis on automated analysers. MediportBD supplies GPL reagents with cold-chain handling, batch traceability and DGDA documentation, with standing-order contracts and bulk pricing for laboratories.',
    faqs: [
      {
        q: 'What is GPL Calcium OCPC reagent used for?',
        a: 'The GPL Calcium OCPC reagent kit quantifies total calcium in serum or plasma using the o-cresolphthalein complexone method on automated biochemistry analysers \u2014 a routine test for calcium metabolism disorders, kidney disease and bone health monitoring.',
      },
      {
        q: 'Where can I buy GPL reagents in Bangladesh?',
        a: 'MediportBD supplies GPL reagents to laboratories across Bangladesh with cold-chain delivery, batch traceability documents and consistent lot supply for analyser calibration continuity.',
      },
      {
        q: 'Do you offer standing orders for GPL reagents?',
        a: 'Yes. Laboratories can set up monthly or quarterly standing orders with locked-in B2B pricing, priority dispatch and cold-chain transport to keep analyser runs uninterrupted.',
      },
    ],
  },
  finecare: {
    quickAnswer:
      'Finecare is a fluorescence immunoassay (FIA) platform widely used by Bangladeshi pharmacies, clinics and point-of-care labs for rapid quantitative tests \u2014 TSH, T3, T4, Vitamin D, Vitamin B12, HbA1c, troponin, Dengue NS1 and more. MediportBD supplies Finecare FIA meters and test kits in Bangladesh with cold-chain delivery, DGDA documentation and bulk B2B pricing.',
    faqs: [
      {
        q: 'What tests does the Finecare FIA system cover?',
        a: 'Finecare FIA systems cover thyroid panels (TSH, T3, T4, FT3), vitamins (D, B12), HbA1c, cardiac markers (troponin), inflammation markers and infectious disease rapid tests such as Dengue NS1 \u2014 all quantitative results within minutes at the point of care.',
      },
      {
        q: 'Where can I buy Finecare test kits in Bangladesh?',
        a: 'MediportBD supplies Finecare FIA meters and test kits nationwide with temperature-monitored delivery, batch traceability and standing-order options for pharmacies and clinics.',
      },
      {
        q: 'Is the Finecare system suitable for pharmacy point-of-care testing?',
        a: 'Yes. Finecare meters are designed for point-of-care settings: small footprint, simple operation and minute-scale results \u2014 which is why they are popular with Bangladeshi pharmacies and small diagnostic centres.',
      },
    ],
  },
  romsons: {
    quickAnswer:
      'Romsons is a major Indian manufacturer of disposable medical devices \u2014 IV cannulas, infusion sets, urinary catheters and drainage bags, suction catheters, nebulizer kits and spinal needles \u2014 widely stocked by Bangladeshi hospitals. MediportBD supplies Romsons consumables with DGDA registration, batch traceability and bulk hospital pricing.',
    faqs: [
      {
        q: 'Which Romsons products are available in Bangladesh?',
        a: 'MediportBD stocks Romsons IV and infusion therapy items, urinary drainage solutions, respiratory accessories and consumables, with additional catalogue items available on order for institutional buyers.',
      },
      {
        q: 'Are Romsons products DGDA approved in Bangladesh?',
        a: 'Yes. Romsons disposables supplied by MediportBD carry DGDA registration and CE certification, with import and batch documentation available on request.',
      },
      {
        q: 'Can hospitals get bulk pricing on Romsons consumables?',
        a: 'Yes. Standing orders and bulk purchases qualify for MediportBD B2B pricing \u2014 8-30% discounts with 30-90 day credit terms and a dedicated account manager.',
      },
    ],
  },
};

function slugifyBrand(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Resolve GEO content for a brand. Matches on slug first, then normalised
 * name, so DB slug variations still hit the right entry.
 */
export function getBrandGeo(slug, name) {
  if (!slug && !name) return null;
  const key = String(slug || '').toLowerCase();
  if (BRAND_GEO[key]) return BRAND_GEO[key];
  const nameKey = slugifyBrand(name);
  return BRAND_GEO[nameKey] || null;
}

/** Fill {brand} placeholders in fallback FAQs */
export function getBrandFaqs(slug, name) {
  const geo = getBrandGeo(slug, name);
  const brandName = name || 'medical';
  if (geo) return geo.faqs;
  return FALLBACK_FAQS.map((f) => ({
    q: f.q.replace(/\{brand\}/g, brandName),
    a: f.a.replace(/\{brand\}/g, brandName),
  }));
}

export function getBrandQuickAnswer(slug, name) {
  const geo = getBrandGeo(slug, name);
  return geo ? geo.quickAnswer : null;
}
