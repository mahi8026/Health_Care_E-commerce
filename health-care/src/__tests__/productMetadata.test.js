/**
 * Unit tests for product metadata generation
 * Tests the generateMetadata() function from src/app/products/[id]/page.jsx
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
  default: (props) => {
    return <img {...props} />;
  },
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

// Import the page module to access generateMetadata
// We need to dynamically import after mocks are set up
let generateMetadata;

describe('Product Metadata Generation', () => {
  beforeAll(async () => {
    // Import the module after mocks are configured
    const pageModule = await import('@/app/products/[id]/page');
    generateMetadata = pageModule.generateMetadata;
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Title Generation', () => {
    it('should generate title in format "{name} — Price in Bangladesh | MediportBD" with valid product', async () => {
      const mockProduct = {
        name: 'Siemens ECG Machine',
        price: 150000,
        brand: 'Siemens',
        slug: 'siemens-ecg-machine',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'siemens-ecg-machine' }) });

      expect(metadata.title).toBe('Siemens ECG Machine — Price in Bangladesh | MediportBD');
    });

    it('should use "Product" as fallback when name is missing', async () => {
      const mockProduct = {
        price: 100000,
        slug: 'test-product',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'test-product' }) });

      expect(metadata.title).toBe('Product — Price in Bangladesh | MediportBD');
    });

    it('should return "Product Not Found | MediportBD" title when product is null', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'nonexistent' }) });

      expect(metadata.title).toBe('Product Not Found | MediportBD');
    });

    it('should set robots noindex when product is not found', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'nonexistent' }) });

      expect(metadata.robots).toEqual({ index: false });
    });
  });

  describe('Description Generation', () => {
    it('should contain product name, brand, category, price, and "Buy online in Bangladesh"', async () => {
      const mockProduct = {
        name: 'Mindray Patient Monitor',
        price: 250000,
        brand: 'Mindray',
        category: 'Diagnostic Equipment',
        slug: 'mindray-patient-monitor',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'mindray-patient-monitor' }) });

      expect(metadata.description).toContain('Mindray Patient Monitor');
      expect(metadata.description).toContain('Buy');
      expect(metadata.description).toContain('online in Bangladesh');
      expect(metadata.description).toContain('Mindray');
      expect(metadata.description).toContain('Diagnostic Equipment');
      expect(metadata.description).toContain('৳250,000');
    });

    it('should be 155 characters or less', async () => {
      const mockProduct = {
        name: 'Siemens ECG Machine',
        price: 150000,
        brand: 'Siemens',
        category: 'Diagnostic Equipment',
        slug: 'siemens-ecg-machine',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'siemens-ecg-machine' }) });

      expect(metadata.description.length).toBeLessThanOrEqual(155);
    });

    it('should use "Contact for Price" when price is 0', async () => {
      const mockProduct = {
        name: 'Custom Medical Device',
        price: 0,
        brand: 'MedTech',
        category: 'Hospital Machines',
        slug: 'custom-device',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'custom-device' }) });

      expect(metadata.description).toContain('Contact for Price');
      expect(metadata.description).not.toContain('৳0');
    });

    it('should use "Contact for Price" when price is null', async () => {
      const mockProduct = {
        name: 'Custom Medical Device',
        price: null,
        brand: 'MedTech',
        slug: 'custom-device',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'custom-device' }) });

      expect(metadata.description).toContain('Contact for Price');
    });

    it('should handle missing brand gracefully', async () => {
      const mockProduct = {
        name: 'Generic ECG Machine',
        price: 120000,
        category: 'Diagnostic Equipment',
        slug: 'generic-ecg',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'generic-ecg' }) });

      expect(metadata.description).toContain('Generic ECG Machine');
      expect(metadata.description).toContain('Buy');
      expect(metadata.description).toContain('online in Bangladesh');
      expect(metadata.description.length).toBeLessThanOrEqual(155);
    });

    it('should handle missing category gracefully', async () => {
      const mockProduct = {
        name: 'Test Product',
        price: 50000,
        brand: 'TestBrand',
        slug: 'test-product',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'test-product' }) });

      expect(metadata.description).toContain('Test Product');
      expect(metadata.description).toContain('Buy');
      expect(metadata.description).toContain('online in Bangladesh');
      expect(metadata.description.length).toBeLessThanOrEqual(155);
    });
  });

  describe('Canonical URL Generation', () => {
    it('should use slug when available', async () => {
      const mockProduct = {
        name: 'Siemens ECG Machine',
        price: 150000,
        slug: 'siemens-ecg-machine',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'siemens-ecg-machine' }) });

      expect(metadata.alternates.canonical).toBe(`${SITE_CONFIG.url}/products/siemens-ecg-machine`);
    });

    it('should fall back to MongoDB ID when slug is missing', async () => {
      const mockProduct = {
        name: 'Test Product',
        price: 100000,
        _id: '507f1f77bcf86cd799439011',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: '507f1f77bcf86cd799439011' }) });

      expect(metadata.alternates.canonical).toBe(`${SITE_CONFIG.url}/products/507f1f77bcf86cd799439011`);
    });
  });

  describe('Open Graph Image Handling', () => {
    it('should use primary product image when available', async () => {
      const mockProduct = {
        name: 'Siemens ECG Machine',
        price: 150000,
        slug: 'siemens-ecg-machine',
        images: [
          { url: 'https://res.cloudinary.com/test/image1.jpg', isPrimary: true },
          { url: 'https://res.cloudinary.com/test/image2.jpg' },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'siemens-ecg-machine' }) });

      expect(metadata.openGraph.images[0].url).toBe('https://res.cloudinary.com/test/image1.jpg');
    });

    it('should use first image when no primary flag is set', async () => {
      const mockProduct = {
        name: 'Test Product',
        price: 100000,
        slug: 'test-product',
        images: [
          { url: 'https://res.cloudinary.com/test/first.jpg' },
          { url: 'https://res.cloudinary.com/test/second.jpg' },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'test-product' }) });

      expect(metadata.openGraph.images[0].url).toBe('https://res.cloudinary.com/test/first.jpg');
    });

    it('should fall back to SITE_CONFIG.ogImage when product has no images', async () => {
      const mockProduct = {
        name: 'Test Product',
        price: 100000,
        slug: 'test-product',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'test-product' }) });

      expect(metadata.openGraph.images[0].url).toBe(`${SITE_CONFIG.url}${SITE_CONFIG.ogImage}`);
    });

    it('should fall back to SITE_CONFIG.ogImage when images array is empty', async () => {
      const mockProduct = {
        name: 'Test Product',
        price: 100000,
        slug: 'test-product',
        images: [],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'test-product' }) });

      expect(metadata.openGraph.images[0].url).toBe(`${SITE_CONFIG.url}${SITE_CONFIG.ogImage}`);
    });
  });

  describe('Brand and Category Extraction', () => {
    it('should extract brand name from populated object', async () => {
      const mockProduct = {
        name: 'Mindray Patient Monitor',
        price: 250000,
        brand: { _id: '123', name: 'Mindray' },
        slug: 'mindray-monitor',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'mindray-monitor' }) });

      expect(metadata.description).toContain('Mindray');
    });

    it('should extract category name from populated object', async () => {
      const mockProduct = {
        name: 'Test Product',
        price: 100000,
        category: { _id: '456', name: 'Diagnostic Equipment' },
        slug: 'test-product',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'test-product' }) });

      expect(metadata.description).toContain('Diagnostic Equipment');
    });

    it('should handle brand as string', async () => {
      const mockProduct = {
        name: 'Test Product',
        price: 100000,
        brand: 'Siemens',
        slug: 'test-product',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'test-product' }) });

      expect(metadata.description).toContain('Siemens');
    });

    it('should handle category as string', async () => {
      const mockProduct = {
        name: 'Test Product',
        price: 100000,
        category: 'Laboratory Reagents',
        slug: 'test-product',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'test-product' }) });

      expect(metadata.description).toContain('Laboratory Reagents');
    });

    it('should handle populated brand object with missing name property', async () => {
      const mockProduct = {
        name: 'Test Product',
        price: 100000,
        brand: { _id: '123' },
        slug: 'test-product',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'test-product' }) });

      // Should not throw error and should generate valid description
      expect(metadata.description).toContain('Test Product');
      expect(metadata.description).toContain('Buy');
    });

    it('should handle populated category object with missing name property', async () => {
      const mockProduct = {
        name: 'Test Product',
        price: 100000,
        category: { _id: '456' },
        slug: 'test-product',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'test-product' }) });

      // Should not throw error and should generate valid description
      expect(metadata.description).toContain('Test Product');
      expect(metadata.description).toContain('Buy');
    });
  });

  describe('Open Graph and Twitter Card Metadata', () => {
    it('should include Open Graph metadata with correct structure', async () => {
      const mockProduct = {
        name: 'Siemens ECG Machine',
        price: 150000,
        brand: 'Siemens',
        slug: 'siemens-ecg-machine',
        images: [{ url: 'https://res.cloudinary.com/test/image.jpg' }],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'siemens-ecg-machine' }) });

      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph.title).toBe('Siemens ECG Machine — Price in Bangladesh | MediportBD');
      expect(metadata.openGraph.description).toContain('Siemens ECG Machine');
      expect(metadata.openGraph.url).toBe(`${SITE_CONFIG.url}/products/siemens-ecg-machine`);
      expect(metadata.openGraph.type).toBe('website');
      expect(metadata.openGraph.images).toHaveLength(1);
      expect(metadata.openGraph.images[0].width).toBe(1200);
      expect(metadata.openGraph.images[0].height).toBe(630);
    });

    it('should include Twitter Card metadata', async () => {
      const mockProduct = {
        name: 'Test Product',
        price: 100000,
        slug: 'test-product',
        images: [{ url: 'https://res.cloudinary.com/test/image.jpg' }],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'test-product' }) });

      expect(metadata.twitter).toBeDefined();
      expect(metadata.twitter.card).toBe('summary_large_image');
      expect(metadata.twitter.title).toBe('Test Product — Price in Bangladesh | MediportBD');
      expect(metadata.twitter.description).toContain('Test Product');
      expect(metadata.twitter.images).toHaveLength(1);
    });

    it('should include keywords in metadata', async () => {
      const mockProduct = {
        name: 'Siemens ECG Machine',
        price: 150000,
        brand: 'Siemens',
        category: 'Diagnostic Equipment',
        sku: 'ECG-001',
        slug: 'siemens-ecg-machine',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'siemens-ecg-machine' }) });

      expect(metadata.keywords).toBeDefined();
      expect(metadata.keywords).toContain('Siemens ECG Machine');
      expect(metadata.keywords).toContain('Siemens');
      expect(metadata.keywords).toContain('Diagnostic Equipment');
      expect(metadata.keywords).toContain('ECG-001');
      expect(metadata.keywords).toContain('Bangladesh');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle fetch errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'test-product' }) });

      expect(metadata.title).toBe('Product Not Found | MediportBD');
      expect(metadata.robots).toEqual({ index: false });
    });

    it('should handle API response with data property instead of product', async () => {
      const mockProduct = {
        name: 'Test Product',
        price: 100000,
        slug: 'test-product',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'test-product' }) });

      expect(metadata.title).toBe('Test Product — Price in Bangladesh | MediportBD');
    });

    it('should handle image as string instead of object', async () => {
      const mockProduct = {
        name: 'Test Product',
        price: 100000,
        slug: 'test-product',
        images: ['https://res.cloudinary.com/test/image.jpg'],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'test-product' }) });

      expect(metadata.openGraph.images[0].url).toBe('https://res.cloudinary.com/test/image.jpg');
    });

    it('should sanitize description by removing extra whitespace', async () => {
      const mockProduct = {
        name: 'Test    Product',
        price: 100000,
        brand: 'Test   Brand',
        category: 'Test  Category',
        slug: 'test-product',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'test-product' }) });

      // Description should not have multiple consecutive spaces
      expect(metadata.description).not.toMatch(/\s{2,}/);
    });

    it('should truncate description to 155 characters with ellipsis when too long', async () => {
      const mockProduct = {
        name: 'Very Long Product Name That Will Definitely Exceed The Character Limit For Meta Description',
        price: 100000,
        brand: 'Very Long Brand Name',
        category: 'Very Long Category Name That Adds More Characters',
        slug: 'long-product',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      });

      const metadata = await generateMetadata({ params: Promise.resolve({ id: 'long-product' }) });

      expect(metadata.description.length).toBeLessThanOrEqual(155);
      if (metadata.description.length === 155) {
        expect(metadata.description).toMatch(/…$/);
      }
    });
  });
});
