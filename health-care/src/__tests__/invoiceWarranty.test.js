/**
 * Invoice warranty tests — helpers (period parsing, date maths, policy) and the
 * rendered Warranty & Service block that appears on the printable invoice.
 */

import { render, screen } from '@testing-library/react';
import {
  parseWarrantyMonths,
  formatWarrantyLabel,
  addMonthsToDate,
  computeInvoiceTotals,
  resolveItemWarranty,
  resolveInvoiceWarranty,
} from '@/utils/invoiceHelpers';
import WarrantyInformation from '@/components/invoice/WarrantyInformation';
import TermsAndConditions from '@/components/invoice/TermsAndConditions';
import InvoiceDocument from '@/components/invoice/InvoiceDocument';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img alt="" {...props} />,
}));

describe('invoice warranty helpers', () => {
  describe('parseWarrantyMonths', () => {
    it('parses numeric and textual periods', () => {
      expect(parseWarrantyMonths(24)).toBe(24);
      expect(parseWarrantyMonths('1 year')).toBe(12);
      expect(parseWarrantyMonths('1 year manufacturer warranty')).toBe(12);
      expect(parseWarrantyMonths('18 months')).toBe(18);
      expect(parseWarrantyMonths('12')).toBe(12);
    });

    it('recognises no-warranty statements and ignores noise', () => {
      expect(parseWarrantyMonths('No warranty')).toBe(0);
      expect(parseWarrantyMonths('')).toBeNull();
      expect(parseWarrantyMonths(null)).toBeNull();
      expect(parseWarrantyMonths('warranty as per manufacturer')).toBeNull();
    });
  });

  describe('formatWarrantyLabel', () => {
    it('formats singular, plural and empty values', () => {
      expect(formatWarrantyLabel(12)).toBe('12 months');
      expect(formatWarrantyLabel(1)).toBe('1 month');
      expect(formatWarrantyLabel(0)).toBe('No warranty');
      expect(formatWarrantyLabel(null)).toBe('—');
    });
  });

  describe('addMonthsToDate', () => {
    it('adds whole months and clamps month-end dates', () => {
      const anniversary = addMonthsToDate(new Date(2026, 7, 31, 12), 12);
      expect(anniversary.getFullYear()).toBe(2027);
      expect(anniversary.getMonth()).toBe(7);
      expect(anniversary.getDate()).toBe(31);

      const clamped = addMonthsToDate(new Date(2026, 7, 31, 12), 6);
      expect(clamped.getMonth()).toBe(1); // February
      expect(clamped.getDate()).toBe(28);
    });

    it('returns null for invalid dates', () => {
      expect(addMonthsToDate('not-a-date', 12)).toBeNull();
    });
  });

  describe('resolveItemWarranty', () => {
    it('prefers the order-item snapshot', () => {
      expect(resolveItemWarranty({ warranty: '2 years' })).toEqual({
        months: 24,
        label: '24 months',
      });
    });

    it('falls back to product warranty data', () => {
      expect(
        resolveItemWarranty({ product: { specifications: { Warranty: '18 months' } } })
      ).toEqual({ months: 18, label: '18 months' });
    });

    it('returns null when nothing is recorded', () => {
      expect(resolveItemWarranty({ name: 'Reagent' })).toBeNull();
    });
  });

  describe('resolveInvoiceWarranty', () => {
    it('returns no warranty when the admin has not selected a period', () => {
      const warranty = resolveInvoiceWarranty({ createdAt: new Date(2026, 7, 31, 12) });

      expect(warranty.months).toBeNull();
      expect(warranty.label).toBeNull();
      expect(warranty.endDate).toBeNull();
    });

    it('uses the admin-selected period', () => {
      const warranty = resolveInvoiceWarranty({
        createdAt: new Date(2026, 7, 31, 12),
        warrantyMonths: 6,
      });

      expect(warranty.months).toBe(6);
      expect(warranty.label).toBe('6 months');
      expect(warranty.endDate.getMonth()).toBe(1); // February 2027
      expect(warranty.endDate.getDate()).toBe(28);
    });

    it('never falls back to an environment default', () => {
      process.env.NEXT_PUBLIC_INVOICE_WARRANTY_MONTHS = '6';
      try {
        expect(resolveInvoiceWarranty({}).months).toBeNull();
      } finally {
        delete process.env.NEXT_PUBLIC_INVOICE_WARRANTY_MONTHS;
      }
    });

    it('collects unique item warranties', () => {
      const warranty = resolveInvoiceWarranty({
        createdAt: new Date(2026, 7, 31, 12),
        items: [
          { name: 'Analyzer', warranty: '24 months' },
          { name: 'Analyzer', warranty: '24 months' },
          { name: 'Reagent Kit' },
        ],
      });

      expect(warranty.itemWarranties).toEqual([
        { name: 'Analyzer', months: 24, label: '24 months' },
      ]);
    });
  });
});

describe('WarrantyInformation component', () => {
  it('renders the period, expiry date and claim reference', () => {
    const warranty = resolveInvoiceWarranty({
      createdAt: new Date(2026, 7, 31, 12),
      warrantyMonths: 12,
    });
    render(<WarrantyInformation warranty={warranty} invoiceNumber="MC-260831-7CSNNJ" />);

    expect(screen.getByText('Warranty & Service')).toBeInTheDocument();
    expect(screen.getByText('12 months')).toBeInTheDocument();
    expect(screen.getByText(/valid until 31\/08\/2027/)).toBeInTheDocument();
    expect(screen.getByText(/quoting Ref MPBD-INV-260831-7CSNNJ/)).toBeInTheDocument();
  });

  it('calls out item-specific warranties that differ from the policy', () => {
    const warranty = resolveInvoiceWarranty({
      createdAt: new Date(2026, 7, 31, 12),
      warrantyMonths: 12,
      items: [{ name: 'Hematology Analyzer', warranty: '24 months' }],
    });
    render(<WarrantyInformation warranty={warranty} invoiceNumber="MC-260831-7CSNNJ" />);

    expect(
      screen.getByText(/Item-specific warranty: Hematology Analyzer \(24 months\)/)
    ).toBeInTheDocument();
  });

  it('renders nothing when no warranty period was selected', () => {
    const warranty = resolveInvoiceWarranty({ createdAt: new Date(2026, 7, 31, 12) });
    const { container } = render(
      <WarrantyInformation warranty={warranty} invoiceNumber="MC-260831-7CSNNJ" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when warranty data is missing', () => {
    const { container } = render(<WarrantyInformation />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('InvoiceDocument wiring', () => {
  it('renders the warranty block inside the printable invoice', () => {
    const createdAt = new Date(2026, 7, 31, 12);
    const invoiceData = {
      invoiceNumber: 'MC-260831-7CSNNJ',
      orderNumber: 'MC-260831-7CSNNJ',
      invoiceDate: createdAt,
      dueDate: null,
      billingInfo: { name: 'Mahi M Rahman', email: 'mahimrahman07@gmail.com', phone: '8801646886795', address: {} },
      shippingInfo: {
        name: 'Mahi M Rahman',
        address: { street: '7/8-A Free School Street, Hatirpool', city: 'Dhaka', postcode: '1205' },
      },
      items: [{ name: 'Excel Dengue IgG/IgM Rapid Test', qty: 1, price: 200 }],
      totals: { subtotal: 200, b2bDiscount: 0, couponDiscount: 0, vat: 0, shipping: 70, grandTotal: 270 },
      paymentInfo: {},
      warranty: resolveInvoiceWarranty({ createdAt, warrantyMonths: 12 }),
      isB2B: false,
    };

    render(<InvoiceDocument invoiceData={invoiceData} />);

    expect(screen.getByText('Warranty & Service')).toBeInTheDocument();
    expect(screen.getByText(/valid until 31\/08\/2027/)).toBeInTheDocument();
    expect(screen.getByText('Excel Dengue IgG/IgM Rapid Test')).toBeInTheDocument();
  });
});

describe('admin invoice overrides', () => {
  it('uses the admin warranty period and note', () => {
    const warranty = resolveInvoiceWarranty({
      createdAt: new Date(2026, 7, 31, 12),
      warrantyMonths: 24,
      warrantyNote: 'Covers parts and labour only.',
    });

    expect(warranty.months).toBe(24);
    expect(warranty.label).toBe('24 months');
    expect(warranty.note).toBe('Covers parts and labour only.');
    expect(warranty.endDate.getFullYear()).toBe(2028);
    expect(warranty.endDate.getDate()).toBe(31);
  });

  it('prints no expiry when the admin sets zero months', () => {
    const warranty = resolveInvoiceWarranty({ warrantyMonths: 0 });
    expect(warranty.months).toBe(0);
    expect(warranty.endDate).toBeNull();
  });

  it('recomputes totals from edited items and charges', () => {
    const totals = computeInvoiceTotals(
      [
        { qty: 2, price: 200, discount: 0 },
        { qty: 1, price: 100, discount: 10 },
      ],
      { b2bDiscount: 50, couponDiscount: 10, vatAmount: 20, deliveryFee: 70 }
    );

    expect(totals.subtotal).toBe(490);
    expect(totals.totalAmount).toBe(520);
  });
});

describe('edited invoice rendering', () => {
  it('prints admin-edited terms and notes', () => {
    render(<TermsAndConditions terms={['Custom delivery term']} notes="Hand delivered." />);

    expect(screen.getByText('Custom delivery term')).toBeInTheDocument();
    expect(screen.getByText('Hand delivered.')).toBeInTheDocument();
  });

  it('shows the revision strip on the invoice document', () => {
    const invoiceData = {
      invoiceNumber: 'MPBD-INV-260831-7CSNNJ',
      orderNumber: 'MC-260831-7CSNNJ',
      invoiceDate: new Date(2026, 7, 31, 12),
      dueDate: null,
      billingInfo: { name: 'Mahi M Rahman', address: {} },
      shippingInfo: { name: 'Mahi M Rahman', address: {} },
      items: [{ name: 'Excel Dengue IgG/IgM Rapid Test', qty: 1, price: 200 }],
      totals: { subtotal: 200, b2bDiscount: 0, couponDiscount: 0, vat: 0, shipping: 70, grandTotal: 270 },
      paymentInfo: {},
      warranty: resolveInvoiceWarranty({ createdAt: new Date(2026, 7, 31, 12) }),
      notes: 'Edited by accounts.',
      terms: ['Custom term'],
      invoiceMeta: { isEdited: true, revision: 3, lastEditedAt: new Date(2026, 8, 2, 10) },
    };

    render(<InvoiceDocument invoiceData={invoiceData} />);

    expect(screen.getByText('Revised')).toBeInTheDocument();
    expect(screen.getByText(/Revision 3/)).toBeInTheDocument();
    expect(screen.getByText('Edited by accounts.')).toBeInTheDocument();
    expect(screen.getByText('Custom term')).toBeInTheDocument();
  });

  it('shows a warranty column with the policy period on every line', () => {
    const invoiceData = {
      invoiceNumber: 'MPBD-INV-2627-00014',
      orderNumber: 'MC-261101-ZHD84D',
      invoiceDate: new Date(2026, 9, 1, 12),
      dueDate: null,
      billingInfo: { name: 'MD Zannatun Nayeem', address: {} },
      shippingInfo: { name: 'MD Zannatun Nayeem', address: {} },
      items: [
        { name: 'GPL GOT/AST (SGOT) Reagent (40+10 ml)', sku: 'EZ012LQ-SP', qty: 1, price: 1500 },
        { name: 'GPL Creatinine Jaffe Reagent (2×50 ml)', sku: 'SU015-SP', qty: 1, price: 1200, warranty: '6 months' },
      ],
      totals: { subtotal: 2700, b2bDiscount: 0, couponDiscount: 0, vat: 0, shipping: 0, grandTotal: 2700 },
      paymentInfo: {},
      warranty: resolveInvoiceWarranty({
        createdAt: new Date(2026, 9, 1, 12),
        warrantyMonths: 12,
      }),
      invoiceMeta: { isEdited: false, revision: 0, lastEditedAt: null },
    };

    const { container } = render(<InvoiceDocument invoiceData={invoiceData} />);
    const table = container.querySelector('.invoice-items-table');

    expect(table).not.toBeNull();
    expect(table.textContent).toContain('Warranty');
    // Admin-selected invoice period on a line without its own warranty
    expect(table.textContent).toContain('12 months');
    // Line-specific warranty wins
    expect(table.textContent).toContain('6 months');
  });

  it('hides the warranty column and block when no period was selected', () => {
    const invoiceData = {
      invoiceNumber: 'MPBD-INV-2627-00014',
      orderNumber: 'MC-261101-ZHD84D',
      invoiceDate: new Date(2026, 9, 1, 12),
      dueDate: null,
      billingInfo: { name: 'MD Zannatun Nayeem', address: {} },
      shippingInfo: { name: 'MD Zannatun Nayeem', address: {} },
      items: [{ name: 'GPL GOT/AST (SGOT) Reagent (40+10 ml)', qty: 1, price: 1500 }],
      totals: { subtotal: 1500, b2bDiscount: 0, couponDiscount: 0, vat: 0, shipping: 0, grandTotal: 1500 },
      paymentInfo: {},
      warranty: resolveInvoiceWarranty({ createdAt: new Date(2026, 9, 1, 12) }),
      invoiceMeta: { isEdited: false, revision: 0, lastEditedAt: null },
    };

    const { container } = render(<InvoiceDocument invoiceData={invoiceData} />);
    const table = container.querySelector('.invoice-items-table');

    expect(table).not.toBeNull();
    expect(table.textContent).not.toContain('Warranty');
    expect(screen.queryByText('Warranty & Service')).not.toBeInTheDocument();
  });

  it('omits the revision strip for untouched invoices', () => {
    const invoiceData = {
      invoiceNumber: 'MPBD-INV-260831-7CSNNJ',
      orderNumber: 'MC-260831-7CSNNJ',
      invoiceDate: new Date(2026, 7, 31, 12),
      dueDate: null,
      billingInfo: { name: 'Mahi M Rahman', address: {} },
      shippingInfo: { name: 'Mahi M Rahman', address: {} },
      items: [{ name: 'Rapid Test', qty: 1, price: 200 }],
      totals: { subtotal: 200, b2bDiscount: 0, couponDiscount: 0, vat: 0, shipping: 70, grandTotal: 270 },
      paymentInfo: {},
      warranty: resolveInvoiceWarranty({ createdAt: new Date(2026, 7, 31, 12) }),
      invoiceMeta: { isEdited: false, revision: 0, lastEditedAt: null },
    };

    render(<InvoiceDocument invoiceData={invoiceData} />);
    expect(screen.queryByText('Revised')).not.toBeInTheDocument();
  });
});

