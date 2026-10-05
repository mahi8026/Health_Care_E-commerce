/**
 * Phase 4.2-D — quoteController.createQuote tests (no database required).
 *
 * Covers §M 24-30: normal response, CRM success/throw isolation, no rollback,
 * pricing / paymentTerms / quote numbering unchanged, plus the §G/§L security
 * rules (authenticated identity only, attribution passed through but never
 * stored on Quote).
 *
 * The real Quote model is used; only DB-touching calls are spied — the same
 * convention as crmController.test.js. Synthetic data only.
 */

const Quote = require('../../models/Quote');

jest.mock('../../utils/logger', () => ({
  error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn(),
}));
jest.mock('../../services/pricingService', () => ({ quoteItems: jest.fn() }));
jest.mock('../../services/leadAssociation', () => ({ associateRfq: jest.fn() }));
jest.mock('../../services/n8nWebhookService', () => ({ emitEvent: jest.fn() }));
jest.mock('../../utils/emailService', () => ({ sendQuotationReady: jest.fn() }));

const pricingService = require('../../services/pricingService');
const leadAssociation = require('../../services/leadAssociation');
const logger = require('../../utils/logger');
const { createQuote } = require('../quoteController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.locals = {};
  return res;
};
const bodyOf = (res) => res.json.mock.calls[res.json.mock.calls.length - 1][0];

const pricedLine = () => ({
  product: { _id: 'p1', name: 'ECG Machine', sku: 'ECG-1', brand: 'Mindray', price: 5000 },
  qty: 2,
  unitPrice: 5000,
  savings: 0,
  sizeName: undefined,
  isB2BPrice: false,
});

const quoteDoc = (over = {}) => ({
  _id: 'quote-1',
  quoteNumber: 'QT-2026-0042',
  user: 'user-1',
  items: [],
  subtotal: 10000,
  finalAmount: 10000,
  paymentTerms: 60,
  status: 'pending',
  ...over,
});

const reqOf = (body, user) => ({ body, user: user || { _id: 'user-1', paymentTerms: 30 } });

beforeEach(() => {
  jest.clearAllMocks();
  pricingService.quoteItems.mockResolvedValue([pricedLine()]);
  jest.spyOn(Quote, 'create').mockResolvedValue(quoteDoc());
  leadAssociation.associateRfq.mockResolvedValue({ ok: false, action: 'skipped', reason: 'not_eligible' });
});

// ---------------------------------------------------------------------------
// §M 24-27 — CRM association must be isolated from the RFQ success path (R2).
// ---------------------------------------------------------------------------
describe('createQuote — CRM isolation (R2)', () => {
  it('24. Quote.create succeeds → normal 201 response', async () => {
    const res = mockRes();
    await createQuote(reqOf({ items: [{ product: 'p1', qty: 2 }], paymentTerms: 60 }), res);
    expect(Quote.create).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    const body = bodyOf(res);
    expect(body.success).toBe(true);
    expect(body.data.quoteNumber).toBe('QT-2026-0042');
    expect(body.message).toContain('QT-2026-0042');
  });

  it('25. CRM succeeds → quote response is unchanged', async () => {
    leadAssociation.associateRfq.mockResolvedValue({ ok: true, action: 'linked', leadId: 'LD-2026-0001', linked: true });
    const res = mockRes();
    await createQuote(reqOf({ items: [{ product: 'p1', qty: 2 }], paymentTerms: 60 }), res);
    expect(leadAssociation.associateRfq).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(bodyOf(res)).toEqual(expect.objectContaining({ success: true }));
    expect(bodyOf(res).data.quoteNumber).toBe('QT-2026-0042');
    expect(bodyOf(res).message).not.toMatch(/crm|lead/i); // no CRM noise leaks out
  });

  it('26. CRM throws → quote response still succeeds and the error is logged safely', async () => {
    leadAssociation.associateRfq.mockRejectedValue(new Error('mongo unreachable'));
    const res = mockRes();
    await createQuote(reqOf({ items: [{ product: 'p1', qty: 2 }], paymentTerms: 60 }), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(bodyOf(res).success).toBe(true);
    expect(bodyOf(res).data.quoteNumber).toBe('QT-2026-0042');
    // Safe log only: single message string, no stack frames, nothing to client.
    expect(logger.error).toHaveBeenCalledWith('[createQuote] CRM association skipped: mongo unreachable');
    const logged = logger.error.mock.calls.map((c) => String(c[0])).join(' ');
    expect(logged).not.toMatch(/\bat\s+\w+\s+\(/);
    expect(JSON.stringify(bodyOf(res))).not.toContain('mongo unreachable');
  });

  it('27. CRM throw does not roll back or re-create the Quote', async () => {
    leadAssociation.associateRfq.mockRejectedValue(new Error('boom'));
    const res = mockRes();
    await createQuote(reqOf({ items: [{ product: 'p1', qty: 2 }], paymentTerms: 60 }), res);
    expect(Quote.create).toHaveBeenCalledTimes(1); // exactly one persisted Quote
    expect(res.status).not.toHaveBeenCalledWith(500);
    expect(res.status).not.toHaveBeenCalledWith(503);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

// ---------------------------------------------------------------------------
// §M 28-30 — pricing, paymentTerms and numbering must be untouched.
// ---------------------------------------------------------------------------
describe('createQuote — quote behaviour preserved (28-30)', () => {
  it('28. pricing still resolved server-side through pricingService', async () => {
    const items = [{ product: 'p1', qty: 2 }];
    const user = { _id: 'user-1', paymentTerms: 30 };
    const res = mockRes();
    await createQuote(reqOf({ items, paymentTerms: 60 }, user), res);
    expect(pricingService.quoteItems).toHaveBeenCalledWith(items, user);
    expect(bodyOf(res).data.subtotal).toBe(10000); // priced line, never client input
    expect(bodyOf(res).data.finalAmount).toBe(10000);
  });

  it('29. paymentTerms semantics unchanged (valid pass-through and user default)', async () => {
    const valid = mockRes();
    await createQuote(reqOf({ items: [{ product: 'p1', qty: 2 }], paymentTerms: 60 }), valid);
    expect(Quote.create.mock.calls[0][0].paymentTerms).toBe(60);

    jest.clearAllMocks();
    pricingService.quoteItems.mockResolvedValue([pricedLine()]);
    Quote.create.mockResolvedValue(quoteDoc({ paymentTerms: 30 }));
    leadAssociation.associateRfq.mockResolvedValue({ ok: false, action: 'skipped', reason: 'not_eligible' });
    const byDefault = mockRes();
    await createQuote(reqOf({ items: [{ product: 'p1', qty: 2 }] }), byDefault);
    expect(Quote.create.mock.calls[0][0].paymentTerms).toBe(30); // req.user.paymentTerms
  });

  it('29b. invalid paymentTerms → 400 before persistence and before any CRM attempt', async () => {
    const res = mockRes();
    await createQuote(reqOf({ items: [{ product: 'p1', qty: 2 }], paymentTerms: 45 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(Quote.create).not.toHaveBeenCalled();
    expect(leadAssociation.associateRfq).not.toHaveBeenCalled();
  });

  it('30. quote numbering unchanged — controller never generates its own', async () => {
    const res = mockRes();
    await createQuote(reqOf({ items: [{ product: 'p1', qty: 2 }], paymentTerms: 60 }), res);
    expect(Quote.create.mock.calls[0][0]).not.toHaveProperty('quoteNumber');
    expect(Quote.create.mock.calls[0][0]).not.toHaveProperty('quoteId');
    expect(bodyOf(res).data.quoteNumber).toBe('QT-2026-0042'); // whatever the model produced
    expect(bodyOf(res).message).toContain('QT-2026-0042');
  });
});

// ---------------------------------------------------------------------------
// §G/§L — identity and payload handling at the post-Quote.create boundary.
// ---------------------------------------------------------------------------
describe('createQuote — identity and payload (§G/§L)', () => {
  it('uses the authenticated identity only — client customer/userId injection ignored', async () => {
    const res = mockRes();
    await createQuote(reqOf({
      items: [{ product: 'p1', qty: 2 }],
      paymentTerms: 60,
      customer: 'attacker-supplied-id',
      userId: 'attacker-supplied-id',
    }), res);
    expect(leadAssociation.associateRfq).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' })
    );
    const arg = leadAssociation.associateRfq.mock.calls[0][0];
    expect(arg.customer).toBeUndefined();
    expect(arg.userId).not.toBe('attacker-supplied-id');
  });

  it('passes attribution through to the service but never stores it on Quote', async () => {
    const attribution = {
      utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'phase42-test',
      utm_content: 'test-a', utm_term: 'ignored', gclid: 'XYZ123',
      landing_page: '/quotes/request',
    };
    const res = mockRes();
    await createQuote(reqOf({ items: [{ product: 'p1', qty: 2 }], paymentTerms: 60, attribution }), res);
    expect(leadAssociation.associateRfq).toHaveBeenCalledWith(
      expect.objectContaining({ attribution })
    );
    // Quote.js remains the quotation source of truth — no CRM fields on it.
    const createArg = Quote.create.mock.calls[0][0];
    expect(createArg).not.toHaveProperty('attribution');
    expect(createArg).not.toHaveProperty('customer');
    expect(createArg).not.toHaveProperty('lead');
  });
});
