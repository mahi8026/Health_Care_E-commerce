import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ProductDetailPage from '../ProductDetailPage';
import { useCart } from '@/context/CartContext';
import GA4Tracker from '@/services/GA4Tracker';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

jest.mock('@/context/CartContext', () => ({
  useCart: jest.fn(() => ({
    addToCart: jest.fn(),
  })),
}));

jest.mock('@/services/GA4Tracker', () => ({
  trackViewItem: jest.fn(),
}));

jest.mock('@/components/product/ProductImageGallery', () => {
  return function MockProductImageGallery() {
    return <div data-testid="product-image-gallery">Image Gallery</div>;
  };
});

jest.mock('@/components/product/ProductInfoPanel', () => {
  return function MockProductInfoPanel() {
    return <div data-testid="product-info-panel">Info Panel</div>;
  };
});

jest.mock('@/components/product/ProductTabsRedesigned', () => {
  return function MockProductTabsRedesigned() {
    return <div data-testid="product-tabs">Tabs</div>;
  };
});

jest.mock('@/components/product/ProductReviews', () => {
  return function MockProductReviews() {
    return <div data-testid="product-reviews">Reviews</div>;
  };
});

jest.mock('@/components/product/FrequentlyBoughtRedesigned', () => {
  return function MockFrequentlyBought() {
    return <div data-testid="frequently-bought">Frequently Bought</div>;
  };
});

describe('ProductDetailPage - Slug-Based Redirect', () => {
  const mockReplace = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({
      replace: mockReplace,
      push: mockPush,
    });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should redirect from MongoDB ID to slug when product has slug', async () => {
    const mongoId = '507f1f77bcf86cd799439011'; // Valid 24-char hex MongoDB ID
    const productSlug = 'siemens-ecg-machine';

    const mockProduct = {
      _id: mongoId,
      name: 'Siemens ECG Machine',
      slug: productSlug,
      price: 150000,
      images: [],
      certifications: [],
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockProduct }),
    });

    render(<ProductDetailPage productId={mongoId} />);

    // Wait for product to load and redirect logic to execute
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(`/products/${productSlug}`);
    });

    // Verify router.replace was called, not router.push (to avoid browser history)
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should NOT redirect when current param is already a slug', async () => {
    const productSlug = 'siemens-ecg-machine';

    const mockProduct = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Siemens ECG Machine',
      slug: productSlug,
      price: 150000,
      images: [],
      certifications: [],
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockProduct }),
    });

    render(<ProductDetailPage productId={productSlug} />);

    // Wait for product to load
    await waitFor(() => {
      expect(screen.getByTestId('product-image-gallery')).toBeInTheDocument();
    });

    // Verify NO redirect occurred (slug is not a MongoDB ID)
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should NOT redirect when product has no slug', async () => {
    const mongoId = '507f1f77bcf86cd799439011';

    const mockProduct = {
      _id: mongoId,
      name: 'Product Without Slug',
      // No slug field
      price: 50000,
      images: [],
      certifications: [],
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockProduct }),
    });

    render(<ProductDetailPage productId={mongoId} />);

    // Wait for product to load
    await waitFor(() => {
      expect(screen.getByTestId('product-image-gallery')).toBeInTheDocument();
    });

    // Verify NO redirect occurred (no slug available)
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should NOT redirect when slug equals current param (prevent infinite loop)', async () => {
    const mongoId = '507f1f77bcf86cd799439011';

    const mockProduct = {
      _id: mongoId,
      name: 'Edge Case Product',
      slug: mongoId, // Slug is same as ID (edge case)
      price: 75000,
      images: [],
      certifications: [],
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockProduct }),
    });

    render(<ProductDetailPage productId={mongoId} />);

    // Wait for product to load
    await waitFor(() => {
      expect(screen.getByTestId('product-image-gallery')).toBeInTheDocument();
    });

    // Verify NO redirect occurred (slug equals current param)
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should correctly identify MongoDB ObjectId format (24 hex chars)', async () => {
    const validMongoIds = [
      '507f1f77bcf86cd799439011',
      'ABCDEF1234567890ABCDEF12',
      '000000000000000000000000',
    ];

    const invalidIds = [
      'short-slug',
      '507f1f77bcf86cd79943901', // 23 chars
      '507f1f77bcf86cd799439011X', // 25 chars
      '507f1f77bcf86cd79943901G', // Contains non-hex char
      'siemens-ecg-machine',
    ];

    const mongoIdRegex = /^[a-f0-9]{24}$/i;

    validMongoIds.forEach(id => {
      expect(mongoIdRegex.test(id)).toBe(true);
    });

    invalidIds.forEach(id => {
      expect(mongoIdRegex.test(id)).toBe(false);
    });
  });
});
