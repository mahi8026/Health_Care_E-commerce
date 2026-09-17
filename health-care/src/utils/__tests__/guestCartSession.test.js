/**
 * Guest cart session id — the key that lets a guest's abandoned cart be
 * recovered at all (guests have no server-side cart, so this is the only thing
 * tying a tracked snapshot back to the browser that abandoned it).
 *
 * The backend validates the id against /^[A-Za-z0-9_-]{8,64}$/ and rejects
 * anything else with a 400, so the generated format is part of the contract.
 */

const SESSION_KEY = 'mediport_guest_cart_session';
const BACKEND_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

beforeEach(() => {
  jest.resetModules();
  localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getGuestCartSessionId', () => {
  test('mints and persists an id on first call', () => {
    const { getGuestCartSessionId } = require('@/utils/guestCartSession');
    const id = getGuestCartSessionId();

    expect(id).toMatch(BACKEND_PATTERN);
    expect(localStorage.getItem(SESSION_KEY)).toBe(id);
  });

  test('is stable across calls so one cart maps to one browser', () => {
    const { getGuestCartSessionId } = require('@/utils/guestCartSession');
    expect(getGuestCartSessionId()).toBe(getGuestCartSessionId());
  });

  test('reuses a valid stored id instead of minting a new one', () => {
    localStorage.setItem(SESSION_KEY, 'stored-session-1234');
    const { getGuestCartSessionId } = require('@/utils/guestCartSession');

    expect(getGuestCartSessionId()).toBe('stored-session-1234');
  });

  test('replaces a malformed stored id the backend would reject', () => {
    localStorage.setItem(SESSION_KEY, 'bad id!');
    const { getGuestCartSessionId } = require('@/utils/guestCartSession');
    const id = getGuestCartSessionId();

    expect(id).not.toBe('bad id!');
    expect(id).toMatch(BACKEND_PATTERN);
    expect(localStorage.getItem(SESSION_KEY)).toBe(id);
  });

  test('returns null (tracking is best-effort) when storage is unavailable', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage denied');
    });
    const { getGuestCartSessionId } = require('@/utils/guestCartSession');

    expect(getGuestCartSessionId()).toBeNull();
  });
});
