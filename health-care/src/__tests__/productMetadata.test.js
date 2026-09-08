/**
 * Unit tests for product metadata generation.
 *
 * Tests the generateMetadata() function from src/app/products/[...id]/page.jsx â€”
 * the real catch-all product route. Covers:
 *   - Brand-first titles with dedup (brand already in the name â†’ no duplication)
 *   - Canonical slug URLs, OG cards, keywords, robust fallbacks.
 */

import { SITE_CONFIG } from '@/config/seo';

// Mock the fetch API
global.fetch = jest.fn();

// Mock the API constant
jest.mock('@/constants/api', () => ({
  API: 'http://localhost:5000/api',
}));

// Mock react-ga4 to prevent import errors
jest.mock('react-ga4', () => ({
  default: {
    initialize: jest.fn(),
    send: jest.fn(),
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img alt="" {...props} />,
}));

// Mock the ProductDetailPage component
jest.mock('@/views/ProductDetailPage', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

// Mock structured data utilities
jest.mock('@/utils/structuredData', () => ({
  __esModule: true,
  default: jest.fn(() => null),
  generateProductSchema: jest.fn(),
  generateBreadcrumbSchema: jest.fn(),
}));

// Mock FAQSchema component
jest.mock('@/components/seo/FAQSchema', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

let generateMetadata;

describe('Product Metadata Generation', () => {
  beforeAll(async () => {
    const pageModule = await import('@/app/products/[...id]/page');
    generateMetadata = pageModule.generateMetadata;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const seedFetch = (product) => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ product }),
    });
  };

  describe('Title Generation', () => {
    it('uses the brand when already in the name â€” no duplicate', async () => {
      seedFetch({
        name: 'Siemens ECG Machine',
        price: 150000,
        brand: 'Siemens',
        slug: 'siemens-ecg-machine',
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'siemens-ecg-machine' }) });

      expect(metadata.title).toBe('Siemens ECG Machine | Price in Bangladesh');
      expect(metadata.title).not.toContain('Siemens Siemens');
    });

    it('prepends brand when the name lacks it (brand + type + model pattern)', async () => {
      seedFetch({
        name: 'Digital Blood Pressure Monitor AX150',
        price: 1200,
        brand: 'Jumper',
        slug: 'jumper-digital-bp-monitor-ax150',
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'jumper-digital-bp-monitor-ax150' }) });

      expect(metadata.title).toBe('Jumper Digital Blood Pressure Monitor AX150 | Price in Bangladesh');
    });

    it('omits the brand when none is set', async () => {
      seedFetch({
        name: 'Test Product',
        price: 100000,
        slug: 'test-product',
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'test-product' }) });

      expect(metadata.title).toBe('Test Product | Price in Bangladesh');
    });

    it('falls back to "Product" whenethe name is missing', async () => {
      seedFetch({ price: 100000, slug: 'test-product' });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'test-product' }) });

      expect(metadata.title).toBe('Product | Price in Bangladesh');
    });

    it('returns noindex-only metadata for raw ObjectId URLs', async () => {
      const metadata = await generateMetadata({ params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }) });

      expect(metadata).toEqual({ robots: { index: false, follow: false } });
    });

    it('returns a noindex fallback when the backend errors (cold start)', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'nonexistent' }) });

      expect(metadata.title).toBe('Product Details | MediportBD');
      expect(metadata.description).toBe('Medical equipment product details.');
      expect(metadata.robots).toEqual({ index: false, follow: false });
    });
  });

  describe('Canonical & Open Graph', () => {
    it('canonicalizes to the clean slug URL', async () => {
      seedFetch({
        name: 'Mindray Patient Monitor',
        price: 250000,
        brand: 'Mindray',
        slug: 'mindray-patient-monitor',
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'mindray-patient-monitor' }) });

      expect(metadata.alternates.canonical).toBe(`${SITE_CONFIG.url}/products/mindray-patient-monitor`);
    });

    it('mirrors the title in OG and uses the branded OG card URL', async () => {
      seedFetch({
        name: 'Mindray Patient Monitor',
        price: 250000,
        brand: 'Mindray',
        category: 'Diagnostic Equipment',
        slug: 'mindray-patient-monitor',
        images: [{ url: 'https://res.cloudinary.com/test/image.jpg' }],
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'mindray-patient-monitor' }) });

      expect(metadata.openGraph.title).toBe('Mindray Patient Monitor | Price in Bangladesh');
      expect(metadata.openGraph.url).toBe(`${SITE_CONFIG.url}/products/mindray-patient-monitor`);
      expect(metadata.openGraph.images[0].url).toContain('/og?');
      expect(metadata.openGraph.images[0].width).toBe(1200);
      expect(metadata.twitter.card).toBe('summary_large_image');
    });
  });

  describe('Keywords & Description', () => {
    it('builds the rich SEO description and keywords from product fields', async () => {
      seedFetch({
        name: 'Mindray Patient Monitor',
        price: 250000,
        brand: 'Mindray',
        category: 'Diagnostic Equipment',
        sku: 'MON-001',
        slug: 'mindray-patient-monitor',
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'mindray-patient-monitor' }) });

      expect(metadata.description).toContain('Buy Mindray Patient Monitor online in Bangladesh.');
      expect(metadata.description).toContain('Brand: Mindray.');
      expect(metadata.description).toContain('Category: Diagnostic Equipment.');
      expect(metadata.description).toContain('250,000');
      expect(metadata.description.length).toBeLessThanOrEqual(155);
      expect(metadata.keywords).toContain('Mindray Patient Monitor price Bangladesh');
      expect(metadata.keywords).toContain('Mindray Bangladesh');
    });

    it('uses "Contact for Price" when price is missing or zero', async () => {
      seedFetch({
        name: 'Custom Medical Device',
        brand: 'MedTech',
        category: 'Hospital Machines',
        slug: 'custom-device',
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'custom-device' }) });

      expect(metadata.description).toContain('Price: Contact for Price.');
    });
  });
});
