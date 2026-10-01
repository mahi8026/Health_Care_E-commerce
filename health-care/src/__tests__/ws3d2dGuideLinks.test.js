/**
 * WS-3D2-D (Phase 3D.2-D) — F-18 guide-link normalization tests.
 *
 * The /guides hub exposed the pillar destination three times: featured
 * banner + duplicate "Pillar Guides" grid card + footer link. F-18 removes
 * ONLY the duplicate grid card. These tests pin:
 *  - the pillar grid card is not rendered by the grouped lists,
 *  - the featured banner and its Article schema remain,
 *  - the footer guide link remains,
 *  - every other guide destination stays rendered exactly once (no
 *    unintended removals, no new hrefs, no duplicates),
 *  - metadata / canonical / robots are untouched.
 */
import fs from 'fs';
import path from 'path';

import { GUIDES, PILLAR_GUIDE } from '@/config/guides';

const readSrc = (rel) => fs.readFileSync(path.join(process.cwd(), 'src', rel), 'utf8');
const pageSrc = readSrc(path.join('app', 'guides', 'page.jsx'));
const footerSrc = readSrc(path.join('components', 'layout', 'Footer.jsx'));

// Mirrors the page's grouping + the F-18 filter exactly.
function renderedGuideSlugs() {
  const byType = GUIDES.reduce((acc, g) => {
    (acc[g.type] = acc[g.type] || []).push(g);
    return acc;
  }, {});
  return Object.entries(byType)
    .filter(([type, guides]) => type !== 'pillar' && guides.length > 0)
    .flatMap(([, guides]) => guides.map((g) => g.slug));
}

describe('WS-3D2-D — F-18 duplicate pillar grid card removed', () => {
  it('grouped-list filter excludes the pillar type', () => {
    expect(pageSrc).toContain("type !== 'pillar'");
  });

  it('rendered inventory never contains the pillar slug', () => {
    const rendered = renderedGuideSlugs();
    expect(PILLAR_GUIDE).toBeDefined();
    expect(rendered).not.toContain(PILLAR_GUIDE.slug);
  });

  it('exactly one pillar guide exists (the duplicate source)', () => {
    expect(GUIDES.filter((g) => g.type === 'pillar')).toHaveLength(1);
    expect(PILLAR_GUIDE.slug).toBe('medical-equipment-bangladesh-guide');
  });
});

describe('WS-3D2-D — preserved surfaces', () => {
  it('featured pillar banner remains', () => {
    expect(pageSrc).toContain('{PILLAR_GUIDE && (');
    expect(pageSrc).toContain('href={`/guides/${PILLAR_GUIDE.slug}`}');
    expect(pageSrc).toContain('Start here');
  });

  it('Article structured data for the pillar remains', () => {
    expect(pageSrc).toContain("'@type': 'Article'");
    expect(pageSrc).toContain('headline: PILLAR_GUIDE.title');
  });

  it('footer guide link to the pillar remains', () => {
    expect(footerSrc).toContain('href: \'/guides/medical-equipment-bangladesh-guide\'');
  });

  it('every non-pillar guide destination renders exactly once (no removals, no additions, no duplicates)', () => {
    const expected = GUIDES.filter((g) => g.type !== 'pillar').map((g) => g.slug).sort();
    const rendered = renderedGuideSlugs();
    expect(rendered.slice().sort()).toEqual(expected);
    expect(new Set(rendered).size).toBe(rendered.length);
    // The config is the only source: nothing new can be introduced.
    const allSlugs = GUIDES.map((g) => g.slug);
    for (const slug of rendered) expect(allSlugs).toContain(slug);
  });

  it('hero H1 and Browse-by-Category section remain', () => {
    expect(pageSrc).toContain('Medical Equipment Guides for Bangladesh');
    expect(pageSrc).toContain('Browse by Category');
  });
});

describe('WS-3D2-D — metadata / SEO surface untouched', () => {
  it('canonical, robots-visible title and description are unchanged', () => {
    expect(pageSrc).toContain('alternates: { canonical: `${SITE_CONFIG.url}/guides` }');
    expect(pageSrc).toContain('Medical Equipment Guides & Comparisons Bangladesh 2026');
    expect(pageSrc).toContain('Expert medical equipment guides for Bangladesh:');
  });

  it('single H1 in source (no duplicate heading introduced)', () => {
    expect(pageSrc.split('<h1').length - 1).toBe(1);
  });
});
