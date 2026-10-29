/**
 * Phase 2a — homepage body-claim guard.
 *
 * Reads the homepage surfaces as plain text and fails if a retired claim
 * phrase comes back. Deliberately dumb (string search, no parsing) so it
 * survives refactors of the components.
 */

const fs = require('fs');
const path = require('path');

const SRC_ROOT = path.resolve(__dirname, '..');

const FILES = [
  'app/page.jsx',
  'views/HomePage.jsx',
  'components/layout/Footer.jsx',
  'components/seo/TrustBand.jsx',
  'components/product/ProductInfo.jsx',
  'components/product/ProductTabsEnhanced.jsx',
];

const BANNED_PHRASES = [
  'same-day',
  'same day',
  'free installation',
  'cold chain',
  'cold-chain',
  'credit terms',
  '8–22',
  '8-30',
  '30–90',
  '30-90',
  'dedicated account',
  'most trusted',
  '#1 Medical',
  'genuine products',
  'round the clock',
  '64 districts',
  '2-5 business days',
  'Authorized medical supplier',
  'CE-Marked',
  'Genuine Brands',
  'DGDA-Registered Supplier',
];

// translations.js holds the EN block first (en: { … }) followed by bn: { … }.
// Only the EN block is guarded here — the Bengali block is out of scope for
// this test because it is being replaced separately.
function readTranslationsEn() {
  const source = fs.readFileSync(path.join(SRC_ROOT, 'config/translations.js'), 'utf8');
  const start = source.indexOf('en: {');
  const end = source.indexOf('bn: {');
  if (start === -1) return '';
  return source.slice(start, end === -1 ? source.length : end);
}

describe('homepage body copy contains no retired claims', () => {
  FILES.forEach((file) => {
    it(`${file} has no retired claim phrase`, () => {
      const text = fs.readFileSync(path.join(SRC_ROOT, file), 'utf8').toLowerCase();
      expect(text.length).toBeGreaterThan(0);

      const found = BANNED_PHRASES.filter((phrase) => text.includes(phrase.toLowerCase()));

      expect({ file, found }).toEqual({ file, found: [] });
    });
  });

  it('translations.js (EN block) has no retired claim phrase', () => {
    const text = readTranslationsEn().toLowerCase();
    expect(text.length).toBeGreaterThan(0);

    const found = BANNED_PHRASES.filter((phrase) => text.includes(phrase.toLowerCase()));

    expect({ file: 'config/translations.js (EN)', found }).toEqual({
      file: 'config/translations.js (EN)',
      found: [],
    });
  });

});
