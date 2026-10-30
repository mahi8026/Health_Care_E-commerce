// health-care/src/__tests__/quoteCta.test.js
//
// Guards the "Request a quotation" CTA and the `quote_cta_click` contract.
//
// The four page types are async server components that fetch during render
// (home, category, brand hub) or client panels needing cart/auth context
// (product detail panel), so they cannot be rendered here without stubbing the
// whole data layer. This file therefore asserts two things that compose to the
// required behaviour:
//   1. each of the four page types wires QuoteCtaLink with the correct
//      /quotes/request?source=... URL (file-level wiring), and
//   2. QuoteCtaLink itself renders a real <a href> containing exactly
//      "Request a quotation" — server-rendered and client-rendered.

import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen, fireEvent } from '@testing-library/react';
import QuoteCtaLink from '@/components/conversion/QuoteCtaLink';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => ({ get: () => null }),
}));

const trackQuoteCtaClick = jest.fn();

jest.mock('@/services/funnelTracking', () => ({
  __esModule: true,
  trackQuoteCtaClick: (...args) => trackQuoteCtaClick(...args),
}));

const SRC = path.resolve(__dirname, '..');

const PAGE_TYPES = [
  { label: 'home', file: 'app/page.jsx', source: 'home' },
  { label: 'category', file: 'app/products/category/[slug]/page.jsx', source: 'category' },
  { label: 'product', file: 'components/product/ProductInfoPanelEnhanced.jsx', source: 'product' },
  { label: 'brand hub', file: 'app/brands/[slug]/page.jsx', source: 'brand_hub' },
];

describe('QuoteCtaLink', () => {
  beforeEach(() => trackQuoteCtaClick.mockClear());

  it('server-renders an <a> with the href and the exact CTA text', () => {
    const html = renderToStaticMarkup(
      <QuoteCtaLink href="/quotes/request?source=home" source="home" pageType="home" />
    );

    expect(html).toContain('<a');
    expect(html).toContain('href="/quotes/request?source=home"');
    expect(html).toContain('Request a quotation');
    expect(html).toContain('min-h-[44px]'); // >= 44px tap target
  });

  it('reports quote_cta_click with source and page type on click', () => {
    render(
      <QuoteCtaLink href="/quotes/request?source=category" source="category" pageType="category" />
    );

    fireEvent.click(screen.getByRole('link', { name: 'Request a quotation' }));

    expect(trackQuoteCtaClick).toHaveBeenCalledWith({ pageType: 'category', source: 'category' });
  });
});

describe('the four page types host the quotation CTA', () => {
  it.each(PAGE_TYPES)('$label page links to /quotes/request via QuoteCtaLink', ({ file, source }) => {
    const contents = fs.readFileSync(path.join(SRC, file), 'utf8');

    expect(contents).toContain('QuoteCtaLink');
    expect(contents).toMatch(new RegExp(`/quotes/request\\?source=${source}`));
  });

  it('CTA text is fixed and carries no price', () => {
    const contents = fs.readFileSync(
      path.join(SRC, 'components/conversion/QuoteCtaLink.jsx'),
      'utf8'
    );

    expect(contents).toContain("children = 'Request a quotation'");
    expect(contents).not.toMatch(/৳|price=/);
  });
});
