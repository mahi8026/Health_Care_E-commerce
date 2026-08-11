const axios = require('axios');
const {
  SteadfastError,
  isConfigured,
  createShipment,
  getBalance,
  getStatusByInvoice,
  getStatusByCid,
  getStatusByTrackingCode,
  normalizePhone,
  buildShipmentPayload
} = require('../steadfastService');

jest.mock('axios');

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  jest.clearAllMocks();
  process.env.STEADFAST_API_KEY = 'test-api-key';
  process.env.STEADFAST_SECRET_KEY = 'test-secret-key';
  process.env.STEADFAST_BASE_URL = 'https://portal.packzy.com/api/v1';
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('steadfastService - config', () => {
  it('should report configured when keys are set', () => {
    expect(isConfigured()).toBe(true);
  });

  it('should report not configured when keys are missing or placeholders', () => {
    delete process.env.STEADFAST_API_KEY;
    expect(isConfigured()).toBe(false);
    process.env.STEADFAST_API_KEY = 'YOUR_API_KEY';
    expect(isConfigured()).toBe(false);
  });
});

describe('steadfastService - createShipment', () => {
  it('should return the consignment on success', async () => {
    const consignment = {
      consignment_id: 131822154,
      invoice: 'ORD-00042',
      tracking_code: '7DB724A65D4',
      status: 'in_review'
    };
    axios.mockResolvedValue({ data: { status: 200, message: 'Consignment has been created successfully.', consignment } });

    const result = await createShipment({
      invoice: 'ORD-00042',
      recipientName: 'Mahi M Rahman',
      recipientPhone: '01711111111',
      recipientAddress: 'House 12, Dhaka',
      codAmount: 1500
    });

    expect(result).toEqual(consignment);
    expect(axios).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST',
      url: 'https://portal.packzy.com/api/v1/create_order',
      data: expect.objectContaining({
        invoice: 'ORD-00042',
        recipient_name: 'Mahi M Rahman',
        recipient_phone: '01711111111',
        cod_amount: '1500',
        delivery_type: 0
      }),
      headers: expect.objectContaining({
        'Api-Key': 'test-api-key',
        'Secret-Key': 'test-secret-key'
      })
    }));
  });

  it('should throw SteadfastError with API message on failure', async () => {
    axios.mockRejectedValue({
      response: { status: 422, data: { status: 422, message: 'THIS_INVOICE_ALREADY_EXISTS' } }
    });

    await expect(createShipment({ invoice: 'ORD-00042' })).rejects.toMatchObject({
      name: 'SteadfastError',
      status: 422,
      body: { status: 422, message: 'THIS_INVOICE_ALREADY_EXISTS' }
    });
  });

  it('should throw when SteadFast is not configured', async () => {
    delete process.env.STEADFAST_API_KEY;
    await expect(createShipment({ invoice: 'X' })).rejects.toThrow('SteadFast is not configured');
    expect(axios).not.toHaveBeenCalled();
  });
});

describe('steadfastService - status & balance lookups', () => {
  it('should return the balance', async () => {
    axios.mockResolvedValue({ data: { status: 200, current_balance: 1250.5 } });
    await expect(getBalance()).resolves.toBe(1250.5);
    expect(axios).toHaveBeenCalledWith(expect.objectContaining({
      method: 'GET',
      url: 'https://portal.packzy.com/api/v1/get_balance'
    }));
  });

  it('should return status by invoice', async () => {
    axios.mockResolvedValue({ data: { status: 200, delivery_status: 'in_review' } });
    await expect(getStatusByInvoice('ORD-00042')).resolves.toEqual({ status: 200, delivery_status: 'in_review' });
    expect(axios).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://portal.packzy.com/api/v1/status_by_invoice/ORD-00042'
    }));
  });

  it('should return status by consignment id', async () => {
    axios.mockResolvedValue({ data: { status: 200, data: { delivery_status: 'delivered' } } });
    await expect(getStatusByCid(131822154)).resolves.toEqual({ status: 200, data: { delivery_status: 'delivered' } });
  });

  it('should return status by tracking code', async () => {
    axios.mockResolvedValue({ data: { status: 200, delivery_status: 'pending' } });
    await expect(getStatusByTrackingCode('7DB724A65D4')).resolves.toEqual({ status: 200, delivery_status: 'pending' });
  });

  it('should wrap failed lookups in SteadfastError', async () => {
    axios.mockRejectedValue({ response: { status: 401, data: 'Unauthorized Access' } });
    await expect(getStatusByInvoice('NOPE')).rejects.toBeInstanceOf(SteadfastError);
  });
});

describe('steadfastService - helpers', () => {
  it('should normalize BD phone numbers to 11 digits', () => {
    expect(normalizePhone('01711111111')).toBe('01711111111');
    expect(normalizePhone('+8801711111111')).toBe('01711111111');
    expect(normalizePhone('8801711111111')).toBe('01711111111');
    expect(normalizePhone('1711111111')).toBe('01711111111');
    expect(normalizePhone('12345')).toBe('');
    expect(normalizePhone()).toBe('');
  });

  it('should build a COD payload from an order', () => {
    const order = {
      orderNumber: 'ORD-00100',
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      totalAmount: 2500,
      deliveryAddress: { name: 'Rahim', phone: '+8801711111111', street: 'House 5', area: 'Dhanmondi', district: 'Dhaka', instructions: 'Call on arrival' },
      items: [{ name: 'Paracetamol', qty: 2 }, { name: 'Bandage', qty: 1 }]
    };
    const payload = buildShipmentPayload(order);
    expect(payload).toMatchObject({
      invoice: 'ORD-00100',
      recipientName: 'Rahim',
      recipientPhone: '01711111111',
      recipientAddress: 'House 5, Dhanmondi, Dhaka',
      codAmount: 2500,
      totalLot: 3
    });
    expect(payload.itemDescription).toContain('Paracetamol x2');
  });

  it('should build a prepaid payload with zero COD amount', () => {
    const order = {
      orderNumber: 'ORD-00101',
      paymentMethod: 'bank_transfer',
      paymentStatus: 'paid',
      totalAmount: 999,
      deliveryAddress: { name: 'Karim', phone: '01711111111', district: 'Chittagong' },
      items: [{ name: 'Glucose', qty: 1 }]
    };
    const payload = buildShipmentPayload(order);
    expect(payload.codAmount).toBe(0);
    expect(payload.recipientAddress).toBe('Chittagong');
  });
});