/**
 * Tests for the invoice composition service (admin-editable invoices).
 *
 * Covers authoritative totals, payload sanitisation and the merge between the
 * order defaults and a stored admin revision.
 */

const {
  DEFAULT_TERMS,
  computeItemTotal,
  computeTotals,
  buildDefaultInvoice,
  sanitizeInvoicePayload,
  composeInvoice,
} = require('../invoiceService');

const order = {
  _id: '665f00000000000000000001',
  orderNumber: 'MC-260831-7CSNNJ',
  invoiceNumber: 'MC-260831-7CSNNJ',
  createdAt: new Date(2026, 7, 31, 12),
  paymentMethod: 'cod',
  paymentStatus: 'pending',
  subtotal: 200,
  deliveryFee: 70,
  totalAmount: 270,
  b2bDiscount: 0,
  transactionId: 'TRX-OLD',
  deliveryAddress: {
    name: 'Mahi M Rahman',
    phone: '8801646886795',
    street: '7/8-A Free School Street, Hatirpool',
    thana: 'Hatirpool',
    district: 'Dhaka',
    postcode: '1205',
  },
  items: [
    { name: 'Excel Dengue IgG/IgM Rapid Test', sku: 'EXC-1', brand: 'Excel', price: 200, qty: 1 },
  ],
};

const user = {
  name: 'Mahi M Rahman',
  email: 'mahimrahman07@gmail.com',
  phone: '8801646886795',
};

describe('invoiceService', () => {
  describe('computeItemTotal / computeTotals', () => {
    it('applies the per-line discount percentage', () => {
      expect(computeItemTotal({ qty: 2, price: 150, discount: 10 })).toBe(270);
    });

    it('recomputes subtotal and total from items and charges', () => {
      const totals = computeTotals(
        [
          { qty: 2, price: 200, discount: 0 },
          { qty: 1, price: 99.99, discount: 50 },
        ],
        { b2bDiscount: 50, couponDiscount: 25, vatAmount: 20, deliveryFee: 70 }
      );

      expect(totals.subtotal).toBe(450);
      expect(totals.totalAmount).toBe(465);
    });

    it('never returns negative totals', () => {
      const totals = computeTotals([{ qty: 1, price: 100 }], { b2bDiscount: 500 });
      expect(totals.totalAmount).toBe(0);
    });
  });

  describe('buildDefaultInvoice', () => {
    it('derives the editable invoice from the order', () => {
      const defaults = buildDefaultInvoice(order, user);

      expect(defaults.invoiceNumber).toBe('MC-260831-7CSNNJ');
      expect(defaults.customer.name).toBe('Mahi M Rahman');
      expect(defaults.customer.email).toBe('mahimrahman07@gmail.com');
      expect(defaults.deliveryAddress.district).toBe('Dhaka');
      expect(defaults.items).toHaveLength(1);
      expect(defaults.items[0]).toMatchObject({
        name: 'Excel Dengue IgG/IgM Rapid Test',
        qty: 1,
        price: 200,
      });
      expect(defaults.charges.deliveryFee).toBe(70);
      expect(defaults.warranty.months).toBe(12);
      expect(defaults.terms).toEqual(DEFAULT_TERMS);
    });
  });


  describe('sanitizeInvoicePayload', () => {
    it('coerces strings, clamps values and keeps the invoice number uppercase', () => {
      const payload = sanitizeInvoicePayload(
        {
          invoiceNumber: '  mpbd-inv-260831-7csnnj ',
          items: [{ name: '  Analyzer  ', qty: '0', price: '-5', discount: '250' }],
          charges: { deliveryFee: '70', vatAmount: 'abc' },
          warranty: { months: '999' },
          terms: ['  Keep me  ', '', '   '],
        },
        order,
        user
      );

      expect(payload.invoiceNumber).toBe('MPBD-INV-260831-7CSNNJ');
      expect(payload.items[0]).toMatchObject({ name: 'Analyzer', qty: 1, price: 0, discount: 100 });
      expect(payload.charges.deliveryFee).toBe(70);
      expect(payload.charges.vatAmount).toBe(0);
      expect(payload.warranty.months).toBe(120);
      expect(payload.terms).toEqual(['Keep me']);
    });

    it('falls back to order items when the payload omits them', () => {
      const payload = sanitizeInvoicePayload({ notes: 'Paid in full' }, order, user);
      expect(payload.items).toHaveLength(1);
      expect(payload.notes).toBe('Paid in full');
    });
  });

  describe('composeInvoice', () => {
    it('keeps the order totals when no admin revision exists', () => {
      const { order: view, meta } = composeInvoice(order, user, null);

      expect(view.totalAmount).toBe(270);
      expect(view.subtotal).toBe(200);
      expect(view.warrantyMonths).toBeNull();
      expect(meta.isEdited).toBe(false);
      expect(meta.revision).toBe(0);
    });

    it('applies an admin revision and recomputes totals', () => {
      const editedAt = new Date(2026, 8, 2, 9, 30);
      const doc = {
        invoiceNumber: 'MPBD-INV-EDITED-1',
        issueDate: new Date(2026, 7, 31, 12),
        dueDate: new Date(2026, 8, 30, 12),
        customer: { name: 'Accounts Payable', companyName: 'City Hospital' },
        deliveryAddress: { street: '12 Lab Road' },
        items: [
          { name: 'Hematology Analyzer', qty: 1, price: 250000, discount: 10 },
          { name: 'Reagent Kit', qty: 2, price: 500, discount: 0 },
        ],
        charges: { b2bDiscount: 5000, couponDiscount: 0, vatAmount: 0, deliveryFee: 0 },
        payment: { method: 'bank_transfer', status: 'paid', reference: 'TRX-9', instructions: 'BRAC A/C 123' },
        warranty: { months: 24, note: 'Covers parts and labour.' },
        notes: 'Delivered by hand.',
        terms: ['Custom term'],
        revision: 2,
        lastEditedAt: editedAt,
      };

      const { order: view, customer, meta } = composeInvoice(order, user, doc);

      expect(view.invoiceNumber).toBe('MPBD-INV-EDITED-1');
      expect(view.subtotal).toBe(226000);
      expect(view.totalAmount).toBe(221000);
      expect(view.paymentMethod).toBe('bank_transfer');
      expect(view.paymentStatus).toBe('paid');
      expect(view.paymentReference).toBe('TRX-9');
      expect(view.paymentInstructions).toBe('BRAC A/C 123');
      expect(view.customer.name).toBe('Accounts Payable');
      expect(customer.companyName).toBe('City Hospital');
      expect(view.deliveryAddress.street).toBe('12 Lab Road');
      expect(view.deliveryAddress.district).toBe('Dhaka');
      expect(view.dueDate).toEqual(doc.dueDate);
      expect(view.warrantyMonths).toBe(24);
      expect(view.warrantyNote).toBe('Covers parts and labour.');
      expect(view.invoiceNotes).toBe('Delivered by hand.');
      expect(view.invoiceTerms).toEqual(['Custom term']);
      expect(view.invoiceRevision).toBe(2);
      expect(meta).toMatchObject({ isEdited: true, revision: 2 });
    });
  });
});
