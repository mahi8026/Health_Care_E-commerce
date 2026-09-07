/**
 * Unit tests for getSiteUrl() — the canonical site URL helper.
 *
 * Covers the P0 host-consolidation fix: NEXT_PUBLIC_SITE_URL must always
 * resolve to https://www.mediportbd.com (the serving host) for canonicals,
 * sitemaps, Open Graph and schema.org URLs.
 */

import getSiteUrl, { getSiteUrl as namedGetSiteUrl } from '@/utils/siteUrl';

describe('getSiteUrl', () => {
  const ORIGINAL = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (ORIGINAL === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL;
    }
  });

  it('defaults to https://www.mediportbd.com when the env var is unset', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(getSiteUrl()).toBe('https://www.mediportbd.com');
  });

  it('defaults to https://www.mediportbd.com for an empty-string env var', () => {
    process.env.NEXT_PUBLIC_SITE_URL = '';
    expect(getSiteUrl()).toBe('https://www.mediportbd.com');
  });

  it('defaults for a whitespace-only env var', () => {
    process.env.NEXT_PUBLIC_SITE_URL = '   ';
    expect(getSiteUrl()).toBe('https://www.mediportbd.com');
  });

  it('keeps the canonical www host unchanged (idempotent)', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.mediportbd.com';
    expect(getSiteUrl()).toBe('https://www.mediportbd.com');
  });

  it('normalizes the apex non-www host to www', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://mediportbd.com';
    expect(getSiteUrl()).toBe('https://www.mediportbd.com');
  });

  it('normalizes a mixed-case apex host to lowercase www', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://MediportBD.com';
    expect(getSiteUrl()).toBe('https://www.mediportbd.com');
  });

  it('strips trailing slashes before normalizing', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://mediportbd.com/';
    expect(getSiteUrl()).toBe('https://www.mediportbd.com');
  });

  it('keeps a trailing slash on the www host stripped', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.mediportbd.com/';
    expect(getSiteUrl()).toBe('https://www.mediportbd.com');
  });

  it('leaves localhost untouched for local development', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    expect(getSiteUrl()).toBe('http://localhost:3000');
  });

  it('leaves api subdomain hosts untouched', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://api.mediportbd.com';
    expect(getSiteUrl()).toBe('https://api.mediportbd.com');
  });

  it('leaves unrelated production hosts untouched', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.mediportbd.com';
    expect(getSiteUrl()).toBe('https://staging.mediportbd.com');
  });

  it('exposes the same function as the default and named exports', () => {
    expect(getSiteUrl).toBe(namedGetSiteUrl);
  });
});