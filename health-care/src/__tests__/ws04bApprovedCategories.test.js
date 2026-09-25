/**
 * WS-04B.2 (Phase 3C.5) — approved category registration tests.
 *
 * The owner approved Massager (slug `massager`, 6 products) and Baby & Mom Care
 * (slug `baby-and-mom-care`, 2 products) as public categories. These tests pin
 * the registry/SEO/GEO wiring, the automatic sitemap publication, the
 * CollectionPage ItemList contract for the real catalogue rows, and the
 * invariants that must NOT change (existing 20 mappings, mobility-aids,
 * unregistered Physiotherapy Equipment, no invented cross-links).
 */

class ResponseStub {
  constructor(body) {
    this._body = body;
  }
  async text() {
    return this._body;
  }
}
if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = ResponseStub;
}

import { CATEGORY_SLUG_MAP, CATEGORY_NAME_TO_SLUG } from '@/constants/categories';
import { CATEGORY_SEO } from '@/config/seo';
import { CATEGORY_GEO, getCategoryFaqs, getCategoryQuickAnswer } from '@/config/categoryGEO';
import { getCategoryCrossLinks } from '@/config/categoryCrossLinks';
import { buildItemListElements } from '@/components/seo/CollectionPageSchema';

// Real catalogue rows (verified against the production API in Phase 3C.5).
const massagerProducts = [
  { name: 'Smart Scalp Massager with Red Light', slug: 'nittonova-smart-scalp-massager-with-red-light', price: 700, stock: 10 },
  { name: 'Five Headed Fascia Gun Massage DH-780 | 9 Multi-Head Attachment', slug: 'nittonova-five-headed-fascia-gun-dh-780-9-multi-head-attachment', price: 1100, stock: 10 },
  { name: 'Bionic Neck & Shoulder Massager with Fingers', slug: 'nittonova-bionic-neck-shoulder-massager-with-fingers', price: 1650, stock: 10 },
  { name: 'Mini Massager Gun 4 Head', slug: 'gowell-mini-massage-gun-4-head', price: 899, stock: 40 },
  { name: 'Blueidea Neck Massager Pillow BLD118', slug: 'gowell-blueidea-neck-massager-pillow-bld118', price: 1350, stock: 30 },
  { name: 'Air Pressure Portable Calf Massager JH-M03', slug: 'air-pressure-portable-calf-massager-jh-m03', price: 1450, stock: 9 },
];

const babyProducts = [
  { name: 'Baby Weighing Scale Digital-HF-301', slug: 'baby-weighing-scale-digital-hf-301', price: 4000, stock: 50 },
  { name: 'IRISH Baby Pad Premium Quality M (60 x 60 cm) 20 Pcs', slug: 'irish-baby-pad-premium-quality-m-60-x-60cm-20-pcs', price: 1400, stock: 50 },
];

// The 20 mappings that existed before this phase (must be untouched).
const PRE_EXISTING_MAPPINGS = {
  'diagnostic-equipment': 'Diagnostic Equipment',
  'surgical-instruments': 'Surgical Instruments',
  'laboratory-reagents': 'Laboratory Reagents',
  'laboratory-equipment': 'Laboratory Equipment',
  'hospital-machines': 'Hospital Machines',
  'ppe-and-safety': 'PPE & Safety',
  'orthopedic-supports': 'Orthopedic Supports',
  'surgical-and-wound-care': 'Surgical & Wound Care',
  'consumables': 'Consumables',
  'diabetes-care': 'Diabetes Care',
  'ophthalmology-and-ent-equipment': 'Ophthalmology & ENT Equipment',
  'iv-and-infusion-therapy': 'IV & Infusion Therapy',
  'physiotherapy-and-rehabilitation': 'Physiotherapy & Rehabilitation',
  'medical-supplies': 'Medical Supplies',
  'blood-bank-supplies': 'Blood Bank Supplies',
  'respiratory-equipment': 'Respiratory Equipment',
  'medical-devices': 'Medical Devices',
  'compression-garments': 'Compression Garments',
  'diagnostic-devices': 'Diagnostic Devices',
  'mobility-aids': 'Mobility Aids',
};

describe('WS-04B.2 — category registry', () => {
  it('1. maps Massager to the exact database slug', () => {
    expect(CATEGORY_SLUG_MAP['massager']).toBe('Massager');
  });

  it('2. maps Baby & Mom Care to the exact database slug', () => {
    expect(CATEGORY_SLUG_MAP['baby-and-mom-care']).toBe('Baby & Mom Care');
  });

  it('3. CATEGORY_NAME_TO_SLUG derives both new mappings automatically', () => {
    expect(CATEGORY_NAME_TO_SLUG['Massager']).toBe('massager');
    expect(CATEGORY_NAME_TO_SLUG['Baby & Mom Care']).toBe('baby-and-mom-care');
  });

  it('4/5. both approved slugs resolve through the existing dynamic route gate', () => {
    // The route calls notFound() only when CATEGORY_SLUG_MAP[slug] is falsy.
    for (const slug of ['massager', 'baby-and-mom-care']) {
      expect(typeof CATEGORY_SLUG_MAP[slug]).toBe('string');
      expect(CATEGORY_SLUG_MAP[slug].length).toBeGreaterThan(0);
    }
  });

  it('16. no duplicate slugs or names in the registry', () => {
    const slugs = Object.keys(CATEGORY_SLUG_MAP);
    expect(slugs.length).toBe(new Set(slugs).size);
    const names = Object.values(CATEGORY_SLUG_MAP);
    expect(names.length).toBe(new Set(names).size);
  });

  it('17. the 20 pre-existing category mappings are unchanged', () => {
    for (const [slug, name] of Object.entries(PRE_EXISTING_MAPPINGS)) {
      expect(CATEGORY_SLUG_MAP[slug]).toBe(name);
    }
    // exactly the 20 pre-existing mappings plus the 2 approved additions
    expect(Object.keys(CATEGORY_SLUG_MAP).sort()).toEqual(
      [...Object.keys(PRE_EXISTING_MAPPINGS), 'massager', 'baby-and-mom-care'].sort()
    );
  });

  it('18. mobility-aids is unchanged', () => {
    expect(CATEGORY_SLUG_MAP['mobility-aids']).toBe('Mobility Aids');
    expect(CATEGORY_NAME_TO_SLUG['Mobility Aids']).toBe('mobility-aids');
  });

  it('19. Physiotherapy Equipment remains unregistered', () => {
    expect(CATEGORY_SLUG_MAP['physiotherapy-equipment']).toBeUndefined();
    expect(CATEGORY_NAME_TO_SLUG['Physiotherapy Equipment']).toBeUndefined();
  });
});

describe('WS-04B.2 — SEO metadata', () => {
  it('7. CATEGORY_SEO has a complete entry for both approved categories', () => {
    for (const name of ['Massager', 'Baby & Mom Care']) {
      const seo = CATEGORY_SEO[name];
      expect(seo).toBeDefined();
      expect(typeof seo.title).toBe('string');
      expect(typeof seo.description).toBe('string');
      expect(typeof seo.h1).toBe('string');
      expect(seo.title.trim().length).toBeGreaterThan(0);
      expect(seo.description.trim().length).toBeGreaterThan(0);
      expect(seo.h1.trim().length).toBeGreaterThan(0);
      expect(seo.title).toMatch(/Bangladesh/);
      expect(seo.h1).toMatch(/Bangladesh/);
    }
  });

  it('7b. titles and descriptions stay unique across the registry', () => {
    const entries = Object.values(CATEGORY_SEO);
    expect(entries).toHaveLength(22);
    const titles = entries.map((e) => e.title);
    const descriptions = entries.map((e) => e.description);
    expect(titles.length).toBe(new Set(titles).size);
    expect(descriptions.length).toBe(new Set(descriptions).size);
  });

  it('7c. new category copy makes no unsupported regulatory or treatment claim', () => {
    const combined = [
      CATEGORY_SEO['Massager'].title, CATEGORY_SEO['Massager'].description,
      CATEGORY_SEO['Baby & Mom Care'].title, CATEGORY_SEO['Baby & Mom Care'].description,
    ].join(' ');
    expect(combined).not.toMatch(/DGDA/i);
    expect(combined).not.toMatch(/CE[- ]?certified|certified|cures?|treats?|treatment/i);
    expect(combined).not.toMatch(/\b\d{2,}\+?\s*(products|brands|customers|clients|hospitals)/i);
  });
});

describe('WS-04B.2 — GEO configuration', () => {
  it('8. both slugs have a quick answer and FAQs', () => {
    for (const slug of ['massager', 'baby-and-mom-care']) {
      expect(CATEGORY_GEO[slug]).toBeDefined();
      expect(typeof getCategoryQuickAnswer(slug)).toBe('string');
      expect(getCategoryQuickAnswer(slug).trim().length).toBeGreaterThan(50);
      const faqs = getCategoryFaqs(slug);
      expect(faqs.length).toBeGreaterThanOrEqual(3);
      faqs.forEach((faq) => {
        expect(typeof faq.q).toBe('string');
        expect(typeof faq.a).toBe('string');
        expect(faq.q.trim().length).toBeGreaterThan(0);
        expect(faq.a.trim().length).toBeGreaterThan(0);
      });
    }
  });

  it('8b. GEO copy makes no treatment claim, invented price or invented statistic', () => {
    for (const slug of ['massager', 'baby-and-mom-care']) {
      const text = JSON.stringify(CATEGORY_GEO[slug]);
      // therapeutic CLAIMS are forbidden; the explicit disclaimer wording
      // ("not medical treatment devices") is intentionally allowed.
      expect(text).not.toMatch(/\b(cures|treats|heals|clinically proven|guaranteed)\b/i);
      expect(text).not.toMatch(/৳|BDT|Tk\b/);
      expect(text).not.toMatch(/\b\d{2,}\+?\s*(customers|clients|hospitals|labs)/i);
    }
  });

  it('20. no cross-link targets were invented for the new categories', () => {
    for (const slug of ['massager', 'baby-and-mom-care']) {
      const links = getCategoryCrossLinks(slug);
      expect(links.topics).toEqual([]);
      expect(links.equipment).toEqual([]);
    }
  });
});

describe('WS-04B.2 — sitemap publication', () => {
  let locs;

  beforeAll(async () => {
    // The route fetches the API for lastmod values; make it fail fast so the
    // CATEGORY_SLUG_MAP fallback (the authoritative URL set) is exercised.
    global.fetch = jest.fn(() => Promise.reject(new Error('offline in tests')));
    const { GET } = await import('@/app/sitemap-categories.xml/route');
    const res = await GET();
    const xml = await res.text();
    locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  });

  it('6. publishes exactly 22 category URLs including both approved categories', () => {
    expect(locs).toHaveLength(22);
    expect(locs).toContain('https://www.mediportbd.com/products/category/massager');
    expect(locs).toContain('https://www.mediportbd.com/products/category/baby-and-mom-care');
  });

  it('6b. no duplicate URLs and every loc is a category destination', () => {
    expect(locs.length).toBe(new Set(locs).size);
    locs.forEach((loc) => {
      expect(loc).toMatch(/^https:\/\/www\.mediportbd\.com\/products\/category\/[a-z0-9-]+$/);
    });
  });
});

describe('WS-04B.2 — CollectionPage ItemList contract for the approved categories', () => {
  it('12. ItemList contains exactly the 6 rendered Massager products', () => {
    const elements = buildItemListElements(massagerProducts);
    expect(elements).toHaveLength(6);
    expect(elements.map((e) => e.position)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('13. ItemList contains exactly the 2 rendered Baby & Mom Care products', () => {
    const elements = buildItemListElements(babyProducts);
    expect(elements).toHaveLength(2);
    expect(elements.map((e) => e.position)).toEqual([1, 2]);
  });

  it('14. ItemList URLs are canonical product URLs', () => {
    for (const product of [...massagerProducts, ...babyProducts]) {
      const [element] = buildItemListElements([product]);
      expect(element.item.url).toBe(`https://www.mediportbd.com/products/${product.slug}`);
      expect(element.item.url).not.toContain('?category=');
      expect(element.item.url).not.toMatch(/\/products\/[0-9a-f]{24}$/);
    }
  });

  it('14b. no duplicate product URLs inside either list', () => {
    for (const list of [massagerProducts, babyProducts]) {
      const urls = buildItemListElements(list).map((e) => e.item.url);
      expect(urls.length).toBe(new Set(urls).size);
    }
  });

  it('15. Offer invariant: positive prices only, never price 0', () => {
    const elements = buildItemListElements([...massagerProducts, ...babyProducts]);
    elements.forEach((element) => {
      // all 8 catalogue rows are priced, so every entry carries a valid Offer
      expect(element.item.offers).toBeDefined();
      expect(Number(element.item.offers.price)).toBeGreaterThan(0);
      expect(element.item.offers.priceCurrency).toBe('BDT');
    });
    const quoteOnly = buildItemListElements([{ name: 'Quote Only', slug: 'quote-only', price: 0 }]);
    expect(quoteOnly[0].item).not.toHaveProperty('offers');
    expect(JSON.stringify(elements)).not.toMatch(/"price":"?0(\.0+)?"?/);
  });

  it('9/10/11. category links resolve to clean routes — no query-string fallback', () => {
    for (const [name, slug] of [['Massager', 'massager'], ['Baby & Mom Care', 'baby-and-mom-care']]) {
      const resolved = CATEGORY_NAME_TO_SLUG[name];
      expect(resolved).toBe(slug);
      const href = `/products/category/${resolved}`;
      expect(href).not.toContain('?category=');
      expect(href).not.toContain('%20');
    }
  });
});
