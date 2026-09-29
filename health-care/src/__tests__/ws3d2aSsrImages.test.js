/**
 * WS-3D2-A — Listing image SSR architecture (F-03)
 *
 * The shared ProductCard previously gated the product image behind an
 * IntersectionObserver (`isVisible` starting false), so every server-rendered
 * listing card emitted a skeleton instead of the product image. WS-3D2-A makes
 * image DOM existence data-driven: SSR renders the image whenever the product
 * props already contain one. These tests protect that contract and the
 * Phase 3C/3D protections that surround it.
 */
import React from 'react';
import fs from 'fs';
import path from 'path';
import { renderToString } from 'react-dom/server';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { act } from 'react';

import ProductCard from '@/components/ProductCard';
import { getProductCardImage } from '@/utils/cloudinary';
import { generateProductAltText } from '@/utils/bangladeshSEO';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/context/CartContext', () => ({
  useCart: () => ({ addToCart: jest.fn() }),
}));

jest.mock('@/context/CompareContext', () => ({
  useCompare: () => ({ toggleCompare: jest.fn(), isInCompare: () => false }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock('@/hooks/useT', () => ({
  useT: () => (key) => key,
}));

jest.mock('@/components/wishlist/WishlistButton', () => () => null);

const HOSP = '\u{1F3E5}'; // 🏥 missing-image fallback glyph
const RAW_IMG = 'https://res.cloudinary.com/dm8eqxwlz/image/upload/v1712345678/mediport/products/massager.jpg';
const EXPECTED_SRC = 'https://res.cloudinary.com/dm8eqxwlz/image/upload/f_auto,q_auto,w_400,h_400,c_fill,dpr_auto/v1712345678/mediport/products/massager.jpg';
const SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px';

const withImage = {
  _id: 'p1',
  slug: 'nittonova-massager',
  name: 'Nittonova Massager',
  brand: { name: 'Nittonova' },
  category: { name: 'Massager' },
  price: 12500,
  stock: 5,
  images: [{ url: RAW_IMG, isPrimary: true, alt: '' }],
};

const withoutImage = {
  _id: 'p2',
  slug: 'no-image-product',
  name: 'No Image Product',
  brand: { name: 'Secure' },
  category: { name: 'Medical Supplies' },
  price: 900,
  stock: 3,
  images: [],
};

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

describe('WS-3D2-A — Test F: transform regression', () => {
  test('getProductCardImage keeps the exact Cloudinary card transform', () => {
    expect(getProductCardImage(RAW_IMG)).toBe(EXPECTED_SRC);
  });
});

describe('WS-3D2-A — Test A: SSR with image', () => {
  test('server-rendered HTML contains the product image with all card attributes and no skeleton', () => {
    const html = renderToString(<ProductCard product={withImage} />);

    expect(html).toContain('<img');
    expect(html).toContain(EXPECTED_SRC);
    expect(html).toContain(`alt="${generateProductAltText(withImage, 'main')}"`);
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('data-nimg="fill"');
    expect(html).toContain('position:absolute');
    expect(html).toContain('aspect-square');
    expect(html).not.toContain('animate-pulse');
    expect(html).not.toContain('loading="eager"');
    expect(html).not.toContain('fetchpriority="high"');
    // unoptimized behavior: src points at Cloudinary, not the Next proxy
    expect(html).not.toContain('/_next/image?url=');
  });
});

describe('WS-3D2-A — Test B: SSR without image', () => {
  test('missing image data keeps the pre-existing missing-image fallback and renders no img', () => {
    const html = renderToString(<ProductCard product={withoutImage} />);

    expect(html).not.toContain('<img');
    expect(html).not.toContain('res.cloudinary.com');
    expect(html).toContain(HOSP);
    expect(html).toContain('aspect-square');
  });
});

describe('WS-3D2-A — Test C: hydration parity', () => {
  test('first client render keeps the SSR image decision with zero hydration errors', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = renderToString(<ProductCard product={withImage} />);
    expect(container.querySelector('img')).toBeTruthy();

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      hydrateRoot(container, <ProductCard product={withImage} />);
    });

    const hydrationErrors = errorSpy.mock.calls.filter((call) =>
      /hydrat|did not match|server rendered HTML didn't match/i.test(String(call[0]))
    );
    expect(hydrationErrors).toEqual([]);
    expect(container.querySelector('img')).toBeTruthy();
    expect(container.querySelector('.animate-pulse')).toBeNull();

    container.remove();
  });
});

describe('WS-3D2-A — Test D: broken image failure safety', () => {
  test('onError hides the img and reveals the fallback without throwing', () => {
    const { container } = render(<ProductCard product={withImage} />);
    const img = container.querySelector('img');
    expect(img).toBeTruthy();

    expect(() => fireEvent.error(img)).not.toThrow();

    expect(img.style.display).toBe('none');
    const fallback = container.querySelector('.image-fallback');
    expect(fallback).toBeTruthy();
    expect(fallback.classList.contains('hidden')).toBe(false);
    expect(fallback.classList.contains('flex')).toBe(true);
  });
});

describe('WS-3D2-A — Test E: alt regression (F-05/F-13)', () => {
  test('alt text never contains object stringification, price, or Generic fallback', () => {
    const cases = [
      withImage,
      {
        name: 'Clot Activator',
        brand: { name: 'Generic' },
        category: { name: 'Laboratory Reagents' },
        price: 4500,
        images: [{ url: RAW_IMG, isPrimary: true }],
      },
      {
        name: 'K3 EDTA Tube',
        brand: 'Secure',
        category: 'Blood Bank Supplies',
        price: 300,
        images: [{ url: RAW_IMG, isPrimary: true }],
      },
    ];

    for (const product of cases) {
      const html = renderToString(<ProductCard product={product} />);
      const altMatch = html.match(/alt="([^"]*)"/);
      expect(altMatch).toBeTruthy();
      const alt = altMatch[1];
      expect(alt).not.toContain('[object Object]');
      expect(alt).not.toMatch(/[৳$]\s?\d/);
      expect(alt).not.toMatch(/Generic/);
      expect(alt).toContain('Bangladesh');
      expect(alt).toContain('MediportBD');
    }
  });
});

describe('WS-3D2-A — Test G: attribute regression', () => {
  test('card image keeps fill container, lazy loading, async decoding and 400x400 transform', () => {
    const html = renderToString(<ProductCard product={withImage} />);

    expect(html).toContain('aspect-square'); // fill parent container preserved
    expect(html).toContain('data-nimg="fill"'); // next/image fill behavior preserved
    expect(html).toContain('position:absolute');
    expect(html).toContain('w_400,h_400,c_fill'); // F-16 card variant unchanged
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
  });

  test('responsive sizes prop is preserved in the component source (F-22 untouched)', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'components', 'ProductCard.jsx'),
      'utf8'
    );
    // Next omits sizes/srcset in emitted HTML for unoptimized images (before
    // and after this change alike) — the preserved contract lives at the prop.
    expect(source).toContain(`sizes="${SIZES}"`);
    expect(source).toContain('unoptimized');
  });
});

describe('WS-3D2-A — Test H: observer regression', () => {
  test('client render works with IntersectionObserver undefined and image presence is data-driven', () => {
    expect(typeof global.IntersectionObserver).toBe('undefined'); // jsdom has no IO; old code would throw

    const withImageRender = render(<ProductCard product={withImage} />);
    expect(withImageRender.container.querySelector('img')).toBeTruthy();
    expect(withImageRender.container.querySelector('.animate-pulse')).toBeNull();

    cleanup();

    const withoutImageRender = render(<ProductCard product={withoutImage} />);
    expect(withoutImageRender.container.querySelector('img')).toBeNull();
  });

  test('ProductCard source no longer contains the observer gate or skeleton branch', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'components', 'ProductCard.jsx'),
      'utf8'
    );
    expect(source).not.toContain('new IntersectionObserver(');
    expect(source).not.toContain('isVisible');
    expect(source).not.toContain('cardRef');
    expect(source).not.toContain('animate-pulse');
    expect(source).toContain('{primaryImage ? (');
  });
});

describe('WS-3D2-A — Test I: multi-family consumer guard + zero API regression', () => {
  const root = path.join(__dirname, '..');

  test('all five listing families still render the shared ProductCard', () => {
    const listingHosts = [
      path.join(root, 'components', 'search', 'SearchResults.jsx'), // /products + category pages
      path.join(root, 'views', 'BrandPage.jsx'),
      path.join(root, 'app', 'equipment', '[slug]', 'page.jsx'),
      path.join(root, 'app', 'topics', '[slug]', 'page.jsx'),
    ];
    for (const file of listingHosts) {
      const source = fs.readFileSync(file, 'utf8');
      expect(source).toContain("import ProductCard from '@/components/ProductCard'");
    }
  });

  test('ProductCard adds no network access (zero API request regression)', () => {
    const source = fs.readFileSync(
      path.join(root, 'components', 'ProductCard.jsx'),
      'utf8'
    );
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toContain('serverFetchJson');
    expect(source).not.toContain('axios');
  });
});
