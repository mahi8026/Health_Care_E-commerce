/**
 * Admin InvoiceEditor tests — verifies the editor loads the composed invoice,
 * recalculates totals and submits a revisioned payload to the admin API.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InvoiceEditor from '@/components/admin/InvoiceEditor';

const orderPayload = {
  _id: '665f00000000000000000001',
  orderNumber: 'MC-260831-7CSNNJ',
  invoiceNumber: 'MC-260831-7CSNNJ',
  invoiceDate: new Date(2026, 7, 31, 12),
  dueDate: null,
  customer: {
    name: 'Mahi M Rahman',
    companyName: '',
    email: 'mahimrahman07@gmail.com',
    phone: '8801646886795',
  },
  deliveryAddress: {
    name: 'Mahi M Rahman',
    phone: '8801646886795',
    street: '7/8-A Free School Street, Hatirpool',
    thana: 'Hatirpool',
    district: 'Dhaka',
    postcode: '1205',
  },
  items: [
    { name: 'Excel Dengue IgG/IgM Rapid Test', sku: 'EXC-1', brand: 'Excel', qty: 1, price: 200, discount: 0, warranty: '' },
  ],
  b2bDiscount: 0,
  couponDiscount: 0,
  vatAmount: 0,
  deliveryFee: 70,
  paymentMethod: 'cod',
  paymentStatus: 'pending',
  paymentReference: '',
  paymentInstructions: '',
  warrantyMonths: null,
  warrantyNote: '',
  invoiceNotes: '',
  invoiceTerms: null,
  user: { name: 'Mahi M Rahman', email: 'mahimrahman07@gmail.com', phone: '8801646886795' },
};

function jsonResponse(payload) {
  return { ok: true, status: 200, json: async () => payload };
}

describe('InvoiceEditor', () => {
  beforeEach(() => {
    localStorage.setItem('Mediport_token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('loads the invoice, recalculates totals and saves a revisioned payload', async () => {
    const fetchMock = jest.fn(async (url, options = {}) => {
      if (!options.method || options.method === 'GET') {
        return jsonResponse({
          success: true,
          order: orderPayload,
          invoice: { isEdited: false, revision: 0, lastEditedAt: null },
          defaults: { terms: ['Products are subject to availability.'] },
        });
      }
      return jsonResponse({
        success: true,
        message: 'Invoice saved (revision 1)',
        order: orderPayload,
        invoice: { isEdited: true, revision: 1, lastEditedAt: new Date(2026, 8, 2, 10) },
      });
    });
    global.fetch = fetchMock;

    render(<InvoiceEditor orderId="665f00000000000000000001" />);

    const invoiceNumberInput = await screen.findByLabelText('Invoice number');
    expect(invoiceNumberInput).toHaveValue('MC-260831-7CSNNJ');
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('BDT 270')).toBeInTheDocument();
    expect(screen.getAllByText('BDT 200').length).toBeGreaterThan(0);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/invoices/order/665f00000000000000000001'),
      expect.objectContaining({ cache: 'no-store' })
    );

    fireEvent.change(invoiceNumberInput, { target: { value: 'mpbd-inv-260831-7csnnj' } });
    fireEvent.click(screen.getAllByRole('button', { name: /save invoice/i })[0]);

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([, opts]) => opts && opts.method === 'PUT')).toBe(true)
    );

    const [, putOptions] = fetchMock.mock.calls.find(([, opts]) => opts && opts.method === 'PUT');
    const body = JSON.parse(putOptions.body);
    expect(body.invoiceNumber).toBe('mpbd-inv-260831-7csnnj');
    expect(body.revision).toBe(0);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({ name: 'Excel Dengue IgG/IgM Rapid Test', qty: 1, price: 200 });
    expect(body.charges.deliveryFee).toBe(70);
    expect(putOptions.headers.Authorization).toBe('Bearer test-token');

    await waitFor(() => expect(screen.getByText(/Revision 1/)).toBeInTheDocument());
  });

  it('shows the load error with a retry action when the API fails', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 404,
      json: async () => ({ success: false, message: 'Order not found' }),
    }));

    render(<InvoiceEditor orderId="665f00000000000000000002" />);

    expect(await screen.findByText('Invoice could not be loaded')).toBeInTheDocument();
    expect(screen.getByText('Order not found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
