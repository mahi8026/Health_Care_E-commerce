/**
 * trackGuestCartForEmail — links a captured guest email to cart contents.
 *
 * This is the join that makes abandoned-cart recovery possible for guests at
 * all: without it the recovery sweep has an email with no cart, or a cart with
 * no email. Fired from both the checkout address form and the exit-intent
 * popup, so it must be safe to call from a lead-capture path and must never
 * throw (a tracking failure must not break signup or checkout).
 */
jest.mock('@/constants/api', () => ({ API: 'http://localhost:5000/api' }));
jest.mock('@/constants/config', () => ({ TIMEOUTS: { API_REQUEST: 15000 } }));

const mockTrackGuestCart = jest.fn();
jest.mock('@/utils/api', () => ({
  __esModule: true,
  default: { trackGuestCart: (...args) => mockTrackGuestCart(...args) },
}));

const SESSION_KEY = 'mediport_guest_cart_session';
const ITEMS = [
  { id: '507f1f77bcf86cd799439011', quantity: 2, price: 999, name: 'Stethoscope' },
  { _id: '507f1f77bcf86cd799439022', quantity: 1 },
];

beforeEach(() => {
  jest.resetModules();
  mockTrackGuestCart.mockReset();
  localStorage.clear();
});

describe('trackGuestCartForEmail', () => {
  test('sends the session id, email and id/quantity pairs', () => {
    const { trackGuestCartForEmail } = require('@/utils/guestCartTracking');

    trackGuestCartForEmail('guest@example.com', ITEMS);

    expect(mockTrackGuestCart).toHaveBeenCalledTimes(1);
    const payload = mockTrackGuestCart.mock.calls[0][0];
    expect(payload.email).toBe('guest@example.com');
    expect(payload.items).toEqual([
      { id: '507f1f77bcf86cd799439011', quantity: 2 },
      { id: '507f1f77bcf86cd799439022', quantity: 1 },
    ]);
    expect(payload.sessionId).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });

  test('never leaks client-side prices to the server', () => {
    const { trackGuestCartForEmail } = require('@/utils/guestCartTracking');

    trackGuestCartForEmail('guest@example.com', ITEMS);

    const payload = mockTrackGuestCart.mock.calls[0][0];
    expect(payload.items.every((i) => !('price' in i) && !('name' in i))).toBe(true);
  });

  test('reuses one session id across calls so the cart is not split', () => {
    const { trackGuestCartForEmail } = require('@/utils/guestCartTracking');

    trackGuestCartForEmail('guest@example.com', ITEMS);
    trackGuestCartForEmail('guest@example.com', ITEMS);

    const [first, second] = mockTrackGuestCart.mock.calls;
    expect(second[0].sessionId).toBe(first[0].sessionId);
    expect(localStorage.getItem(SESSION_KEY)).toBe(first[0].sessionId);
  });

  test('trims the email before sending it', () => {
    const { trackGuestCartForEmail } = require('@/utils/guestCartTracking');

    trackGuestCartForEmail('   guest@example.com  ', ITEMS);

    expect(mockTrackGuestCart.mock.calls[0][0].email).toBe('guest@example.com');
  });

  test('does nothing without a usable email or items', () => {
    const { trackGuestCartForEmail } = require('@/utils/guestCartTracking');

    trackGuestCartForEmail('', ITEMS);
    trackGuestCartForEmail('   ', ITEMS);
    trackGuestCartForEmail('not-an-email', ITEMS); // popup allowlist rejects it
    trackGuestCartForEmail('guest@example.com', []); // empty cart — nothing to recover
    trackGuestCartForEmail('guest@example.com', undefined);
    trackGuestCartForEmail('guest@example.com', [{ quantity: 3 }]); // no product id

    expect(mockTrackGuestCart).not.toHaveBeenCalled();
  });

  test('swallows a rejected tracking request', async () => {
    mockTrackGuestCart.mockRejectedValue(new Error('network down'));
    const { trackGuestCartForEmail } = require('@/utils/guestCartTracking');

    await expect(trackGuestCartForEmail('guest@example.com', ITEMS)).resolves.toBeNull();
  });
});