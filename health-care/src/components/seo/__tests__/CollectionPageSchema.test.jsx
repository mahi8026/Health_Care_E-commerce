/**
 * WS-04A — CollectionPage ItemList completeness (Phase 3C.2).
 *
 * The category landing page renders the first page of its product listing
 * server-side (max 20 items) and already holds that data in `listing.products`.
 * These tests pin the structured-data contract for wiring that rendered listing
 * into `CollectionPage.mainEntity.ItemList`:
 *
 *  1. category with products produces a non-empty ItemList
 *  2. ItemList entry count matches the supplied rendered products
 *  3. product URLs are canonical /products/<slug>
 *  4. product positions are deterministic
 *  5. product names are preserved
 *  6. valid product image data is handled correctly
 *  7. positive-priced product may emit an Offer
 *  8. quote-only product emits no Offer
 *  9. unpriced product emits no Offer
 * 10. price 0 never appears
 * 11. empty product list still produces a valid empty ItemList
 * 12. existing CollectionPage fields remain unchanged
 * 13. BreadcrumbList remains unchanged
 * 14. FAQPage remains unchanged (separate component, untouched)
 * 15. no duplicate product URLs
 *
 * Fixtures mirror real catalogue rows already used by the repository's other
 * SEO tests (CONTEC pulse oximeter, IRISH face mask) so the assertions describe
 * real listing payload shapes.
 */

import { render } from '@testing-library/react';
import CollectionPageSchema, { ItemListSchema, buildItemListElements } from '../CollectionPageSchema';
import FAQSchema from '../FAQSchema';
import { SITE_CONFIG } from '@/config/seo';

/** Parse the single JSON-LD script rendered by a schema component. */
function parseJsonLd(container) {
  const scripts = container.querySelectorAll('script[type="application/ld+json"]');
  return JSON.parse(scripts[0].innerHTML);
}

const contecOximeter = {
  name: 'CONTEC CMS50D1 New Fingertip Pulse Oximeter',
  slug: 'contec-cms50d1-new-fingertip-pulse-oximeter-1',
  price: 1900,
  stock: 12,
  images: [{ url: 'https://res.cloudinary.com/mediportbd/contec-cms50d1.jpg', isPrimary: true }],
};

const irishFaceMask = {
  name: 'Face Mask Surgical 3 Layers with Nose Pin 50s Pack IRISH',
  slug: 'face-mask-surgical-3-layers-with-nose-pin-50s-pack-irish',
  price: 255,
  stock: 0,
  image: '/images/products/irish-face-mask.jpg', // legacy single-image field
};

const quoteOnlyScale = {
  name: 'Baby Weighing Scale Digital HF 301',
  slug: 'baby-weighing-scale-digital-hf-301',
  price: 0,
  stock: 3,
};

const unpricedMonitor = {
  name: 'Patient Monitor Multi-Parameter PM-9000',
  slug: 'patient-monitor-multi-parameter-pm-9000',
};

const renderedProducts = [contecOximeter, irishFaceMask, quoteOnlyScale, unpricedMonitor];

const categoryProps = {
  name: 'Diagnostic Equipment',
  description: 'Buy diagnostic equipment in Bangladesh: ECG machines, BP monitors and patient monitors. DGDA-registered supplier.',
  category: 'Diagnostic Equipment',
  url: `${SITE_CONFIG.url}/products/category/diagnostic-equipment`,
};

describe('CollectionPageSchema — ItemList describes the rendered category listing', () => {
  it('1. produces a non-empty ItemList when products are rendered', () => {
    const schema = parseJsonLd(render(<CollectionPageSchema {...categoryProps} items={renderedProducts} />).container);

    expect(schema.mainEntity['@type']).toBe('ItemList');
    expect(Array.isArray(schema.mainEntity.itemListElement)).toBe(true);
    expect(schema.mainEntity.itemListElement.length).toBeGreaterThan(0);
  });

  it('2. ItemList entry count matches the supplied rendered products (and numberOfItems)', () => {
    const schema = parseJsonLd(render(<CollectionPageSchema {...categoryProps} items={renderedProducts} />).container);

    expect(schema.mainEntity.itemListElement).toHaveLength(renderedProducts.length);
    expect(schema.mainEntity.numberOfItems).toBe(renderedProducts.length);
  });

  it('3. product URLs are canonical /products/<slug> on the site origin', () => {
    const schema = parseJsonLd(render(<CollectionPageSchema {...categoryProps} items={renderedProducts} />).container);

    const urls = schema.mainEntity.itemListElement.map((entry) => entry.item.url);
    expect(urls).toEqual(renderedProducts.map((p) => `${SITE_CONFIG.url}/products/${p.slug}`));
    urls.forEach((url) => {
      expect(url).toMatch(/^https?:\/\/[^/]+\/products\/[a-z0-9-]+$/);
      expect(url).not.toContain('undefined');
      expect(url).not.toContain('?category=');
    });
  });

  it('4. positions are deterministic (1..n in supplied listing order)', () => {
    const first = parseJsonLd(render(<CollectionPageSchema {...categoryProps} items={renderedProducts} />).container);
    const second = parseJsonLd(render(<CollectionPageSchema {...categoryProps} items={[...renderedProducts]} />).container);

    expect(first.mainEntity.itemListElement.map((e) => e.position)).toEqual([1, 2, 3, 4]);
    expect(JSON.stringify(first.mainEntity)).toBe(JSON.stringify(second.mainEntity));
  });

  it('5. product names are preserved verbatim', () => {
    const schema = parseJsonLd(render(<CollectionPageSchema {...categoryProps} items={renderedProducts} />).container);

    expect(schema.mainEntity.itemListElement.map((e) => e.item.name)).toEqual(renderedProducts.map((p) => p.name));
  });

  it('6. includes image only when valid product image data exists', () => {
    const schema = parseJsonLd(render(<CollectionPageSchema {...categoryProps} items={renderedProducts} />).container);
    const [oximeter, faceMask, quoteOnly, unpriced] = schema.mainEntity.itemListElement.map((e) => e.item);

    // images[0].url is used when present
    expect(oximeter.image).toBe('https://res.cloudinary.com/mediportbd/contec-cms50d1.jpg');
    // legacy `image` string is used as a fallback
    expect(faceMask.image).toBe('/images/products/irish-face-mask.jpg');
    // no image data at all → key omitted (never an empty/invalid value)
    expect(quoteOnly).not.toHaveProperty('image');
    expect(unpriced).not.toHaveProperty('image');

    const serialized = JSON.stringify(schema);
    expect(serialized).not.toContain('"image":""');
    expect(serialized).not.toContain('"image":null');
    expect(serialized).not.toContain('undefined');
  });

  it('6b. skips blank/invalid image values', () => {
    const schema = parseJsonLd(
      render(
        <CollectionPageSchema
          {...categoryProps}
          items={[
            { name: 'Blank String Image', slug: 'blank-string-image', images: [''] },
            { name: 'Blank Array Image', slug: 'blank-array-image', images: [{ url: '   ' }] },
          ]}
        />
      ).container
    );

    schema.mainEntity.itemListElement.forEach((entry) => {
      expect(entry.item).not.toHaveProperty('image');
    });
  });

  it('11. an empty product list still produces a valid empty ItemList', () => {
    const schema = parseJsonLd(render(<CollectionPageSchema {...categoryProps} items={[]} />).container);

    expect(schema.mainEntity['@type']).toBe('ItemList');
    expect(schema.mainEntity.itemListElement).toEqual([]);
    expect(schema.mainEntity).not.toHaveProperty('numberOfItems');
  });

  it('11b. no items prop keeps the pre-existing empty-ItemList behaviour', () => {
    const schema = parseJsonLd(render(<CollectionPageSchema {...categoryProps} />).container);
    expect(schema.mainEntity.itemListElement).toEqual([]);

    const withCount = parseJsonLd(render(<CollectionPageSchema {...categoryProps} numberOfItems={242} />).container);
    expect(withCount.mainEntity.numberOfItems).toBe(242);
  });
});

describe('CollectionPageSchema — Offer guard', () => {
  it('7. a positive-priced product emits a BDT Offer with availability', () => {
    const schema = parseJsonLd(render(<CollectionPageSchema {...categoryProps} items={renderedProducts} />).container);
    const [oximeter, faceMask] = schema.mainEntity.itemListElement.map((e) => e.item);

    expect(oximeter.offers).toEqual({
      '@type': 'Offer',
      price: '1900',
      priceCurrency: 'BDT',
      availability: 'https://schema.org/InStock',
    });
    // out-of-stock but priced → Offer still present, availability reflects stock
    expect(faceMask.offers.price).toBe('255');
    expect(faceMask.offers.availability).toBe('https://schema.org/OutOfStock');
  });

  it('8. a quote-only product (price 0) emits no Offer', () => {
    const schema = parseJsonLd(render(<CollectionPageSchema {...categoryProps} items={[quoteOnlyScale]} />).container);

    expect(schema.mainEntity.itemListElement[0].item).not.toHaveProperty('offers');
  });

  it('9. an unpriced product emits no Offer', () => {
    const schema = parseJsonLd(render(<CollectionPageSchema {...categoryProps} items={[unpricedMonitor]} />).container);

    expect(schema.mainEntity.itemListElement[0].item).not.toHaveProperty('offers');
  });

  it('10. price 0 (and other non-positive/junk prices) never appears in the output', () => {
    const junkPriced = [
      { name: 'Zero Numeric', slug: 'zero-numeric', price: 0 },
      { name: 'Zero String', slug: 'zero-string', price: '0' },
      { name: 'Zero Decimal', slug: 'zero-decimal', price: '0.00' },
      { name: 'Empty String', slug: 'empty-string', price: '' },
      { name: 'Null Price', slug: 'null-price', price: null },
      { name: 'Negative Price', slug: 'negative-price', price: -500 },
      { name: 'Junk Price', slug: 'junk-price', price: 'call for price' },
    ];
    const schema = parseJsonLd(render(<CollectionPageSchema {...categoryProps} items={junkPriced} />).container);

    schema.mainEntity.itemListElement.forEach((entry) => {
      expect(entry.item).not.toHaveProperty('offers');
    });
    expect(JSON.stringify(schema)).not.toMatch(/"price"\s*:\s*"?0(\.0+)?"?/);
  });
});

describe('CollectionPageSchema — existing schema fields unchanged', () => {
  it('12. keeps @context/@type/name/description/url exactly as before', () => {
    const schema = parseJsonLd(render(<CollectionPageSchema {...categoryProps} items={renderedProducts} />).container);

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('CollectionPage');
    expect(schema.name).toBe(categoryProps.name);
    expect(schema.description).toBe(categoryProps.description);
    expect(schema.url).toBe(categoryProps.url);
    expect(Object.keys(schema)).toEqual(['@context', '@type', 'name', 'description', 'url', 'mainEntity', 'breadcrumb']);
  });

  it('12b. still returns nothing without a name (guard preserved)', () => {
    const { container } = render(<CollectionPageSchema items={renderedProducts} url="https://x/products/category/x" />);
    expect(container.querySelectorAll('script[type="application/ld+json"]').length).toBe(0);
  });

  it('13. BreadcrumbList is byte-identical to the pre-fix shape', () => {
    const schema = parseJsonLd(render(<CollectionPageSchema {...categoryProps} items={renderedProducts} />).container);

    expect(schema.breadcrumb).toEqual({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.url },
        { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_CONFIG.url}/products` },
        { '@type': 'ListItem', position: 3, name: categoryProps.name, item: categoryProps.url },
      ],
    });
  });

  it('14. FAQPage output is untouched (separate component) and absent from CollectionPage', () => {
    const faqs = [
      { q: 'Do you deliver outside Dhaka?', a: 'Yes, nationwide delivery in 3-5 business days.' },
      { q: 'Are products DGDA registered?', a: 'Yes, all supplied products are DGDA registered.' },
    ];
    const schema = parseJsonLd(render(<FAQSchema faqs={faqs} />).container);

    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toHaveLength(2);
    expect(schema.mainEntity[0]).toEqual({
      '@type': 'Question',
      name: faqs[0].q,
      acceptedAnswer: { '@type': 'Answer', text: faqs[0].a },
    });

    const collectionPage = parseJsonLd(render(<CollectionPageSchema {...categoryProps} items={renderedProducts} />).container);
    expect(JSON.stringify(collectionPage)).not.toContain('FAQPage');
  });
});

describe('CollectionPageSchema — URL hygiene', () => {
  it('15. duplicate product URLs are collapsed and positions stay contiguous', () => {
    const duplicated = [contecOximeter, irishFaceMask, contecOximeter];
    const schema = parseJsonLd(render(<CollectionPageSchema {...categoryProps} items={duplicated} />).container);

    const urls = schema.mainEntity.itemListElement.map((e) => e.item.url);
    expect(urls).toHaveLength(2);
    expect(urls.length).toBe(new Set(urls).size);
    expect(schema.mainEntity.itemListElement.map((e) => e.position)).toEqual([1, 2]);
  });

  it('15b. items without a usable slug are skipped (no self/invalid URLs)', () => {
    const schema = parseJsonLd(
      render(
        <CollectionPageSchema
          {...categoryProps}
          items={[{ name: 'No Slug Product', price: 100 }, null, undefined, { name: '', slug: 'nameless' }]}
        />
      ).container
    );

    expect(schema.mainEntity.itemListElement).toEqual([]);
    const serialized = JSON.stringify(schema);
    expect(serialized).not.toContain('/products/undefined');
    expect(serialized).not.toContain('No Slug Product');
    // no product URLs were emitted: the canonical collection URL appears only
    // where it always did (schema.url + breadcrumb position 3), never as an item
    expect(serialized.split(categoryProps.url)).toHaveLength(3);
    expect(schema.mainEntity.itemListElement.length).toBe(0);
  });

  it('15c. handles non-array / missing items values defensively', () => {
    expect(buildItemListElements(null)).toEqual([]);
    expect(buildItemListElements(undefined)).toEqual([]);
    expect(buildItemListElements({})).toEqual([]);
  });
});

describe('buildItemListElements — single shared implementation', () => {
  it('is reused by both CollectionPageSchema and ItemListSchema', () => {
    const elements = buildItemListElements(renderedProducts);

    const collectionPage = parseJsonLd(render(<CollectionPageSchema {...categoryProps} items={renderedProducts} />).container);
    expect(collectionPage.mainEntity.itemListElement).toEqual(elements);

    const itemList = parseJsonLd(render(<ItemListSchema items={renderedProducts} listName="Products" />).container);
    expect(itemList.itemListElement).toEqual(elements);
    expect(itemList.numberOfItems).toBe(elements.length);
  });

  it('ItemListSchema still returns nothing for an empty list', () => {
    const { container } = render(<ItemListSchema items={[]} />);
    expect(container.querySelectorAll('script[type="application/ld+json"]').length).toBe(0);
  });
});

