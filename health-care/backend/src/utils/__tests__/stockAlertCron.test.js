/**
 * Tests for the in-process cron suite — focused on abandoned-cart recovery,
 * which is the money path: every cart is a customer who was about to buy.
 *
 * Two behaviours are pinned here:
 *  1. Recovery is claimed atomically per cart, so overlapping runs can never
 *     email the same customer twice, and a failed send releases the claim so
 *     the cart is retried instead of being lost.
 *  2. The backend cron is only handed over to n8n when n8n is genuinely wired
 *     up (flag AND webhook base URL). Previously the flag alone disabled it, so
 *     a stale N8N_EVENTS_ENABLED=true with no reachable n8n silently stopped
 *     ALL cart recovery (backend cron off, WF-03 never firing).
 */
jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../../models/Product');
jest.mock('../../models/Cart');
jest.mock('../../models/Order');
jest.mock('../../controllers/flashDealController', () => ({ updateFlashDealStatuses: jest.fn() }));
jest.mock('../emailService', () => ({
  sendLowStockAlert: jest.fn(),
  sendAbandonedCartEmail: jest.fn()
}));
jest.mock('../logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const cron = require('node-cron');
const Cart = require('../../models/Cart');
const Order = require('../../models/Order');
const { sendAbandonedCartEmail } = require('../emailService');
const logger = require('../logger');
const { startCronJobs, runAbandonedCartRecovery } = require('../stockAlertCron');

/** Cart.find(...).limit().populate().populate() resolves to `carts`. */
function mockCartQuery(carts) {
  const lastPopulate = jest.fn().mockResolvedValue(carts);
  const firstPopulate = jest.fn().mockReturnValue({ populate: lastPopulate });
  return { limit: jest.fn().mockReturnValue({ populate: firstPopulate }) };
}

/** The atomic claim resolves to `claimed`. */
function mockClaim(claimed) {
  return { select: jest.fn().mockResolvedValue(claimed) };
}

describe('runAbandonedCartRecovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Cart.updateOne.mockResolvedValue({ acknowledged: true });
    Order.exists.mockResolvedValue(null);
    sendAbandonedCartEmail.mockResolvedValue({ messageId: 'msg-1' });
  });

  it('emails a registered customer and returns a summary', async () => {
    const cart = {
      _id: 'c1',
      user: { name: 'Rahim', email: 'rahim@example.com' },
      items: [{ product: { name: 'ECG' }, qty: 1 }],
      recoveryOptOutToken: 'tok-1'
    };
    Cart.find.mockReturnValue(mockCartQuery([cart]));
    Cart.findOneAndUpdate.mockReturnValue(mockClaim({ _id: 'c1' }));

    const summary = await runAbandonedCartRecovery();

    expect(sendAbandonedCartEmail).toHaveBeenCalledWith(
      cart,
      { name: 'Rahim', email: 'rahim@example.com' },
      'tok-1'
    );
    expect(summary).toEqual({ candidates: 1, sent: 1, alreadyOrdered: 0, claimedElsewhere: 0, failed: 0 });
  });

  it('emails a guest cart via the email captured at checkout', async () => {
    const cart = { _id: 'g1', user: null, contactEmail: 'guest@example.com', items: [{}] };
    Cart.find.mockReturnValue(mockCartQuery([cart]));
    Cart.findOneAndUpdate.mockReturnValue(mockClaim({ _id: 'g1' }));

    const summary = await runAbandonedCartRecovery();

    expect(sendAbandonedCartEmail).toHaveBeenCalledWith(
      cart,
      { name: 'there', email: 'guest@example.com' },
      undefined
    );
    expect(summary.sent).toBe(1);
  });

  it('never double-sends when another run already claimed the cart', async () => {
    Cart.find.mockReturnValue(mockCartQuery([{ _id: 'c2', user: { email: 'a@b.com' }, items: [{}] }]));
    Cart.findOneAndUpdate.mockReturnValue(mockClaim(null)); // claim lost / already claimed

    const summary = await runAbandonedCartRecovery();

    expect(sendAbandonedCartEmail).not.toHaveBeenCalled();
    expect(summary).toEqual({ candidates: 1, sent: 0, alreadyOrdered: 0, claimedElsewhere: 1, failed: 0 });
  });
  it('skips a customer who placed an order after the cart was created', async () => {
    Cart.find.mockReturnValue(mockCartQuery([{ _id: 'c3', user: { email: 'done@example.com' }, items: [{}] }]));
    Cart.findOneAndUpdate.mockReturnValue(mockClaim({ _id: 'c3' }));
    Order.exists.mockResolvedValue({ _id: 'order-1' });

    const summary = await runAbandonedCartRecovery();

    expect(sendAbandonedCartEmail).not.toHaveBeenCalled();
    expect(summary.alreadyOrdered).toBe(1);
  });

  it('releases the claim when the send fails so the next run retries', async () => {
    Cart.find.mockReturnValue(mockCartQuery([{ _id: 'c4', user: { email: 'flaky@example.com' }, items: [{}] }]));
    Cart.findOneAndUpdate.mockReturnValue(mockClaim({ _id: 'c4' }));
    sendAbandonedCartEmail.mockRejectedValue(new Error('Brevo 429'));

    const summary = await runAbandonedCartRecovery();

    expect(summary.failed).toBe(1);
    expect(Cart.updateOne).toHaveBeenCalledWith(
      { _id: 'c4' },
      { $set: { recoveryEmailSent: false, recoveryEmailSentAt: null } }
    );
  });

  it('records an unreachable cart as abandoned without emailing anybody', async () => {
    Cart.find.mockReturnValue(mockCartQuery([{ _id: 'u1', user: null, contactEmail: '', items: [{}] }]));

    const summary = await runAbandonedCartRecovery();

    expect(sendAbandonedCartEmail).not.toHaveBeenCalled();
    expect(Cart.updateOne).toHaveBeenCalledWith(
      { _id: 'u1', isAbandoned: false },
      { $set: { isAbandoned: true, abandonedAt: expect.any(Date) } }
    );
    expect(summary.sent).toBe(0);
  });

  it('queries only opted-in, reachable, unused carts and bounds the batch', async () => {
    const query = mockCartQuery([]);
    Cart.find.mockReturnValue(query);

    await runAbandonedCartRecovery();

    const filter = Cart.find.mock.calls[0][0];
    expect(filter.recoveryEmailSent).toBe(false);
    expect(filter.recoveryOptOut).toEqual({ $ne: true });
    expect(filter['items.0']).toEqual({ $exists: true });
    expect(filter.$or).toEqual([
      { user: { $exists: true, $ne: null } },
      { contactEmail: { $exists: true, $nin: [null, ''] } }
    ]);
    expect(query.limit).toHaveBeenCalledWith(200);
  });
});

describe('startCronJobs — n8n handover guard', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  it('keeps the backend cart cron when the n8n flag is set but no webhook URL exists (regression)', () => {
    process.env.N8N_EVENTS_ENABLED = 'true';
    delete process.env.N8N_WEBHOOK_BASE_URL;

    startCronJobs();

    // stock alerts + quote expiry + abandoned carts + flash deals
    expect(cron.schedule).toHaveBeenCalledTimes(4);
    expect(logger.info).not.toHaveBeenCalledWith(expect.stringContaining('handled by n8n WF-03'));
  });

  it('defers to n8n only when the flag and the webhook URL are both set', () => {
    process.env.N8N_EVENTS_ENABLED = 'true';
    process.env.N8N_WEBHOOK_BASE_URL = 'http://n8n.internal:5678';

    startCronJobs();

    expect(cron.schedule).toHaveBeenCalledTimes(3);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('handled by n8n WF-03'));
  });
});
