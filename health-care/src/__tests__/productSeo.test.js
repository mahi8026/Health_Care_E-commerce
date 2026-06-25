/**
 * Unit Tests for Product SEO Components
 * 
 * Tests for:
 * - generateAltText (ProductImageGallery)
 * - generateProductSchema (structuredData utility)
 * - generateBreadcrumbSchema (structuredData utility)
 * - FAQSchema component
 * 
 * Requirements: 3, 4, 5, 8
 */

import { render } from '@testing-library/react';
import { generateProductSchema, generateBreadcrumbSchema } from '@/utils/structuredData';
import FAQSchema from '@/components/seo/FAQSchema';

// Mock the SEO config
jest.mock('@/config/seo', () => ({
  SITE_CONFIG: {
    name: 'MedCore BD',
    url: 'https://medcorebd.com',
    phone: '+8801646886795',
    email: 'info@medcorebd.com',
  },
  siteConfig: {
    name: 'MedCore BD',
    url: 'https://medcorebd.com',
  },
  organization: {
    name: 'MedCore BD',
    url: 'https://medcorebd.com',
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

// Import generateAltText after mocks are set up
import { generateAltText } from '@/components/product/ProductImageGallery';

describe('generateAltText', () => {
  describe('Primary Image (index 0)', () => {
    it('should generate alt text with all fields present', () => {
      const product = {
        name: 'Siemens ECG Machine',
        brand: 'Siemens',
        price: 150000,
      };

      const altText = generateAltText(product, 0);

      expect(altText).toBe('Siemens ECG Machine — Siemens — Price ৳150,000 Bangladesh');
    });

    it('should omit brand segment when brand is missing', () => {
      const product = {
        name: 'Generic ECG Machine',
        price: 120000,
      };

      const altText = generateAltText(product, 0);

      expect(altText).toBe('Generic ECG Machine — Price ৳120,000 Bangladesh');
      expect(altText).not.toContain('—  —'); // No double separator
    });

    it('should use "Contact for Price" when price is 0', () => {
      const product = {
        name: 'Custom Medical Device',
        brand: 'CustomBrand',
        price: 0,
      };

      const altText = generateAltText(product, 0);

      expect(altText).toBe('Custom Medical Device — CustomBrand — Contact for Price');
    });

    it('should use "Contact for Price" when price is null', () => {
      const product = {
        name: 'Custom Medical Device',
        brand: 'CustomBrand',
        price: null,
      };

      const altText = generateAltText(product, 0);

      expect(altText).toBe('Custom Medical Device — CustomBrand — Contact for Price');
    });

    it('should use "Contact for Price" when price is undefined', () => {
      const product = {
        name: 'Custom Medical Device',
        brand: 'CustomBrand',
      };

      const altText = generateAltText(product, 0);

      expect(altText).toBe('Custom Medical Device — CustomBrand — Contact for Price');
    });

    it('should handle brand as populated object', () => {
      const product = {
        name: 'Mindray Patient Monitor',
        brand: { _id: '123', name: 'Mindray' },
        price: 85000,
      };

      const altText = generateAltText(product, 0);

      expect(altText).toBe('Mindray Patient Monitor — Mindray — Price ৳85,000 Bangladesh');
    });

    it('should truncate to 125 characters maximum', () => {
      const product = {
        name: 'Very Long Product Name That Exceeds Character Limits For SEO Optimization Testing Purpose Only',
        brand: 'Very Long Brand Name',
        price: 999999,
      };

      const altText = generateAltText(product, 0);

      expect(altText.length).toBeLessThanOrEqual(125);
      expect(altText.length).toBe(125);
    });

    it('should handle missing product gracefully', () => {
      const altText = generateAltText(null, 0);

      expect(altText).toContain('Product');
      expect(altText).toContain('Contact for Price');
    });
  });

  describe('Secondary Images (index > 0)', () => {
    it('should generate secondary image alt text format', () => {
      const product = {
        name: 'Siemens ECG Machine',
        brand: 'Siemens',
        price: 150000,
      };

      const altText = generateAltText(product, 1);

      expect(altText).toBe('Siemens ECG Machine view 1 — MedCore BD');
    });

    it('should use correct index in secondary image alt text', () => {
      const product = {
        name: 'Ultrasound Machine',
      };

      const altText2 = generateAltText(product, 2);
      const altText3 = generateAltText(product, 3);

      expect(altText2).toBe('Ultrasound Machine view 2 — MedCore BD');
      expect(altText3).toBe('Ultrasound Machine view 3 — MedCore BD');
    });

    it('should truncate secondary image alt text to 125 characters', () => {
      const product = {
        name: 'Very Long Product Name That Exceeds Character Limits For SEO Optimization Testing Purpose Only And More',
      };

      const altText = generateAltText(product, 5);

      expect(altText.length).toBeLessThanOrEqual(125);
    });
  });
});

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
      url: 'https://medcorebd.com/products/siemens-ecg-machine',
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
      name: 'MedCore BD',
      url: 'https://medcorebd.com',
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

    expect(schema.url).toBe('https://medcorebd.com/products/ecg-machine-pro');
  });

  it('should fallback to _id in URL when slug is missing', () => {
    const product = {
      name: 'ECG Machine',
      description: 'Test',
      price: 100000,
      _id: '507f1f77bcf86cd799439011',
    };

    const schema = generateProductSchema(product);

    expect(schema.url).toBe('https://medcorebd.com/products/507f1f77bcf86cd799439011');
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
      { name: 'Home', url: 'https://medcorebd.com/' },
      { name: 'Diagnostic Equipment', url: 'https://medcorebd.com/products?category=diagnostic' },
      { name: 'Siemens ECG Machine', url: 'https://medcorebd.com/products/siemens-ecg-machine' },
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
      item: 'https://medcorebd.com/',
    });

    expect(schema.itemListElement[1]).toEqual({
      '@type': 'ListItem',
      position: 2,
      name: 'Diagnostic Equipment',
      item: 'https://medcorebd.com/products?category=diagnostic',
    });

    expect(schema.itemListElement[2]).toEqual({
      '@type': 'ListItem',
      position: 3,
      name: 'Siemens ECG Machine',
      item: 'https://medcorebd.com/products/siemens-ecg-machine',
    });
  });

  it('should use "Products" as fallback category name', () => {
    const breadcrumbs = [
      { name: 'Home', url: 'https://medcorebd.com/' },
      { name: 'Products', url: 'https://medcorebd.com/products' },
      { name: 'ECG Machine', url: 'https://medcorebd.com/products/ecg-machine' },
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
      { name: 'Home', url: 'https://medcorebd.com/' },
      { name: 'Category', url: 'https://medcorebd.com/category' },
      { name: 'Subcategory', url: 'https://medcorebd.com/subcategory' },
      { name: 'Product', url: 'https://medcorebd.com/product' },
    ];

    const schema = generateBreadcrumbSchema(breadcrumbs);

    expect(schema.itemListElement).toHaveLength(4);
    expect(schema.itemListElement[3].position).toBe(4);
  });
});

describe('FAQSchema Component', () => {
  it('should render <script> tag with valid JSON-LD when product provided', () => {
    const product = {
      name: 'Siemens ECG Machine',
      price: 150000,
      certifications: ['DGDA', 'CE'],
    };

    const { container } = render(<FAQSchema product={product} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();

    const schema = JSON.parse(script.innerHTML);

    expect(schema).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
    });

    expect(schema.mainEntity).toHaveLength(4);

    // Check price question
    expect(schema.mainEntity[0].name).toContain('price');
    expect(schema.mainEntity[0].name).toContain('Siemens ECG Machine');
    expect(schema.mainEntity[0].acceptedAnswer.text).toContain('৳150,000');

    // Check DGDA question
    expect(schema.mainEntity[1].name).toContain('DGDA');
    expect(schema.mainEntity[1].acceptedAnswer.text).toContain('DGDA registered');

    // Check warranty question
    expect(schema.mainEntity[2].name).toContain('warranty');

    // Check where to buy question
    expect(schema.mainEntity[3].name).toContain('Where can I buy');
    expect(schema.mainEntity[3].acceptedAnswer.text).toContain('MedCore BD');
  });

  it('should return null when product is null', () => {
    const { container } = render(<FAQSchema product={null} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeInTheDocument();
  });

  it('should return null when product is undefined', () => {
    const { container } = render(<FAQSchema product={undefined} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeInTheDocument();
  });

  it('should use "Contact for Price" when price is 0', () => {
    const product = {
      name: 'Custom Device',
      price: 0,
    };

    const { container } = render(<FAQSchema product={product} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script.innerHTML);

    expect(schema.mainEntity[0].acceptedAnswer.text).toContain('contact');
    expect(schema.mainEntity[0].acceptedAnswer.text).not.toContain('৳0');
  });

  it('should use "Contact for Price" when price is null', () => {
    const product = {
      name: 'Custom Device',
      price: null,
    };

    const { container } = render(<FAQSchema product={product} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script.innerHTML);

    expect(schema.mainEntity[0].acceptedAnswer.text).toContain('contact');
  });

  it('should use product-specific warranty when available', () => {
    const product = {
      name: 'ECG Machine',
      price: 100000,
      variants: {
        warranty: ['2 years manufacturer warranty', '3 years extended warranty'],
      },
    };

    const { container } = render(<FAQSchema product={product} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script.innerHTML);

    expect(schema.mainEntity[2].acceptedAnswer.text).toContain('2 years manufacturer warranty');
    expect(schema.mainEntity[2].acceptedAnswer.text).toContain('3 years extended warranty');
  });

  it('should use generic warranty when product warranty is not available', () => {
    const product = {
      name: 'ECG Machine',
      price: 100000,
    };

    const { container } = render(<FAQSchema product={product} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script.innerHTML);

    expect(schema.mainEntity[2].acceptedAnswer.text).toContain('1 year manufacturer warranty');
  });

  it('should mention CE certification in DGDA answer when present', () => {
    const product = {
      name: 'ECG Machine',
      price: 100000,
      certifications: ['DGDA', 'CE'],
    };

    const { container } = render(<FAQSchema product={product} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script.innerHTML);

    expect(schema.mainEntity[1].acceptedAnswer.text).toContain('CE certified');
  });

  it('should mention ISO 13485 in DGDA answer when present', () => {
    const product = {
      name: 'ECG Machine',
      price: 100000,
      certifications: ['DGDA', 'ISO 13485'],
    };

    const { container } = render(<FAQSchema product={product} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script.innerHTML);

    expect(schema.mainEntity[1].acceptedAnswer.text).toContain('ISO 13485');
  });

  it('should include all 4 FAQ questions', () => {
    const product = {
      name: 'Test Product',
      price: 50000,
    };

    const { container } = render(<FAQSchema product={product} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script.innerHTML);

    expect(schema.mainEntity).toHaveLength(4);

    const questionTexts = schema.mainEntity.map(q => q.name);
    expect(questionTexts[0]).toContain('price');
    expect(questionTexts[1]).toContain('DGDA');
    expect(questionTexts[2]).toContain('warranty');
    expect(questionTexts[3]).toContain('Where can I buy');
  });
});
