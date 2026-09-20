/**
 * Unit Tests for Product SEO Components
 * 
 * Tests for:
 * - generateProductSchema (structuredData utility)
 * - generateBreadcrumbSchema (structuredData utility)
 * - FAQSchema component (+ generateProductFAQs)
 * 
 * Requirements: 3, 4, 5, 8
 */

import { render } from '@testing-library/react';
import { generateProductSchema, generateBreadcrumbSchema } from '@/utils/structuredData';
import FAQSchema, { generateProductFAQs } from '@/components/seo/FAQSchema';

// Mock the SEO config
jest.mock('@/config/seo', () => ({
  SITE_CONFIG: {
    name: 'MediportBD',
    url: 'https://MediportBD.com',
    phone: '+8801646886795',
    email: 'info@MediportBD.com',
  },
  siteConfig: {
    name: 'MediportBD',
    url: 'https://MediportBD.com',
  },
  organization: {
    name: 'MediportBD',
    url: 'https://MediportBD.com',
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock context providers
jest.mock('@/context/WishlistContext', () => ({
  useWishlist: () => ({
    isInWishlist: jest.fn(() => false),
    toggleWishlist: jest.fn(),
  }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: jest.fn(() => false),
  }),
}));


describe('generateProductSchema', () => {
  it('should include all required fields', () => {
    const product = {
      name: 'Siemens ECG Machine',
      description: 'Professional 12-lead ECG machine',
      brand: 'Siemens',
      sku: 'ECG-SIE-001',
      price: 150000,
      slug: 'siemens-ecg-machine',
      inStock: true,
      images: [
        { url: 'https://example.com/image1.jpg' },
        { url: 'https://example.com/image2.jpg' },
      ],
    };

    const schema = generateProductSchema(product);

    expect(schema).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Siemens ECG Machine',
      description: 'Professional 12-lead ECG machine',
      sku: 'ECG-SIE-001',
      url: 'https://MediportBD.com/products/siemens-ecg-machine',
    });

    expect(schema.brand).toEqual({
      '@type': 'Brand',
      name: 'Siemens',
    });

    expect(schema.image).toEqual([
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ]);

    expect(schema.offers).toMatchObject({
      '@type': 'Offer',
      priceCurrency: 'BDT',
      price: '150000.00',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    });

    expect(schema.offers.seller).toEqual({
      '@type': 'Organization',
      name: 'MediportBD',
      url: 'https://MediportBD.com',
    });
  });

  it('should include aggregateRating only when rating exists', () => {
    const productWithRating = {
      name: 'ECG Machine',
      description: 'Test',
      price: 100000,
      rating: 4.5,
      reviewCount: 10,
    };

    const productWithoutRating = {
      name: 'ECG Machine',
      description: 'Test',
      price: 100000,
    };

    const schemaWithRating = generateProductSchema(productWithRating);
    const schemaWithoutRating = generateProductSchema(productWithoutRating);

    expect(schemaWithRating.aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      reviewCount: 10,
      bestRating: '5',
      worstRating: '1',
    });

    expect(schemaWithoutRating.aggregateRating).toBeUndefined();
  });

  it('should handle rating as object with average and count', () => {
    const product = {
      name: 'ECG Machine',
      description: 'Test',
      price: 100000,
      rating: { average: 4.7, count: 25 },
    };

    const schema = generateProductSchema(product);

    expect(schema.aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: '4.7',
      reviewCount: 25,
      bestRating: '5',
      worstRating: '1',
    });
  });

  it('should include additionalProperty for certifications', () => {
    const product = {
      name: 'ECG Machine',
      description: 'Test',
      price: 100000,
      certifications: ['DGDA', 'CE', 'ISO 13485'],
    };

    const schema = generateProductSchema(product);

    expect(schema.additionalProperty).toEqual([
      { '@type': 'PropertyValue', name: 'DGDA', value: 'Certified' },
      { '@type': 'PropertyValue', name: 'CE', value: 'Certified' },
      { '@type': 'PropertyValue', name: 'ISO 13485', value: 'Certified' },
    ]);
  });

  it('should not include additionalProperty when certifications is empty', () => {
    const product = {
      name: 'ECG Machine',
      description: 'Test',
      price: 100000,
      certifications: [],
    };

    const schema = generateProductSchema(product);

    expect(schema.additionalProperty).toBeUndefined();
  });

  it('should return null gracefully when product is null', () => {
    const schema = generateProductSchema(null);

    expect(schema).toBeNull();
  });

  it('should return null gracefully when product is undefined', () => {
    const schema = generateProductSchema(undefined);

    expect(schema).toBeNull();
  });

  it('should handle brand as populated object', () => {
    const product = {
      name: 'ECG Machine',
      description: 'Test',
      price: 100000,
      brand: { _id: '123', name: 'Siemens' },
    };

    const schema = generateProductSchema(product);

    expect(schema.brand).toEqual({
      '@type': 'Brand',
      name: 'Siemens',
    });
  });

  it('should use slug in URL when available', () => {
    const product = {
      name: 'ECG Machine',
      description: 'Test',
      price: 100000,
      slug: 'ecg-machine-pro',
      _id: '507f1f77bcf86cd799439011',
    };

    const schema = generateProductSchema(product);

    expect(schema.url).toBe('https://MediportBD.com/products/ecg-machine-pro');
  });

  it('should fallback to _id in URL when slug is missing', () => {
    const product = {
      name: 'ECG Machine',
      description: 'Test',
      price: 100000,
      _id: '507f1f77bcf86cd799439011',
    };

    const schema = generateProductSchema(product);

    expect(schema.url).toBe('https://MediportBD.com/products/507f1f77bcf86cd799439011');
  });

  it('should set availability to OutOfStock when inStock is false', () => {
    const product = {
      name: 'ECG Machine',
      description: 'Test',
      price: 100000,
      inStock: false,
    };

    const schema = generateProductSchema(product);

    expect(schema.offers.availability).toBe('https://schema.org/OutOfStock');
  });

  it('should include priceValidUntil as 1 year from now', () => {
    const product = {
      name: 'ECG Machine',
      description: 'Test',
      price: 100000,
    };

    const schema = generateProductSchema(product);

    // Check that priceValidUntil is a valid date string
    expect(schema.offers.priceValidUntil).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Check that it's approximately 1 year from now
    const validUntil = new Date(schema.offers.priceValidUntil);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    // Allow 1 day difference for test execution time
    const daysDifference = Math.abs(validUntil - oneYearFromNow) / (1000 * 60 * 60 * 24);
    expect(daysDifference).toBeLessThan(1);
  });
});

describe('generateBreadcrumbSchema', () => {
  it('should generate 3 ListItems with correct positions and URLs', () => {
    const breadcrumbs = [
      { name: 'Home', url: 'https://MediportBD.com/' },
      { name: 'Diagnostic Equipment', url: 'https://MediportBD.com/products?category=diagnostic' },
      { name: 'Siemens ECG Machine', url: 'https://MediportBD.com/products/siemens-ecg-machine' },
    ];

    const schema = generateBreadcrumbSchema(breadcrumbs);

    expect(schema).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
    });

    expect(schema.itemListElement).toHaveLength(3);

    expect(schema.itemListElement[0]).toEqual({
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://MediportBD.com/',
    });

    expect(schema.itemListElement[1]).toEqual({
      '@type': 'ListItem',
      position: 2,
      name: 'Diagnostic Equipment',
      item: 'https://MediportBD.com/products?category=diagnostic',
    });

    expect(schema.itemListElement[2]).toEqual({
      '@type': 'ListItem',
      position: 3,
      name: 'Siemens ECG Machine',
      item: 'https://MediportBD.com/products/siemens-ecg-machine',
    });
  });

  it('should use "Products" as fallback category name', () => {
    const breadcrumbs = [
      { name: 'Home', url: 'https://MediportBD.com/' },
      { name: 'Products', url: 'https://MediportBD.com/products' },
      { name: 'ECG Machine', url: 'https://MediportBD.com/products/ecg-machine' },
    ];

    const schema = generateBreadcrumbSchema(breadcrumbs);

    expect(schema.itemListElement[1].name).toBe('Products');
  });

  it('should return null when breadcrumbs is null', () => {
    const schema = generateBreadcrumbSchema(null);

    expect(schema).toBeNull();
  });

  it('should return null when breadcrumbs is undefined', () => {
    const schema = generateBreadcrumbSchema(undefined);

    expect(schema).toBeNull();
  });

  it('should return null when breadcrumbs is empty array', () => {
    const schema = generateBreadcrumbSchema([]);

    expect(schema).toBeNull();
  });

  it('should return null when breadcrumbs is not an array', () => {
    const schema = generateBreadcrumbSchema('not an array');

    expect(schema).toBeNull();
  });

  it('should handle any number of breadcrumb items', () => {
    const breadcrumbs = [
      { name: 'Home', url: 'https://MediportBD.com/' },
      { name: 'Category', url: 'https://MediportBD.com/category' },
      { name: 'Subcategory', url: 'https://MediportBD.com/subcategory' },
      { name: 'Product', url: 'https://MediportBD.com/product' },
    ];

    const schema = generateBreadcrumbSchema(breadcrumbs);

    expect(schema.itemListElement).toHaveLength(4);
    expect(schema.itemListElement[3].position).toBe(4);
  });
});

describe('FAQSchema Component', () => {
  it('renders a <script> tag with valid FAQPage JSON-LD when faqs are provided', () => {
    const product = {
      name: 'Siemens ECG Machine',
      price: 150000,
    };
    const faqs = generateProductFAQs(product);

    const { container } = render(<FAQSchema faqs={faqs} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();

    const schema = JSON.parse(script.innerHTML);
    expect(schema).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
    });
    expect(schema.mainEntity.length).toBeGreaterThan(0);
    // Every question must carry a non-empty answer.
    for (const item of schema.mainEntity) {
      expect(item['@type']).toBe('Question');
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.acceptedAnswer.text.length).toBeGreaterThan(0);
    }
  });

  it('returns null when faqs are empty', () => {
    const { container } = render(<FAQSchema faqs={[]} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeInTheDocument();
  });

  it('returns null when faqs is null', () => {
    const { container } = render(<FAQSchema faqs={null} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeInTheDocument();
  });

  it('returns null when only the legacy product prop is passed (faqs required)', () => {
    // The component API takes pre-computed faqs (generateProductFAQs);
    // a bare product prop yields no schema.
    const { container } = render(<FAQSchema product={{ name: 'Test Product', price: 50000 }} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeInTheDocument();
  });

  it('includes the DGDA registration question from the common FAQs', () => {
    const product = { name: 'ECG Machine', price: 100000 };
    const faqs = generateProductFAQs(product);

    const { container } = render(<FAQSchema faqs={faqs} />);
    const schema = JSON.parse(container.querySelector('script[type="application/ld+json"]').innerHTML);

    const dgda = schema.mainEntity.find((q) => q.name.includes('DGDA'));
    expect(dgda).toBeDefined();
    // The answer reads "DGDA (Directorate General of Drug Administration)
    // registered..." — DGDA appears in the question, "registered" in the answer.
    expect(dgda.acceptedAnswer.text).toContain('registered');
  });

  it('mentions the warranty period in the warranty answer', () => {
    const product = { name: 'ECG Machine', price: 100000 };
    const faqs = generateProductFAQs(product);

    const { container } = render(<FAQSchema faqs={faqs} />);
    const schema = JSON.parse(container.querySelector('script[type="application/ld+json"]').innerHTML);

    const warranty = schema.mainEntity.find((q) => q.name.toLowerCase().includes('warranty'));
    expect(warranty).toBeDefined();
    expect(warranty.acceptedAnswer.text).toContain('warranty');
  });

  it('passes custom product FAQs through verbatim, ahead of the common ones', () => {
    const product = {
      name: 'Custom Device',
      price: 0,
      faqs: [
        {
          question: 'What is the price of Custom Device?',
          answer: 'Contact us for a custom quotation — price on request.',
        },
      ],
    };
    const faqs = generateProductFAQs(product);

    const { container } = render(<FAQSchema faqs={faqs} />);
    const schema = JSON.parse(container.querySelector('script[type="application/ld+json"]').innerHTML);

    expect(schema.mainEntity[0].name).toContain('Custom Device');
    expect(schema.mainEntity[0].acceptedAnswer.text).toContain('custom quotation');
  });

  it('caps the generated FAQ list at 6 entries', () => {
    const product = { name: 'Test Product', price: 50000 };
    const faqs = generateProductFAQs(product);

    const { container } = render(<FAQSchema faqs={faqs} />);
    const schema = JSON.parse(container.querySelector('script[type="application/ld+json"]').innerHTML);

    expect(schema.mainEntity.length).toBeLessThanOrEqual(6);
  });
});
