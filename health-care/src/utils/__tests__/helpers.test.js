import {
  getPopulatedLabel,
  getProductBrandName,
  getProductCategoryName,
  formatCurrency,
  truncateText,
  slugify,
  calculateDiscount,
  calculatePercentage,
  getStatusColor,
  groupBy,
  sortBy,
  filterBy,
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

  it('returns empty string fallback by default', () => {
    expect(getPopulatedLabel(undefined)).toBe('');
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

  it('returns empty string when product has no brand', () => {
    expect(getProductBrandName({})).toBe('');
  });
});

describe('formatCurrency', () => {
  it('formats with default BDT symbol', () => {
    expect(formatCurrency(1500)).toBe('৳1,500');
  });

  it('accepts a custom currency symbol', () => {
    expect(formatCurrency(99, '$')).toBe('$99');
  });
});

describe('truncateText', () => {
  it('returns text unchanged when under maxLength', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
  });

  it('truncates and adds ellipsis when over maxLength', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...');
  });

  it('returns text exactly at maxLength unchanged', () => {
    expect(truncateText('Hello', 5)).toBe('Hello');
  });
});

describe('slugify', () => {
  it('converts spaces to hyphens and lowercases', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips special characters', () => {
    expect(slugify('Hello (World)!')).toBe('hello-world');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('Hello   World')).toBe('hello-world');
  });
});

describe('calculateDiscount', () => {
  it('calculates discount amount', () => {
    expect(calculateDiscount(1000, 10)).toBe(100);
    expect(calculateDiscount(500, 25)).toBe(125);
  });

  it('rounds to nearest integer', () => {
    expect(calculateDiscount(99, 7)).toBe(7);
  });
});

describe('calculatePercentage', () => {
  it('calculates percentage correctly', () => {
    expect(calculatePercentage(50, 200)).toBe(25);
  });

  it('returns 0 when total is 0', () => {
    expect(calculatePercentage(10, 0)).toBe(0);
  });
});

describe('getStatusColor', () => {
  it('returns correct color for delivered', () => {
    expect(getStatusColor('delivered')).toEqual({ bg: 'var(--color-status-success-tint)', text: 'var(--color-status-success)' });
  });

  it('returns pending colors for unknown status', () => {
    expect(getStatusColor('foobar')).toEqual(getStatusColor('pending'));
  });
});

describe('groupBy', () => {
  it('groups items by a key', () => {
    const items = [
      { type: 'a', id: 1 },
      { type: 'b', id: 2 },
      { type: 'a', id: 3 },
    ];
    const grouped = groupBy(items, 'type');
    expect(grouped.a).toHaveLength(2);
    expect(grouped.b).toHaveLength(1);
  });
});

describe('sortBy', () => {
  it('sorts ascending by default', () => {
    const items = [{ price: 30 }, { price: 10 }, { price: 20 }];
    expect(sortBy(items, 'price').map(i => i.price)).toEqual([10, 20, 30]);
  });

  it('sorts descending', () => {
    const items = [{ price: 30 }, { price: 10 }, { price: 20 }];
    expect(sortBy(items, 'price', 'desc').map(i => i.price)).toEqual([30, 20, 10]);
  });

  it('does not mutate the original array', () => {
    const items = [{ n: 2 }, { n: 1 }];
    expect(sortBy(items, 'n')).not.toBe(items);
  });
});

describe('filterBy', () => {
  const items = [
    { name: 'ECG Machine', type: 'diagnostic' },
    { name: 'Lab Centrifuge', type: 'lab' },
    { name: 'ECG Monitor', type: 'diagnostic' },
  ];

  it('filters by partial string (case-insensitive)', () => {
    expect(filterBy(items, { name: 'ecg' })).toHaveLength(2);
  });

  it('filters by array inclusion', () => {
    expect(filterBy(items, { type: ['diagnostic', 'lab'] })).toHaveLength(3);
  });
});
