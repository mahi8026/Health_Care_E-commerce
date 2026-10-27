/**
 * Phase 1 metadata guard — homepage, /b2b, /about, /contact metadata + TopBar copy.
 *
 * Fails if a retired claim phrase returns to any metadata surface or to the
 * announcement bar. Scoped to the surfaces Phase 1 changed: other PAGE_SEO /
 * CATEGORY_SEO entries and body copy are out of scope for this PR.
 */

const fs = require('fs');
const path = require('path');

const SRC_ROOT = path.resolve(__dirname, '..', '..', '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(SRC_ROOT, relativePath), 'utf8').replace(/\r\n/g, '\n');
}

function blockAfter(source, marker) {
  const start = source.indexOf(marker);
  if (start === -1) return '';
  const end = source.indexOf('\n  },', start);
  return source.slice(start, end === -1 ? source.length : end);
}

function metadataBlock(relativePath) {
  const source = readSrc(relativePath);
  const start = source.indexOf('export const metadata');
  if (start === -1) return source;
  const end = source.indexOf('\n};', start);
  return source.slice(start, end === -1 ? source.length : end);
}

function topBarCopy() {
  return readSrc('components/layout/TopBar.jsx')
    .split('\n')
    .filter((line) => /^\s*(text|shortText):/.test(line))
    .join('\n');
}

const HOME_METADATA = () => blockAfter(readSrc('config/seo.js'), '  home: {');
const B2B_METADATA = () => blockAfter(readSrc('config/seo.js'), '  b2b: {');

const RETIRED_PHRASES = [
  ['8-30 / 8–30 discount', /8-30|8–30/],
  ['cold chain', /cold[\s-]?chain/i],
  ['same-day promise', /same[\s-]?day/i],
  ['DGDA-registered supplier', /DGDA[-\s]registered\s+supplier/i],
  ['CE-certified', /CE[-\s]certified/i],
];

const SURFACES = [
  ['homepage metadata', HOME_METADATA],
  ['/b2b metadata (seo.js)', B2B_METADATA],
  ['/about metadata', () => metadataBlock('app/about/page.jsx')],
  ['/b2b metadata (page)', () => metadataBlock('app/b2b/page.jsx')],
  ['/contact metadata', () => metadataBlock('app/contact/page.jsx')],
  ['TopBar copy', topBarCopy],
];

describe('retired claim phrases stay out of metadata and TopBar', () => {
  SURFACES.forEach(([label, load]) => {
    RETIRED_PHRASES.forEach(([phrase, pattern]) => {
      it(`${label} contains no ${phrase}`, () => {
        const text = load();
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(0);
        expect(text).not.toMatch(pattern);
      });
    });
  });

  it('extracts the homepage and /b2b metadata blocks (guards against silent no-op)', () => {
    expect(HOME_METADATA()).toMatch(/MediportBD|Bangladesh/);
    expect(B2B_METADATA()).toMatch(/quotation|B2B/i);
  });

  it('keeps the only allowed delivery form in metadata and TopBar', () => {
    const allowed = /Free delivery nationwide on orders over ৳50,000/;
    expect(B2B_METADATA()).toMatch(allowed);
    expect(topBarCopy()).toMatch(allowed);
  });
});

function seoSection(marker) {
  const source = readSrc('config/seo.js');
  const start = source.indexOf(marker);
  if (start === -1) return '';
  const end = source.indexOf('\n};', start);
  return source.slice(start, end === -1 ? source.length : end);
}

const SEO_SECTIONS = [
  ['SITE_CONFIG (description + keywords)', () => seoSection('export const SITE_CONFIG')],
  ['PAGE_SEO', () => seoSection('export const PAGE_SEO')],
  ['CATEGORY_SEO', () => seoSection('export const CATEGORY_SEO')],
  ['TopBar copy', topBarCopy],
];

const METADATA_CLAIM_PATTERNS = [
  ['percentage range (e.g. 8-30%)', /\d+\s*[\u2013-]\s*\d+\s*%/],
  ['credit terms', /credit\s*terms/i],
  ['financing', /financing/i],
  ['free installation', /free\s+installation/i],
  ['CE-marked', /CE[-\s]marked/i],
  ['DGDA registered (unhyphenated)', /DGDA\s+registered/i],
  ['cold chain', /cold[\s-]?chain/i],
  ['Genuine products / genuine', /genuine/i],
  ['most trusted', /most\s+trusted/i],
  ['fast delivery', /fast\s+delivery/i],
  ['best price', /best\s+price/i],
  ['lowest price', /lowest\s+price/i],
];

describe('metadata claim patterns stay out of PAGE_SEO, CATEGORY_SEO and TopBar', () => {
  SEO_SECTIONS.forEach(([label, load]) => {
    METADATA_CLAIM_PATTERNS.forEach(([phrase, pattern]) => {
      it(`${label} contains no ${phrase}`, () => {
        const text = load();
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(0);
        expect(text).not.toMatch(pattern);
      });
    });
  });

  it('extracts every metadata section (guards against a silent empty match)', () => {
    SEO_SECTIONS.forEach(([label, load]) => {
      expect({ label, empty: load().length === 0 }).toEqual({ label, empty: false });
    });
  });
});
