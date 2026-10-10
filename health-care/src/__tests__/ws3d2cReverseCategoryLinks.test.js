/**
 * WS-3D2-C (Phase 3D.2-C) — contextual reverse-category link tests.
 *
 * Reverse-edge contract for topic hubs and equipment price guides:
 *  - reverse edges are derived only from the existing CATEGORY_CROSS_LINKS
 *    registry (no invented categories or relationships),
 *  - every generated href is an approved canonical /products/category/<slug>
 *    URL (CATEGORY_SLUG_MAP membership), with no query strings, no self-links,
 *    and no duplicate rendered links (the source page's own category is
 *    excluded),
 *  - at most MAX_RELATED_CATEGORIES (4) links per source page,
 *  - empty relationships render no block (no invalid links),
 *  - Massager and Baby & Mom Care are never emitted (not registry keys),
 *  - both pages render exactly one guarded "Related categories" block.
 */
import fs from 'fs';
import path from 'path';

import {
  CATEGORY_CROSS_LINKS,
  getRelatedCategoriesForTopic,
  getRelatedCategoriesForEquipment,
  MAX_RELATED_CATEGORIES,
} from '@/config/categoryCrossLinks';
import { CATEGORY_SLUG_MAP } from '@/constants/categories';
import { TOPICAL_CLUSTERS } from '@/config/topicalClusters';
import { LANDING_PAGES } from '@/config/landingPages';

const CATEGORY_HREF = /^\/products\/category\/[a-z0-9-]+$/;
const UNAPPROVED = ['massager', 'baby-and-mom-care'];

const readSrc = (rel) => fs.readFileSync(path.join(process.cwd(), 'src', rel), 'utf8');

describe('WS-3D2-C — reverse-edge selection', () => {
  it('inverts topic edges for hospital-icu-equipment and caps at 4 (5 registry edges exist)', () => {
    const rawCount = Object.values(CATEGORY_CROSS_LINKS).filter((links) =>
      (links.topics || []).some((t) => t.slug === 'hospital-icu-equipment')
    ).length;
    expect(rawCount).toBe(5);

    const result = getRelatedCategoriesForTopic('hospital-icu-equipment');
    // hospital-machines is dropped as footer-chrome even without excludeSlug;
    // the 4-link cap then fills from the remaining registry edges.
    expect(result.map((c) => c.slug)).toEqual([
      'respiratory-equipment',
      'consumables',
      'iv-and-infusion-therapy',
      'blood-bank-supplies',
    ]);
    expect(result).toHaveLength(MAX_RELATED_CATEGORIES);
  });

  it('excludes the source page own category (no duplicate rendered link)', () => {
    const result = getRelatedCategoriesForTopic('hospital-icu-equipment', 'hospital-machines');
    // Own category dropped, then the 4-link cap still fills from the remaining
    // registry edges (blood-bank-supplies is the 5th declared edge).
    expect(result.map((c) => c.slug)).toEqual([
      'respiratory-equipment',
      'consumables',
      'iv-and-infusion-therapy',
      'blood-bank-supplies',
    ]);
    expect(result.map((c) => c.slug)).not.toContain('hospital-machines');
    expect(result.length).toBeLessThanOrEqual(MAX_RELATED_CATEGORIES);
  });

  it('returns the exact approved category name for every edge', () => {
    const result = getRelatedCategoriesForTopic('ecg-machines', 'diagnostic-equipment');
    expect(result).toEqual([{ slug: 'medical-devices', name: CATEGORY_SLUG_MAP['medical-devices'] }]);
  });

  it('inverts equipment edges for infusion-pump-price-bangladesh', () => {
    const result = getRelatedCategoriesForEquipment('infusion-pump-price-bangladesh', 'hospital-machines');
    expect(result.map((c) => c.slug)).toEqual(['consumables', 'iv-and-infusion-therapy']);
  });

  it('returns [] for a real page whose only edge is the already-linked own category', () => {
    expect(getRelatedCategoriesForEquipment('nebulizer-price-bangladesh', 'respiratory-equipment')).toEqual([]);
  });

  it('returns [] for a real page with zero reverse relationships (x-ray price guide)', () => {
    const raw = Object.values(CATEGORY_CROSS_LINKS).filter((links) =>
      (links.equipment || []).some((e) => e.slug === 'x-ray-machine-price-bangladesh')
    );
    expect(raw).toHaveLength(0);
    expect(getRelatedCategoriesForEquipment('x-ray-machine-price-bangladesh')).toEqual([]);
  });

  it('returns [] for unknown source slugs (empty relationship case)', () => {
    expect(getRelatedCategoriesForTopic('no-such-topic')).toEqual([]);
    expect(getRelatedCategoriesForEquipment('no-such-equipment')).toEqual([]);
  });
});

describe('WS-3D2-C — maximum 4 links per source page', () => {
  it('never exceeds MAX_RELATED_CATEGORIES for any topic or equipment source', () => {
    const sources = [
      ...TOPICAL_CLUSTERS.map((c) => ({ kind: 'topic', slug: c.slug, own: c.categorySlug })),
      ...LANDING_PAGES.map((p) => ({ kind: 'equipment', slug: p.slug, own: p.categorySlug })),
    ];
    expect(sources.length).toBeGreaterThan(0);
    for (const src of sources) {
      const pick = src.kind === 'topic' ? getRelatedCategoriesForTopic : getRelatedCategoriesForEquipment;
      expect(pick(src.slug).length).toBeLessThanOrEqual(MAX_RELATED_CATEGORIES);
      expect(pick(src.slug, src.own).length).toBeLessThanOrEqual(MAX_RELATED_CATEGORIES);
    }
  });
});
describe('WS-3D2-C — URL safety', () => {
  const sources = [
    ...TOPICAL_CLUSTERS.map((c) => ({ kind: 'topic', slug: c.slug, own: c.categorySlug })),
    ...LANDING_PAGES.map((p) => ({ kind: 'equipment', slug: p.slug, own: p.categorySlug })),
  ];

  it('every generated href is an approved canonical category URL without query params', () => {
    for (const src of sources) {
      const pick = src.kind === 'topic' ? getRelatedCategoriesForTopic : getRelatedCategoriesForEquipment;
      for (const cat of pick(src.slug, src.own)) {
        const href = `/products/category/${cat.slug}`;
        expect(href).toMatch(CATEGORY_HREF);
        expect(href.includes('?')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(CATEGORY_SLUG_MAP, cat.slug)).toBe(true);
        expect(cat.name).toBe(CATEGORY_SLUG_MAP[cat.slug]);
      }
    }
  });

  it('never links to the current source URL and never duplicates a link', () => {
    // Footer "Products" chrome (first-byte HTML on every page).
    const CHROME = ['diagnostic-equipment', 'surgical-instruments', 'hospital-machines'];
    for (const src of sources) {
      const pick = src.kind === 'topic' ? getRelatedCategoriesForTopic : getRelatedCategoriesForEquipment;
      const sourceUrl = `/${src.kind === 'topic' ? 'topics' : 'equipment'}/${src.slug}`;
      const results = pick(src.slug, src.own);
      const hrefs = results.map((c) => `/products/category/${c.slug}`);
      expect(hrefs).not.toContain(sourceUrl);
      expect(new Set(hrefs).size).toBe(hrefs.length);
      // The page already renders its own category link; the block excludes it.
      expect(hrefs).not.toContain(`/products/category/${src.own}`);
      // No generated href duplicates a footer-chrome category link either.
      for (const cat of results) expect(CHROME).not.toContain(cat.slug);
    }
  });

  it('patient-monitor price guide renders no block (only candidate is footer chrome)', () => {
    // Reverse edges: diagnostic-equipment (chrome-rendered) + own hospital-machines.
    expect(getRelatedCategoriesForEquipment('patient-monitor-price-bangladesh', 'hospital-machines')).toEqual([]);
  });

  it('emits only registry-derived category relationships (nothing invented)', () => {
    for (const src of sources) {
      const pick = src.kind === 'topic' ? getRelatedCategoriesForTopic : getRelatedCategoriesForEquipment;
      for (const cat of pick(src.slug, src.own)) {
        expect(Object.prototype.hasOwnProperty.call(CATEGORY_CROSS_LINKS, cat.slug)).toBe(true);
      }
    }
  });
});

describe('WS-3D2-C — unapproved categories never emitted (Massager / Baby & Mom Care)', () => {
  it('registry has no massager or baby-and-mom-care keys', () => {
    expect(Object.prototype.hasOwnProperty.call(CATEGORY_CROSS_LINKS, 'massager')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(CATEGORY_CROSS_LINKS, 'baby-and-mom-care')).toBe(false);
  });

  it('no reverse result ever contains them', () => {
    for (const c of TOPICAL_CLUSTERS) {
      const slugs = getRelatedCategoriesForTopic(c.slug).map((x) => x.slug);
      expect(slugs.some((s) => UNAPPROVED.includes(s))).toBe(false);
    }
    for (const p of LANDING_PAGES) {
      const slugs = getRelatedCategoriesForEquipment(p.slug).map((x) => x.slug);
      expect(slugs.some((s) => UNAPPROVED.includes(s))).toBe(false);
    }
  });
});
describe('WS-3D2-C — source contracts (pages render exactly one guarded block)', () => {
  const topicSrc = readSrc(path.join('app', 'topics', '[slug]', 'page.jsx'));
  const equipmentSrc = readSrc(path.join('app', 'equipment', '[slug]', 'page.jsx'));
  const registrySrc = readSrc(path.join('config', 'categoryCrossLinks.js'));

  it('topic page imports and calls the helper with own-category exclusion', () => {
    expect(topicSrc).toContain("import { getRelatedCategoriesForTopic } from '@/config/categoryCrossLinks';");
    expect(topicSrc).toContain('getRelatedCategoriesForTopic(cluster.slug, cluster.categorySlug)');
  });

  it('equipment page imports and calls the helper with own-category exclusion', () => {
    expect(equipmentSrc).toContain("import { getRelatedCategoriesForEquipment } from '@/config/categoryCrossLinks';");
    expect(equipmentSrc).toContain('getRelatedCategoriesForEquipment(slug, page.categorySlug)');
  });

  it('each page renders exactly one "Related categories" heading, guarded', () => {
    expect(topicSrc.split('Related categories').length - 1).toBe(1);
    expect(equipmentSrc.split('Related categories').length - 1).toBe(1);
    expect(topicSrc).toContain('{relatedCategories.length > 0 && (');
    expect(equipmentSrc).toContain('{relatedCategories.length > 0 && (');
  });

  it('both blocks link only via the approved category href template', () => {
    expect(topicSrc).toContain('href={`/products/category/${cat.slug}`}');
    expect(equipmentSrc).toContain('href={`/products/category/${cat.slug}`}');
    expect(topicSrc.includes('/products/category/${cat.slug}?')).toBe(false);
    expect(equipmentSrc.includes('/products/category/${cat.slug}?')).toBe(false);
  });

  it('pages contain no unapproved-category strings (Massager / Baby & Mom Care)', () => {
    for (const src of [topicSrc, equipmentSrc]) {
      expect(src.includes('massager')).toBe(false);
      expect(src.includes('baby-and-mom-care')).toBe(false);
    }
  });

  it('registry helper enforces the 4-link cap and approved-slug filter', () => {
    expect(registrySrc).toContain('export const MAX_RELATED_CATEGORIES = 4;');
    expect(registrySrc.split('slice(0, MAX_RELATED_CATEGORIES)').length - 1).toBe(2);
    expect(registrySrc).toContain('hasOwnProperty.call(CATEGORY_SLUG_MAP, categorySlug)');
  });
});


