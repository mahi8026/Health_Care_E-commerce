/**
 * WS-03 — ProductSeoContent rendering tests (Phase 3B.2).
 *
 * 11. existing category/hub links remain intact (no behaviour change)
 * 12. structured-data outputs remain unchanged (component emits no JSON-LD;
 *     Product schema Offer/rating invariants still hold)
 * + the new "Related Healthcare Resources" section appears only when the
 *   resolver found verified destinations, and never for zero-link products.
 *   WS-04B.2 (Phase 3C.5): Massager and Baby & Mom Care are now registered
 *   public categories, so their product pages emit clean category routes.
 */

import { render, screen } from '@testing-library/react';
import ProductSeoContent from '../ProductSeoContent';
import { generateProductSchema } from '@/utils/structuredData';

const contecPulseOximeter = {
  name: 'CONTEC CMS50D1 New Fingertip Pulse Oximeter',
  slug: 'contec-cms50d1-new-fingertip-pulse-oximeter-1',
  brand: { name: 'CONTEC', slug: 'contec' },
  category: { name: 'Diagnostic Devices', slug: 'diagnostic-devices' },
  price: 1900,
  description: 'Fingertip pulse oximeter with OLED display for SpO2 and pulse rate measurement.',
};

const faceMaskPpe = {
  name: 'Face Mask Surgical 3 Layers with Nose Pin 50s Pack IRISH',
  slug: 'face-mask-surgical-3-layers-with-nose-pin-50s-pack-irish',
  brand: { name: 'IRISH', slug: 'irish' },
  category: { name: 'PPE & Safety', slug: 'ppe-and-safety' },
  price: 255,
  description: 'Three-layer surgical face mask with nose pin, pack of 50 pieces.',
};

const babyWeighingScale = {
  name: 'Baby Weighing Scale Digital HF 301',
  slug: 'baby-weighing-scale-digital-hf-301',
  brand: { name: 'IRISH', slug: 'irish' },
  category: { name: 'Baby & Mom Care', slug: 'baby-and-mom-care' },
  price: 4000,
  description: 'Digital baby weighing scale with hold function and easy-to-read display.',
};

const pricedProduct = {
  name: 'Priced Fixture',
  slug: 'priced-fixture',
  price: 4500,
  brand: 'Omron',
  inStock: true,
};

const quoteOnlyProduct = {
  name: 'Quote Only Fixture',
  slug: 'quote-only-fixture',
  price: 0,
  brand: 'Mindray',
};

describe('ProductSeoContent — WS-03 rendering', () => {
  it('11. existing category link and hub links remain intact for a mapped category', () => {
    const { container } = render(<ProductSeoContent product={contecPulseOximeter} />);

    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/products/category/diagnostic-devices');
    expect(hrefs).toContain('/brands');
    expect(hrefs).toContain('/topics');
    expect(hrefs).toContain('/equipment');
    expect(hrefs).toContain('/b2b');
    expect(screen.getByText(/View more Diagnostic Devices/)).toBeTruthy();
  });

  it('renders the new section with verified destinations in SSR markup', () => {
    const { container } = render(<ProductSeoContent product={contecPulseOximeter} />);
    expect(screen.getByRole('heading', { name: 'Related Healthcare Resources' })).toBeTruthy();
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/equipment/pulse-oximeter-price-bangladesh');
    expect(hrefs).toContain('/topics/blood-pressure-monitors');
    expect(hrefs).toContain('/guides/bp-monitor-buying-guide-bangladesh');
    expect(hrefs).toContain('/brands/contec');
    // no self link, no duplicate destinations within the new section
    const newSection = container.querySelectorAll('a[href^="/equipment/"], a[href^="/topics/"], a[href^="/guides/"], a[href^="/brands/"]');
    const urls = Array.from(newSection).map((a) => a.getAttribute('href'));
    expect(urls.length).toBe(new Set(urls).size);
    expect(urls).not.toContain(`/products/${contecPulseOximeter.slug}`);
    // descriptive anchor text from registry titles (no keyword stuffing, no brand suffix)
    const newLinks = Array.from(
      container.querySelectorAll('a[href^="/equipment/"], a[href^="/topics/"], a[href^="/guides/"], a[href^="/brands/"]')
    );
    newLinks.forEach((anchor) => {
      const text = anchor.textContent || '';
      expect(text.trim().length).toBeGreaterThan(0);
      expect(text).not.toMatch(/\| MediportBD/);
    });
    const equipmentAnchor = container.querySelector('a[href="/equipment/pulse-oximeter-price-bangladesh"]');
    expect(equipmentAnchor).toBeTruthy();
    expect(equipmentAnchor.textContent).toMatch(/Pulse Oximeter/i);
  });

  it('renders no new section for a legitimate zero-link product (PPE)', () => {
    render(<ProductSeoContent product={faceMaskPpe} />);
    expect(screen.queryByRole('heading', { name: 'Related Healthcare Resources' })).toBeNull();
  });

  it('renders the approved Baby & Mom Care category route and no invented cluster links', () => {
    const { container } = render(<ProductSeoContent product={babyWeighingScale} />);
    expect(screen.queryByRole('heading', { name: 'Related Healthcare Resources' })).toBeNull();
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    // WS-04B.2 (Phase 3C.5): Baby & Mom Care is now a registered public category,
    // so the clean category route is emitted instead of a query-string fallback.
    expect(hrefs).toContain('/products/category/baby-and-mom-care');
    expect(hrefs.every((h) => !String(h).includes('?category='))).toBe(true);
    // mapped-category parity: the categorySlug-guarded hub block now renders
    expect(hrefs).toContain('/brands');
    expect(hrefs).toContain('/equipment');
    // still no invented per-cluster destinations for this product
    expect(hrefs.filter((h) => /^\/(equipment|topics|guides)\/[a-z0-9-]+$/.test(String(h)))).toEqual([]);
  });

  it('12. the component itself emits no JSON-LD (structured data comes from the route and is unchanged)', () => {
    const { container } = render(<ProductSeoContent product={contecPulseOximeter} />);
    expect(container.querySelectorAll('script[type="application/ld+json"]').length).toBe(0);
  });

  it('12. Product schema invariants remain unchanged (priced vs quote-only)', () => {
    const priced = generateProductSchema(pricedProduct);
    expect(priced.offers).toBeDefined();
    expect(Number.isFinite(Number(priced.offers.price))).toBe(true);
    expect(Number(priced.offers.price)).toBeGreaterThan(0);

    const quoteOnly = generateProductSchema(quoteOnlyProduct);
    expect(quoteOnly).not.toHaveProperty('offers');
    expect(JSON.stringify(quoteOnly)).not.toMatch(/"price"\s*:\s*"?0(\.0+)?"?/);
  });
});
