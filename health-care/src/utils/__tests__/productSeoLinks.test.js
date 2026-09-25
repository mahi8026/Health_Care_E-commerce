/**
 * WS-03 — product → SEO-cluster link resolver tests (Phase 3B.2).
 *
 * Rules under test (from the Phase 3B.1 forensic audit):
 *  1. exact product-type/equipment relationship (registry-derived keys)
 *  2. exact topic relationship (via cluster membership of matched equipment)
 *  3. deterministic output for multiple relationships
 *  4. duplicate destinations removed
 *  5. self links removed
 *  6. invalid/unregistered targets removed
 *  7. broad category membership alone NEVER creates cluster links
 *  8. legitimate zero-link products return no cluster links
 *  9. Massager product invents no cluster route (WS-04B.2: the category is now
 *     registered, but the resolver never derives cluster links from category
 *     membership — only from registered equipment/topic/guide relationships)
 * 10. Baby & Mom Care product invents no cluster route (same rule)
 *
 * Fixtures are real catalogue products (slug/name/brand verified against the
 * production API) and registries are the real repository registries.
 */

import { resolveProductSeoLinks, sanitizeDestinations } from '../productSeoLinks';
import { LANDING_PAGES } from '@/config/landingPages';
import { TOPICAL_CLUSTERS } from '@/config/topicalClusters';
import { GUIDES } from '@/config/guides';

// Real catalogue fixtures (verified against the production API)
const gowellNebulizer = {
  name: 'Small Mesh Nebulizer',
  slug: 'gowell-small-mesh-nebulizer',
  brand: { name: 'Generic', slug: 'generic' },
  category: { name: 'Respiratory Equipment', slug: 'respiratory-equipment' },
  price: 1100,
};

const contecPulseOximeter = {
  name: 'CONTEC CMS50D1 New Fingertip Pulse Oximeter',
  slug: 'contec-cms50d1-new-fingertip-pulse-oximeter-1',
  brand: { name: 'CONTEC', slug: 'contec' },
  category: { name: 'Diagnostic Devices', slug: 'diagnostic-devices' },
  price: 1900,
};

const vigorBpMonitor = {
  name: 'Vigor Automatic Blood Pressure Monitor VIGER 03',
  slug: 'vigor-automatic-blood-pressure-monitor-vigor-03',
  brand: { name: 'Vigor', slug: 'vigor' },
  category: { name: 'Diagnostic Equipment', slug: 'diagnostic-equipment' },
  price: 2700,
};

const comenPatientMonitor = {
  name: 'Comen Star 8000F Multi-Parameter Patient Monitor',
  slug: 'comen-star-8000f-multi-parameter-patient-monitor',
  brand: { name: 'Comen', slug: 'comen' },
  category: { name: 'Hospital Machines', slug: 'hospital-machines' },
};

const yamasuSphyg = {
  name: 'Yamasu Aneroid Sphygmomanometer with Stethoscope (Made in Japan)',
  slug: 'yamasu-aneroid-sphygmomanometer-with-stethoscope-made-in-japan',
  brand: { name: 'Yamasu', slug: 'yamasu' },
  category: { name: 'Diagnostic Equipment', slug: 'diagnostic-equipment' },
  price: 3100,
};

const faceMaskPpe = {
  name: 'Face Mask Surgical 3 Layers with Nose Pin 50s Pack IRISH',
  slug: 'face-mask-surgical-3-layers-with-nose-pin-50s-pack-irish',
  brand: { name: 'IRISH', slug: 'irish' },
  category: { name: 'PPE & Safety', slug: 'ppe-and-safety' },
  price: 255,
};

const infraredLamp = {
  name: 'Infrared Heating Lamp Heat Lamp IRR Lamp 150 Watt IRISH',
  slug: 'infrared-heating-lamp-heat-lamp-irr-lamp-150-watt-with-regulator-irish',
  brand: { name: 'IRISH', slug: 'irish' },
  category: { name: 'Physiotherapy & Rehabilitation', slug: 'physiotherapy-and-rehabilitation' },
  price: 3500,
};

const tynorDvt = {
  name: 'Tynor DVT Stocking Pair',
  slug: 'tynor-dvt-stocking-pair',
  brand: { name: 'Tynor', slug: 'tynor' },
  category: { name: 'Compression Garments', slug: 'compression-garments' },
  price: 2150,
};

const jmiScalpVeinSet = {
  name: 'JMI Scalp Vein Set 21G Single',
  slug: 'jmi-scalp-vein-set-21g-single',
  category: { name: 'IV & Infusion Therapy', slug: 'iv-and-infusion-therapy' },
  price: 10,
};

const secureK3Edta = {
  name: 'SECURE K3EDTA Vacuum Blood Collection Tube 5ml',
  slug: 'secure-k3edta-vacuum-blood-collection-tube-5ml',
  brand: { name: 'Secure', slug: 'secure' },
  category: { name: 'Laboratory Reagents', slug: 'laboratory-reagents' },
  price: 0, // quote-only
};

const stel3Analyzer = {
  name: 'Cromatest / Linear STEL 3 Hematology Analyzer',
  slug: 'stel-3-hematology-analyzer',
  brand: { name: 'Cromatest / Linear', slug: 'cromatest-linear' },
  category: { name: 'Laboratory Equipment', slug: 'laboratory-equipment' },
  price: undefined, // quote-only
};

const nittonovaMassager = {
  name: 'Smart Scalp Massager with Red Light',
  slug: 'nittonova-smart-scalp-massager-with-red-light',
  brand: { name: 'Generic', slug: 'generic' },
  category: { name: 'Massager', slug: 'massager' },
  price: 700,
};

const babyWeighingScale = {
  name: 'Baby Weighing Scale Digital HF 301',
  slug: 'baby-weighing-scale-digital-hf-301',
  brand: { name: 'IRISH', slug: 'irish' },
  category: { name: 'Baby & Mom Care', slug: 'baby-and-mom-care' },
  price: 4000,
};

const hc5dClean = {
  name: 'HC-5D Clean',
  slug: 'hc-5d-clean',
  brand: { name: 'Human', slug: 'human' },
  category: { name: 'Laboratory Reagents', slug: 'laboratory-reagents' },
  price: 100,
};

const registeredEquipment = new Set(LANDING_PAGES.map((p) => `/equipment/${p.slug}`));
const registeredTopics = new Set(TOPICAL_CLUSTERS.map((c) => `/topics/${c.slug}`));
const registeredGuides = new Set(GUIDES.map((g) => `/guides/${g.slug}`));

const urls = (list) => list.map((d) => d.url);

describe('resolveProductSeoLinks', () => {
  it('1. exact equipment relationship produces the correct registered equipment link', () => {
    const res = resolveProductSeoLinks(gowellNebulizer);
    expect(urls(res.equipment)).toEqual(['/equipment/nebulizer-price-bangladesh']);
    // nebulizer is not a member of any topic cluster -> no topic/guide links
    expect(res.topics).toEqual([]);
    expect(res.guides).toEqual([]);
    const landing = LANDING_PAGES.find((p) => p.slug === 'nebulizer-price-bangladesh');
    const expectedLabel = String(landing.title).replace(/\s*\|\s*MediportBD\s*$/i, '').trim();
    expect(res.equipment[0].label).toBe(expectedLabel);
  });

  it('2. exact topic relationship is derived from cluster membership of the matched equipment', () => {
    const res = resolveProductSeoLinks(contecPulseOximeter);
    expect(urls(res.equipment)).toEqual(['/equipment/pulse-oximeter-price-bangladesh']);
    expect(urls(res.topics)).toEqual(['/topics/blood-pressure-monitors']);
    expect(urls(res.guides)).toEqual(['/guides/bp-monitor-buying-guide-bangladesh']);
    expect(res.brand).toEqual({ url: '/brands/contec', label: 'CONTEC' });
  });

  it('3. multiple valid relationships are deterministic (stable order across calls)', () => {
    const a = resolveProductSeoLinks(comenPatientMonitor);
    const b = resolveProductSeoLinks(comenPatientMonitor);
    expect(a).toEqual(b);
    expect(urls(a.equipment)).toEqual(['/equipment/patient-monitor-price-bangladesh']);
    // patient-monitor is an explicit member of two clusters -> both are registry-explicit
    expect(urls(a.topics)).toEqual(['/topics/ecg-machines', '/topics/hospital-icu-equipment']);
    expect(a.guides.length).toBeLessThanOrEqual(2);
    expect(urls(a.guides)).toEqual(['/guides/ecg-machine-price-bangladesh-2026', '/guides/siemens-vs-ge-ecg-machines']);
    expect(a.brand).toEqual({ url: '/brands/comen', label: 'Comen' });
  });

  it('7. broad category alone NEVER creates cluster links (Diagnostic Equipment has 3 clusters)', () => {
    const res = resolveProductSeoLinks(yamasuSphyg);
    expect(res.equipment).toEqual([]);
    expect(res.topics).toEqual([]);
    expect(res.guides).toEqual([]);
    expect(res.brand).toEqual(null); // yamasu is not in any registered brand registry
    expect(res.all).toEqual([]);
  });

  it('8. legitimate zero-link products return no cluster links (audited cases)', () => {
    [faceMaskPpe, infraredLamp, tynorDvt, jmiScalpVeinSet, secureK3Edta, stel3Analyzer].forEach((product) => {
      const res = resolveProductSeoLinks(product);
      expect(res.equipment).toEqual([]);
      expect(res.topics).toEqual([]);
      expect(res.guides).toEqual([]);
      expect(res.all.every((d) => !d.url.startsWith('/products/category/'))).toBe(true);
    });
  });

  it('9. unmapped Massager returns no invented route', () => {
    const res = resolveProductSeoLinks(nittonovaMassager);
    expect(res.equipment).toEqual([]);
    expect(res.topics).toEqual([]);
    expect(res.guides).toEqual([]);
    expect(res.brand).toEqual(null); // generic has no registered brand page (live 404)
    const flat = JSON.stringify(res);
    expect(flat).not.toContain('/products/category/');
    expect(flat).not.toContain('/brands/generic');
    expect(flat).not.toContain('massager-price');
  });

  it('10. unmapped Baby & Mom Care returns no invented route', () => {
    const res = resolveProductSeoLinks(babyWeighingScale);
    expect(res.equipment).toEqual([]);
    expect(res.topics).toEqual([]);
    expect(res.guides).toEqual([]);
    expect(res.brand).toEqual(null); // irish is not in the registered brand registries
    const flat = JSON.stringify(res);
    expect(flat).not.toContain('/products/category/');
    expect(flat).not.toContain('baby-and-mom');
  });

  it('brand: emitted only from the product own brand when the slug is registry-validated', () => {
    expect(resolveProductSeoLinks(hc5dClean).brand).toEqual({ url: '/brands/human', label: 'Human' });
    expect(resolveProductSeoLinks(stel3Analyzer).brand).toEqual(null); // cromatest-linear unregistered
    expect(resolveProductSeoLinks(gowellNebulizer).brand).toEqual(null); // generic -> live 404
    const withoutBrandField = resolveProductSeoLinks({ slug: 'hc-5d-clean', name: 'HC-5D Clean' });
    expect(withoutBrandField.brand).toEqual(null);
  });

  it('brand: resolves from the normalized string brand used in SSR (registry-validated slugify)', () => {
    // useProductDetail.normalizeProduct() converts the brand object to a plain
    // string before ProductSeoContent renders server-side, dropping the slug.
    expect(resolveProductSeoLinks({ ...contecPulseOximeter, brand: 'Contec' }).brand)
      .toEqual({ url: '/brands/contec', label: 'Contec' });
    expect(resolveProductSeoLinks({ ...faceMaskPpe, brand: 'IRISH' }).brand).toEqual(null);
    expect(resolveProductSeoLinks({ ...nittonovaMassager, brand: 'Generic' }).brand).toEqual(null);
    expect(resolveProductSeoLinks({ ...tynorDvt, brand: 'Tynor' }).brand).toEqual(null);
  });

  it('12. quote-only products behave identically (resolver has no price dependency)', () => {
    const quoteOnly = resolveProductSeoLinks({ ...stel3Analyzer });
    const withPrice = resolveProductSeoLinks({ ...stel3Analyzer, price: 50000 });
    expect(quoteOnly).toEqual(withPrice);
  });

  it('every emitted cluster destination is registered in the repository registries', () => {
    [contecPulseOximeter, comenPatientMonitor, gowellNebulizer, vigorBpMonitor].forEach((product) => {
      const res = resolveProductSeoLinks(product);
      res.equipment.forEach((d) => expect(registeredEquipment.has(d.url)).toBe(true));
      res.topics.forEach((d) => expect(registeredTopics.has(d.url)).toBe(true));
      res.guides.forEach((d) => expect(registeredGuides.has(d.url)).toBe(true));
      if (res.brand) expect(res.brand.url).toMatch(/^\/brands\/[a-z0-9-]+$/);
    });
  });

  it('broad Diagnostic Equipment category resolves only the semantically matched cluster (vigor)', () => {
    const res = resolveProductSeoLinks(vigorBpMonitor);
    expect(urls(res.equipment)).toEqual(['/equipment/blood-pressure-monitor-price-bangladesh']);
    expect(urls(res.topics)).toEqual(['/topics/blood-pressure-monitors']);
    expect(urls(res.topics)).not.toContain('/topics/ecg-machines');
    expect(urls(res.topics)).not.toContain('/topics/ultrasound-machines');
    expect(res.brand).toEqual(null); // vigor is not in the registered brand registries
  });
});



describe('sanitizeDestinations', () => {
  const sample = 'some-product';

  it('4. removes duplicate destination urls, preserving first-occurrence order', () => {
    const out = sanitizeDestinations([
      { url: '/equipment/a', label: 'A' },
      { url: '/topics/b', label: 'B' },
      { url: '/equipment/a', label: 'A duplicate' },
    ], sample);
    expect(out.map((d) => d.url)).toEqual(['/equipment/a', '/topics/b']);
  });

  it('5. removes self links and any non-SEO product path', () => {
    const out = sanitizeDestinations([
      { url: '/products/some-product', label: 'Self' },
      { url: '/equipment/a', label: 'A' },
      { url: '/products/another', label: 'Other product page' },
    ], sample);
    // only the four SEO destination families are allowed: product paths
    // (including the product itself) are never emitted as cluster destinations
    expect(out.map((d) => d.url)).toEqual(['/equipment/a']);
  });

  it('6. removes invalid, unregistered-shape or traversal targets', () => {
    const out = sanitizeDestinations([
      { url: '/brands/Bad Slug', label: 'bad slug' },
      { url: '/equipment/../etc', label: 'traversal' },
      { url: '/topics/bp?x=1', label: 'query string' },
      { url: '/unknown/y', label: 'unknown prefix' },
      { url: '/equipment/', label: 'empty segment' },
      { url: 'https://example.com/equipment/a', label: 'external' },
      { url: '/guides/bp-monitor-buying-guide-bangladesh', label: 'valid guide' },
    ], sample);
    expect(out.map((d) => d.url)).toEqual(['/guides/bp-monitor-buying-guide-bangladesh']);
  });

  it('keeps deterministic ordering across repeated sanitisation', () => {
    const input = [
      { url: '/equipment/a', label: 'A' },
      { url: '/topics/b', label: 'B' },
      { url: '/brands/c', label: 'C' },
    ];
    expect(sanitizeDestinations(input, sample)).toEqual(sanitizeDestinations(input, sample));
  });
});
