import { generateAltText } from '../ProductImageGallery';

describe('generateAltText', () => {
  describe('Primary image (index 0)', () => {
    it('should generate alt text with all fields present', () => {
      const product = {
        name: 'Siemens ECG Machine',
        brand: 'Siemens',
        price: 150000,
      };
      const result = generateAltText(product, 0);
      expect(result).toBe('Siemens ECG Machine — Siemens — Price ৳150,000 Bangladesh');
    });

    it('should omit brand segment when brand is missing', () => {
      const product = {
        name: 'Generic ECG Machine',
        price: 120000,
      };
      const result = generateAltText(product, 0);
      expect(result).toBe('Generic ECG Machine — Price ৳120,000 Bangladesh');
    });

    it('should use "Contact for Price" when price is 0', () => {
      const product = {
        name: 'Custom Medical Device',
        brand: 'MedTech',
        price: 0,
      };
      const result = generateAltText(product, 0);
      expect(result).toBe('Custom Medical Device — MedTech — Contact for Price');
    });

    it('should use "Contact for Price" when price is null', () => {
      const product = {
        name: 'Custom Medical Device',
        brand: 'MedTech',
        price: null,
      };
      const result = generateAltText(product, 0);
      expect(result).toBe('Custom Medical Device — MedTech — Contact for Price');
    });

    it('should use "Contact for Price" when price is undefined', () => {
      const product = {
        name: 'Custom Medical Device',
        brand: 'MedTech',
      };
      const result = generateAltText(product, 0);
      expect(result).toBe('Custom Medical Device — MedTech — Contact for Price');
    });

    it('should handle brand as populated object', () => {
      const product = {
        name: 'Mindray Patient Monitor',
        brand: { _id: '123', name: 'Mindray' },
        price: 250000,
      };
      const result = generateAltText(product, 0);
      expect(result).toBe('Mindray Patient Monitor — Mindray — Price ৳250,000 Bangladesh');
    });

    it('should handle brand as populated object with missing name', () => {
      const product = {
        name: 'Generic Monitor',
        brand: { _id: '123' },
        price: 100000,
      };
      const result = generateAltText(product, 0);
      expect(result).toBe('Generic Monitor — Price ৳100,000 Bangladesh');
    });

    it('should truncate to 125 characters when too long', () => {
      const product = {
        name: 'Very Long Product Name That Exceeds Character Limits For SEO Optimization And Needs Truncation',
        brand: 'Very Long Brand Name',
        price: 999999999,
      };
      const result = generateAltText(product, 0);
      expect(result.length).toBeLessThanOrEqual(125);
    });

    it('should use "Product" as fallback when product is null', () => {
      const result = generateAltText(null, 0);
      expect(result).toBe('Product — Contact for Price');
    });

    it('should use "Product" as fallback when product name is missing', () => {
      const product = {
        brand: 'TestBrand',
        price: 50000,
      };
      const result = generateAltText(product, 0);
      expect(result).toBe('Product — TestBrand — Price ৳50,000 Bangladesh');
    });
  });

  describe('Secondary images (index > 0)', () => {
    it('should generate secondary image alt text', () => {
      const product = {
        name: 'Siemens ECG Machine',
      };
      const result = generateAltText(product, 1);
      expect(result).toBe('Siemens ECG Machine view 1 — MediportBD');
    });

    it('should generate alt text for different indices', () => {
      const product = {
        name: 'Ultrasound Machine',
      };
      expect(generateAltText(product, 2)).toBe('Ultrasound Machine view 2 — MediportBD');
      expect(generateAltText(product, 3)).toBe('Ultrasound Machine view 3 — MediportBD');
    });

    it('should truncate secondary image alt text to 125 characters', () => {
      const product = {
        name: 'Very Long Product Name That Exceeds Character Limits For SEO Optimization And Needs Truncation For Secondary Images',
      };
      const result = generateAltText(product, 2);
      expect(result.length).toBeLessThanOrEqual(125);
    });

    it('should use "Product" as fallback for secondary images', () => {
      const result = generateAltText(null, 1);
      expect(result).toBe('Product view 1 — MediportBD');
    });
  });
});
