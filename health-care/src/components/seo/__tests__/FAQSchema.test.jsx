import { render } from '@testing-library/react';
import FAQSchema from '../FAQSchema';

// Mock SITE_CONFIG
jest.mock('@/config/seo', () => ({
  SITE_CONFIG: {
    phone: '+8801800000000',
    email: 'info@medcorebd.com',
    url: 'https://medcorebd.com',
  },
}));

describe('FAQSchema', () => {
  it('should return null when product is null', () => {
    const { container } = render(<FAQSchema product={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should return null when product is undefined', () => {
    const { container } = render(<FAQSchema product={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('should generate 4 FAQ questions with valid product data', () => {
    const product = {
      name: 'Siemens ECG Machine',
      price: 150000,
    };

    const { container } = render(<FAQSchema product={product} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    
    expect(script).toBeTruthy();
    
    const schema = JSON.parse(script.innerHTML);
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toHaveLength(4);
  });

  it('should include price question with BDT amount when price is available', () => {
    const product = {
      name: 'Siemens ECG Machine',
      price: 150000,
    };

    const { container } = render(<FAQSchema product={product} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script.innerHTML);
    
    const priceQuestion = schema.mainEntity[0];
    expect(priceQuestion.name).toBe('What is the price of Siemens ECG Machine in Bangladesh?');
    expect(priceQuestion.acceptedAnswer.text).toContain('৳150,000');
  });

  it('should show "Contact for Price" when price is zero', () => {
    const product = {
      name: 'Custom Medical Device',
      price: 0,
    };

    const { container } = render(<FAQSchema product={product} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script.innerHTML);
    
    const priceQuestion = schema.mainEntity[0];
    expect(priceQuestion.acceptedAnswer.text).toContain('contact MedCore BD');
    expect(priceQuestion.acceptedAnswer.text).not.toContain('৳0');
  });

  it('should show "Contact for Price" when price is undefined', () => {
    const product = {
      name: 'Custom Medical Device',
    };

    const { container } = render(<FAQSchema product={product} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script.innerHTML);
    
    const priceQuestion = schema.mainEntity[0];
    expect(priceQuestion.acceptedAnswer.text).toContain('contact MedCore BD');
  });

  it('should include DGDA registration question', () => {
    const product = {
      name: 'Siemens ECG Machine',
      price: 150000,
    };

    const { container } = render(<FAQSchema product={product} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script.innerHTML);
    
    const dgdaQuestion = schema.mainEntity[1];
    expect(dgdaQuestion.name).toBe('Is Siemens ECG Machine DGDA registered?');
    expect(dgdaQuestion.acceptedAnswer.text).toContain('DGDA registered');
  });

  it('should include CE certification in DGDA answer when available', () => {
    const product = {
      name: 'Siemens ECG Machine',
      price: 150000,
      certifications: ['CE', 'ISO 13485'],
    };

    const { container } = render(<FAQSchema product={product} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script.innerHTML);
    
    const dgdaQuestion = schema.mainEntity[1];
    expect(dgdaQuestion.acceptedAnswer.text).toContain('CE certified');
    expect(dgdaQuestion.acceptedAnswer.text).toContain('ISO 13485');
  });

  it('should include warranty question with default warranty', () => {
    const product = {
      name: 'Siemens ECG Machine',
      price: 150000,
    };

    const { container } = render(<FAQSchema product={product} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script.innerHTML);
    
    const warrantyQuestion = schema.mainEntity[2];
    expect(warrantyQuestion.name).toBe('What is the warranty for Siemens ECG Machine?');
    expect(warrantyQuestion.acceptedAnswer.text).toContain('1 year manufacturer warranty');
  });

  it('should use product.variants.warranty when available as array', () => {
    const product = {
      name: 'Siemens ECG Machine',
      price: 150000,
      variants: {
        warranty: ['2 years parts warranty', '1 year labor warranty'],
      },
    };

    const { container } = render(<FAQSchema product={product} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script.innerHTML);
    
    const warrantyQuestion = schema.mainEntity[2];
    expect(warrantyQuestion.acceptedAnswer.text).toContain('2 years parts warranty, 1 year labor warranty');
  });

  it('should use product.variants.warranty when available as string', () => {
    const product = {
      name: 'Siemens ECG Machine',
      price: 150000,
      variants: {
        warranty: '3 years comprehensive warranty',
      },
    };

    const { container } = render(<FAQSchema product={product} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script.innerHTML);
    
    const warrantyQuestion = schema.mainEntity[2];
    expect(warrantyQuestion.acceptedAnswer.text).toContain('3 years comprehensive warranty');
  });

  it('should include where to buy question with MedCore BD and delivery info', () => {
    const product = {
      name: 'Siemens ECG Machine',
      price: 150000,
    };

    const { container } = render(<FAQSchema product={product} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script.innerHTML);
    
    const buyQuestion = schema.mainEntity[3];
    expect(buyQuestion.name).toBe('Where can I buy Siemens ECG Machine in Bangladesh?');
    expect(buyQuestion.acceptedAnswer.text).toContain('MedCore BD');
    expect(buyQuestion.acceptedAnswer.text).toContain('Dhaka');
    expect(buyQuestion.acceptedAnswer.text).toContain('Chittagong');
    expect(buyQuestion.acceptedAnswer.text).toContain('Sylhet');
    expect(buyQuestion.acceptedAnswer.text).toContain('Rajshahi');
    expect(buyQuestion.acceptedAnswer.text).toContain('Khulna');
  });

  it('should render valid JSON-LD schema structure', () => {
    const product = {
      name: 'Siemens ECG Machine',
      price: 150000,
    };

    const { container } = render(<FAQSchema product={product} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script.innerHTML);
    
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('FAQPage');
    expect(Array.isArray(schema.mainEntity)).toBe(true);
    
    schema.mainEntity.forEach(question => {
      expect(question['@type']).toBe('Question');
      expect(question.name).toBeTruthy();
      expect(question.acceptedAnswer).toBeTruthy();
      expect(question.acceptedAnswer['@type']).toBe('Answer');
      expect(question.acceptedAnswer.text).toBeTruthy();
    });
  });
});
