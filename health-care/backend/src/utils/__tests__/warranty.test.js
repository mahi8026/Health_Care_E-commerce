/**
 * Tests for the invoice warranty utilities.
 *
 * Covers period parsing (years/months/none), month-end-safe date maths and the
 * invoice-level policy resolution used by the PDF generator and the invoice API.
 */

const {
  parseWarrantyMonths,
  formatWarrantyLabel,
  addMonthsToDate,
  resolveItemWarranty,
  resolveProductWarranty,
  resolveInvoiceWarranty,
} = require('../warranty');

describe('Warranty Utility', () => {
  describe('parseWarrantyMonths', () => {
    it('accepts numeric month values', () => {
      expect(parseWarrantyMonths(24)).toBe(24);
      expect(parseWarrantyMonths(0)).toBe(0);
      expect(parseWarrantyMonths(12.4)).toBe(12);
    });

    it('rejects invalid numbers', () => {
      expect(parseWarrantyMonths(Number.NaN)).toBeNull();
      expect(parseWarrantyMonths(-3)).toBeNull();
    });

    it('parses year and month statements', () => {
      expect(parseWarrantyMonths('1 year')).toBe(12);
      expect(parseWarrantyMonths('1 year manufacturer warranty')).toBe(12);
      expect(parseWarrantyMonths('2 yrs')).toBe(24);
      expect(parseWarrantyMonths('18 months')).toBe(18);
      expect(parseWarrantyMonths('24 mo')).toBe(24);
      expect(parseWarrantyMonths('12')).toBe(12);
    });

    it('detects explicit no-warranty statements', () => {
      expect(parseWarrantyMonths('No warranty')).toBe(0);
      expect(parseWarrantyMonths('none')).toBe(0);
      expect(parseWarrantyMonths('N/A')).toBe(0);
    });

    it('returns null for missing or unrecognised values', () => {
      expect(parseWarrantyMonths(null)).toBeNull();
      expect(parseWarrantyMonths(undefined)).toBeNull();
      expect(parseWarrantyMonths('')).toBeNull();
      expect(parseWarrantyMonths('warranty as per manufacturer')).toBeNull();
    });
  });

  describe('formatWarrantyLabel', () => {
    it('pluralises correctly', () => {
      expect(formatWarrantyLabel(12)).toBe('12 months');
      expect(formatWarrantyLabel(1)).toBe('1 month');
      expect(formatWarrantyLabel(0)).toBe('No warranty');
      expect(formatWarrantyLabel(null)).toBe('—');
    });
  });

  describe('addMonthsToDate', () => {
    it('keeps the same day in the target month', () => {
      const result = addMonthsToDate(new Date(2026, 0, 15), 12);
      expect(result.getFullYear()).toBe(2027);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(15);
    });

    it('clamps to the last day of shorter months', () => {
      const result = addMonthsToDate(new Date(2026, 7, 31), 6); // 31 Aug 2026
      expect(result.getFullYear()).toBe(2027);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(28);
    });

    it('handles leap years', () => {
      const result = addMonthsToDate(new Date(2024, 0, 31), 1); // 31 Jan 2024
      expect(result.getMonth()).toBe(1);
      expect(result.getDate()).toBe(29);
    });

    it('returns null for invalid dates', () => {
      expect(addMonthsToDate('not-a-date', 12)).toBeNull();
    });
  });

  describe('resolveProductWarranty', () => {
    it('reads the product variant warranty', () => {
      const product = { variants: { warranty: ['1 year manufacturer warranty'] } };
      expect(resolveProductWarranty(product)).toBe('12 months');
    });

    it('reads a plain specifications object', () => {
      const product = { specifications: { Warranty: '2 years' } };
      expect(resolveProductWarranty(product)).toBe('24 months');
    });

    it('reads a Mongoose-style specifications map', () => {
      const product = {
        specifications: { get: (key) => (key === 'Warranty' ? '18 months' : undefined) },
      };
      expect(resolveProductWarranty(product)).toBe('18 months');
    });

    it('returns null when the product has no warranty', () => {
      expect(resolveProductWarranty({ variants: { warranty: [] } })).toBeNull();
      expect(resolveProductWarranty(null)).toBeNull();
    });
  });

  describe('resolveItemWarranty', () => {
    it('prefers the checkout snapshot on the order item', () => {
      const item = { warranty: '24 months', product: { variants: { warranty: ['1 year'] } } };
      expect(resolveItemWarranty(item)).toEqual({ months: 24, label: '24 months' });
    });

    it('falls back to the populated product', () => {
      const item = { product: { name: 'Analyzer', specifications: { warranty: '3 years' } } };
      expect(resolveItemWarranty(item)).toEqual({ months: 36, label: '36 months' });
    });

    it('returns null when no warranty is recorded', () => {
      expect(resolveItemWarranty({ name: 'Reagent' })).toBeNull();
      expect(resolveItemWarranty(null)).toBeNull();
    });
  });

  describe('resolveInvoiceWarranty', () => {
    const originalEnv = process.env.INVOICE_WARRANTY_MONTHS;

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.INVOICE_WARRANTY_MONTHS;
      } else {
        process.env.INVOICE_WARRANTY_MONTHS = originalEnv;
      }
    });

    it('returns no warranty when the admin has not selected a period', () => {
      delete process.env.INVOICE_WARRANTY_MONTHS;
      const result = resolveInvoiceWarranty({ createdAt: new Date(2026, 7, 31, 12) });

      expect(result.months).toBeNull();
      expect(result.label).toBeNull();
      expect(result.endDate).toBeNull();
      expect(result.itemWarranties).toEqual([]);
    });

    it('uses the admin-selected period', () => {
      const result = resolveInvoiceWarranty({
        createdAt: new Date(2026, 7, 31, 12),
        warrantyMonths: 6,
      });

      expect(result.months).toBe(6);
      expect(result.label).toBe('6 months');
      expect(result.endDate.getMonth()).toBe(1); // February 2027
      expect(result.endDate.getDate()).toBe(28);
    });

    it('never falls back to an environment default', () => {
      process.env.INVOICE_WARRANTY_MONTHS = '6';
      expect(resolveInvoiceWarranty({}).months).toBeNull();
    });

    it('lists item warranties and de-duplicates identical lines', () => {
      const result = resolveInvoiceWarranty({
        createdAt: new Date(2026, 7, 31, 12),
        items: [
          { name: 'Analyzer', warranty: '24 months' },
          { name: 'Analyzer', warranty: '24 months' },
          { name: 'Reagent Kit' },
        ],
      });

      expect(result.itemWarranties).toEqual([
        { name: 'Analyzer', months: 24, label: '24 months' },
      ]);
    });

    it('treats zero months as an explicit no-warranty selection', () => {
      const result = resolveInvoiceWarranty({
        createdAt: new Date(2026, 7, 31, 12),
        warrantyMonths: 0,
      });

      expect(result.months).toBe(0);
      expect(result.label).toBe('No warranty');
      expect(result.endDate).toBeNull();
    });
  });
});

