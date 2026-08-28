/**
 * T14 — S-12 frontend: refresh-token storage honors cookie-auth mode.
 *
 * With NEXT_PUBLIC_AUTH_COOKIES=true the backend owns the refresh credential
 * in an httpOnly cookie; this client must never persist it to localStorage
 * (XSS-readable) and must purge any pre-rollout copy on the first write path.
 * Without the flag the legacy localStorage behavior must be unchanged.
 */
jest.mock('@/constants/api', () => ({ API: 'http://localhost:5000/api' }));
jest.mock('@/constants/config', () => ({ TIMEOUTS: { API_REQUEST: 15000 } }));

const REFRESH_KEY = 'Mediport_refresh_token';
const ENV_BACKUP = { ...process.env };

beforeEach(() => {
  jest.resetModules();
  process.env = { ...ENV_BACKUP };
  localStorage.clear();
  delete process.env.NEXT_PUBLIC_AUTH_COOKIES;
});

afterEach(() => {
  process.env = ENV_BACKUP;
});

describe('setRefreshToken storage (S-12)', () => {
  test('legacy mode (flag unset): writes the refresh token to localStorage', () => {
    const { setRefreshToken, getRefreshToken } = require('@/utils/api');
    setRefreshToken('ref-legacy');
    expect(localStorage.getItem(REFRESH_KEY)).toBe('ref-legacy');
    expect(getRefreshToken()).toBe('ref-legacy');
  });

  test('cookie-auth mode: never writes the refresh token to localStorage', () => {
    process.env.NEXT_PUBLIC_AUTH_COOKIES = 'true';
    const { setRefreshToken } = require('@/utils/api');
    setRefreshToken('ref-cookie');
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
  });

  test('cookie-auth mode: purges a pre-rollout legacy copy on first write', () => {
    localStorage.setItem(REFRESH_KEY, 'legacy-token');
    process.env.NEXT_PUBLIC_AUTH_COOKIES = 'true';
    const { setRefreshToken, getRefreshToken } = require('@/utils/api');
    setRefreshToken('ref-cookie');
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  test('access token storage is unaffected by cookie-auth mode', () => {
    process.env.NEXT_PUBLIC_AUTH_COOKIES = 'true';
    const { setToken, getToken } = require('@/utils/api');
    setToken('access-123');
    expect(getToken()).toBe('access-123');
  });
});