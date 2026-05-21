import {
  getPopulatedLabel,
  getProductBrandName,
  getProductCategoryName,
} from '../helpers';

describe('getPopulatedLabel', () => {
  it('returns strings as-is', () => {
    expect(getPopulatedLabel('Laboratory Reagents')).toBe('Laboratory Reagents');
  });

  it('extracts name from populated refs', () => {
    expect(
      getPopulatedLabel({ _id: 'abc', name: 'Laboratory Reagents', slug: 'laboratory-reagents' })
    ).toBe('Laboratory Reagents');
  });

  it('falls back to slug then default', () => {
    expect(getPopulatedLabel({ _id: 'abc', slug: 'lab-reagents' })).toBe('lab-reagents');
    expect(getPopulatedLabel(null, 'N/A')).toBe('N/A');
  });
});

describe('product label helpers', () => {
  it('resolves brand and category on product objects', () => {
    const product = {
      brand: { _id: '1', name: 'Roche' },
      category: { _id: '2', name: 'Laboratory Reagents', slug: 'lab' },
    };
    expect(getProductBrandName(product)).toBe('Roche');
    expect(getProductCategoryName(product)).toBe('Laboratory Reagents');
  });
});
