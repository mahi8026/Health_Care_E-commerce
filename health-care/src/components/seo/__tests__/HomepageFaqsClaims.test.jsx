/**
 * Phase 1 site-claims guard — homepage FAQ copy + FAQPage JSON-LD.
 *
 * Regression guard for the live placeholder defect: the DGDA answer used to
 * ship "(License No: [Add License Number])" to production, in both the visible
 * FAQ text and the FAQPage schema. Any placeholder licence fragment must fail
 * here, and the approved wording must stay in place.
 */

import { render } from '@testing-library/react';
import HomepageFAQs, { HOMEPAGE_FAQS } from '../HomepageFAQs';

const PLACEHOLDER_FRAGMENTS = [/\[Add/i, /license no/i, /add license/i];
// Phrases retired by the Phase 1 claim cleanup — must never return to FAQ copy
// or to the FAQPage JSON-LD.
const RETIRED_CLAIM_FRAGMENTS = [
  /same[\s-]?day/i,
  /8-30|8–30/,
  /30-90|30–90/,
  /free installation/i,
  /dedicated account/i,
  /certified technician/i,
  /cold[\s-]?chain/i,
];
const APPROVED_DGDA_SENTENCE =
  'Registration details for specific products are available on request.';

const DGDA_ENV_NUMBER = (process.env.NEXT_PUBLIC_DGDA_REGISTRATION_NUMBER || '').trim();

function collectRenderedText(container) {
  const scripts = Array.from(container.querySelectorAll('script[type="application/ld+json"]'));
  return {
    visible: container.textContent || '',
    jsonLd: scripts.map((script) => script.innerHTML || '').join('\n'),
    scriptCount: scripts.length,
  };
}

describe('homepage FAQ claims guard', () => {
  it('never ships a placeholder licence fragment in FAQ copy', () => {
    expect(Array.isArray(HOMEPAGE_FAQS)).toBe(true);
    expect(HOMEPAGE_FAQS.length).toBeGreaterThan(0);

    HOMEPAGE_FAQS.forEach(({ question, answer }) => {
      const copy = `${question} ${answer}`;
      PLACEHOLDER_FRAGMENTS.forEach((fragment) => {
        expect(copy).not.toMatch(fragment);
      });
    });
  });

  it('never ships a placeholder licence fragment in rendered output or JSON-LD', () => {
    const { container } = render(<HomepageFAQs />);
    const { visible, jsonLd, scriptCount } = collectRenderedText(container);

    expect(scriptCount).toBeGreaterThan(0);

    PLACEHOLDER_FRAGMENTS.forEach((fragment) => {
      expect(visible).not.toMatch(fragment);
      expect(jsonLd).not.toMatch(fragment);
    });
  });

  it('keeps the approved DGDA answer wording', () => {
    const dgdaFaq = HOMEPAGE_FAQS.find((faq) => /dgda/i.test(faq.question));
    expect(dgdaFaq).toBeDefined();
    expect(dgdaFaq.answer).toContain(APPROVED_DGDA_SENTENCE);
    expect(dgdaFaq.answer).toContain('DGDA-registered importers and manufacturers');
  });

  it('omits the registration fragment entirely when no number is configured', () => {
    if (DGDA_ENV_NUMBER) {
      // A real number is configured in this environment — the fragment is allowed.
      return;
    }

    const { container } = render(<HomepageFAQs />);
    const { visible, jsonLd } = collectRenderedText(container);

    expect(visible).not.toMatch(/DGDA registration no/i);
    expect(jsonLd).not.toMatch(/DGDA registration no/i);
  });
  it('never ships a retired claim phrase in FAQ copy', () => {
    HOMEPAGE_FAQS.forEach(({ question, answer }) => {
      const copy = `${question} ${answer}`;
      RETIRED_CLAIM_FRAGMENTS.forEach((fragment) => {
        expect(copy).not.toMatch(fragment);
      });
    });
  });

  it('never ships a retired claim phrase in rendered output or JSON-LD', () => {
    const { container } = render(<HomepageFAQs />);
    const { visible, jsonLd } = collectRenderedText(container);

    RETIRED_CLAIM_FRAGMENTS.forEach((fragment) => {
      expect(visible).not.toMatch(fragment);
      expect(jsonLd).not.toMatch(fragment);
    });
  });


});
