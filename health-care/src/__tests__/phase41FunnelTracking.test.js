// health-care/src/__tests__/phase41FunnelTracking.test.js
//
// Phase 4.1 targeted tests — attribution (UTM capture), centralized funnel
// events (whatsapp_click / rfq_start / rfq_complete), and their wiring in
// FloatingWhatsAppButton and QuoteRequestPage. Also guards the pre-existing
// quote_request_submitted behavior (regression).

jest.mock('next/dynamic', () => () => () => null);
jest.mock('next/navigation', () => {
  const searchGet = jest.fn(() => null);
  return {
    usePathname: jest.fn(() => '/'),
    useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn(), refresh: jest.fn() })),
    useSearchParams: jest.fn(() => ({ get: searchGet })),
    __searchGet: searchGet,
  };
});

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { captureUtm, getUtmParams } from '@/utils/attribution';
import {
  trackWhatsAppClick,
  trackRfqStart,
  trackRfqComplete,
  derivePageType,
  deriveRfqEntryPoint,
} from '@/services/funnelTracking';
import GA4Tracker from '@/services/GA4Tracker';

jest.mock('@/services/GA4Tracker', () => ({
  __esModule: true,
  default: { trackEvent: jest.fn() },
}));

jest.mock('@/components/account/AccountPageShell', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }) => React.createElement('div', null, children),
  };
});

jest.mock('@/utils/marketingBeacon', () => ({
  __esModule: true,
  trackMarketingEvent: jest.fn(),
}));

jest.mock('@/services/MetaPixelTracker', () => ({
  __esModule: true,
  default: { trackCustomEvent: jest.fn(), trackLead: jest.fn(), track: jest.fn() },
}));

const trackEvent = GA4Tracker.trackEvent;

beforeEach(() => {
  jest.clearAllMocks();
  // Explicit reset — clearAllMocks keeps implementations, so a previous test's
  // throwing implementation must be removed here (funnelTracking swallows
  // GA4Tracker throws, which would otherwise silently abort later assertions).
  trackEvent.mockReset();
  window.sessionStorage.clear();
  window.history.pushState({}, '', '/');
});

// ---------------------------------------------------------------------------
// Workstream B — UTM attribution
// ---------------------------------------------------------------------------
describe('attribution (UTM capture)', () => {
  it('captures the four allowlisted UTM params from the URL and persists them', () => {
    window.history.pushState(
      {},
      '',
      '/?utm_source=google&utm_medium=cpc&utm_campaign=lab-equipment&utm_content=ecg-guide&utm_term=ignored&gclid=XYZ'
    );
    const utm = captureUtm();
    expect(utm).toEqual({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'lab-equipment',
      utm_content: 'ecg-guide',
    });
    expect(window.sessionStorage.getItem('mediport_utm')).toContain('google');
  });

  it('replays stored UTM on later clean-URL events (first-touch survives)', () => {
    window.history.pushState({}, '', '/?utm_source=linkedin&utm_medium=organic_social');
    captureUtm();
    window.history.pushState({}, '', '/quotes/request');
    expect(getUtmParams()).toEqual({
      utm_source: 'linkedin',
      utm_medium: 'organic_social',
    });
  });

  it('returns {} when nothing was ever captured', () => {
    expect(getUtmParams()).toEqual({});
    expect(captureUtm()).toBeNull();
  });

  it('sanitizes and truncates values', () => {
    window.history.pushState({}, '', '/?utm_source=' + 'x'.repeat(200));
    const utm = captureUtm();
    expect(utm.utm_source).toHaveLength(64);
  });
});

// ---------------------------------------------------------------------------
// Workstream B/C — centralized funnel events (no PII, exact contracts)
// ---------------------------------------------------------------------------
describe('funnelTracking events', () => {
  it('whatsapp_click carries page_type + page_location + UTM and no PII keys', () => {
    window.history.pushState({}, '', '/products/ecg?utm_source=google&utm_medium=cpc');
    trackWhatsAppClick({
      pageType: 'product',
      productId: 'p123',
      category: 'Diagnostic Equipment',
      entryPoint: 'product_page',
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
    const [name, params] = trackEvent.mock.calls[0];
    expect(name).toBe('whatsapp_click');
    expect(params.page_type).toBe('product');
    expect(params.product_id).toBe('p123');
    expect(params.category).toBe('Diagnostic Equipment');
    expect(params.entry_point).toBe('product_page');
    expect(params.page_location).toContain('/products/ecg');
    expect(params.utm_source).toBe('google');
    for (const key of ['phone', 'email', 'name', 'person_name', 'organization', 'contact', 'user_id']) {
      expect(params).not.toHaveProperty(key);
    }
  });

  it('rfq_start fires once with entry_point + context', () => {
    trackRfqStart({ entryPoint: 'product' });
    expect(trackEvent).toHaveBeenCalledTimes(1);
    const [name, params] = trackEvent.mock.calls[0];
    expect(name).toBe('rfq_start');
    expect(params.entry_point).toBe('product');
    expect(params).toHaveProperty('page_location');
  });

  it('rfq_complete fires once with items, counts, segment, quote number', () => {
    trackRfqComplete({ items: ['p1', 'p2'], itemCount: 2, segment: 'b2b', quoteNumber: 'QT-9' });
    expect(trackEvent).toHaveBeenCalledTimes(1);
    const [name, params] = trackEvent.mock.calls[0];
    expect(name).toBe('rfq_complete');
    expect(params.items).toEqual(['p1', 'p2']);
    expect(params.item_count).toBe(2);
    expect(params.segment).toBe('b2b');
    expect(params.quote_number).toBe('QT-9');
    for (const key of ['phone', 'email', 'name', 'organization']) {
      expect(params).not.toHaveProperty(key);
    }
  });

  it('never propagates analytics errors to the caller', () => {
    trackEvent.mockImplementation(() => {
      throw new Error('boom');
    });
    expect(() => trackWhatsAppClick()).not.toThrow();
    expect(() => trackRfqStart()).not.toThrow();
    expect(() => trackRfqComplete()).not.toThrow();
    trackEvent.mockReset();
  });
});

describe('page-type / entry-point derivation', () => {
  it('maps known routes', () => {
    expect(derivePageType('/')).toBe('home');
    expect(derivePageType('/products')).toBe('category');
    expect(derivePageType('/products/some-item')).toBe('product');
    expect(derivePageType('/guides/ecg-guide')).toBe('guide');
    expect(derivePageType('/b2b')).toBe('b2b');
    expect(derivePageType('/quotes/request')).toBe('rfq');
    expect(derivePageType('/cart')).toBe('cart');
    expect(derivePageType('/unknown')).toBe('other');
  });

  it('derives RFQ entry point from same-origin referrer', () => {
    Object.defineProperty(document, 'referrer', {
      value: window.location.origin + '/products/ecg-machine',
      configurable: true,
    });
    expect(deriveRfqEntryPoint()).toBe('product');
    Object.defineProperty(document, 'referrer', { value: 'https://google.com/x', configurable: true });
    expect(deriveRfqEntryPoint()).toBe('external');
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });
    expect(deriveRfqEntryPoint()).toBe('direct');
  });
});


// ---------------------------------------------------------------------------
// Workstream C — WhatsApp widget wiring (single fire, centralized path)
// ---------------------------------------------------------------------------
describe('FloatingWhatsAppButton wiring', () => {
  beforeEach(() => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/products/ecg-machine');
  });

  it('fires whatsapp_click exactly once per click with derived page type', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

    const FloatingWhatsAppButton = require('@/components/ui/FloatingWhatsAppButton').default;
    render(<FloatingWhatsAppButton />);

    const btn = screen.getByLabelText('Chat on WhatsApp');
    fireEvent.click(btn);

    // Downstream assertion: real funnelTracking → mocked GA4Tracker.
    expect(trackEvent).toHaveBeenCalledTimes(1);
    const [name, params] = trackEvent.mock.calls[0];
    expect(name).toBe('whatsapp_click');
    expect(params.page_type).toBe('product');
    expect(params.entry_point).toBe('floating_button');
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(String(openSpy.mock.calls[0][0])).toContain('wa.me');

    openSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Workstreams B/D — RFQ events wired into QuoteRequestPage, with the legacy
// quote_request_submitted behavior kept intact (regression).
// ---------------------------------------------------------------------------
describe('QuoteRequestPage RFQ events', () => {
  const product = { _id: 'p1', name: 'ECG Machine', sku: 'ECG-1', price: 5000, brand: 'Mindray' };

  beforeEach(() => {
    window.localStorage.setItem('Mediport_token', 'test-token');
    global.fetch = jest.fn((url) => {
      if (String(url).includes('/products')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [product] }) });
      }
      if (String(url).includes('/quotes')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: { quoteNumber: 'QT-100' } }) });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: 'nf' }) });
    });
    const { __searchGet } = require('next/navigation');
    __searchGet.mockImplementation((k) => (k === 'product' ? 'p1' : null));
  });

  afterEach(() => {
    window.localStorage.clear();
    delete global.fetch;
  });

  it('fires rfq_start on mount and rfq_complete + legacy event after server confirm', async () => {
    const QuoteRequestPage = require('@/views/account/QuoteRequestPage').default;
    render(<QuoteRequestPage />);

    // rfq_start once when the form opens (real funnelTracking → GA4Tracker).
    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith('rfq_start', expect.any(Object))
    );
    const startCall = trackEvent.mock.calls.find((c) => c[0] === 'rfq_start');
    expect(startCall[1].entry_point).toEqual(expect.any(String));

    const submit = await screen.findByRole('button', { name: /Submit Quotation Request/i });
    await waitFor(() => expect(submit).not.toBeDisabled());

    await act(async () => {
      fireEvent.submit(submit.closest('form'));
    });

    // Canonical funnel completion with server-confirmed quote number.
    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith('rfq_complete', expect.any(Object))
    );
    const doneCall = trackEvent.mock.calls.find((c) => c[0] === 'rfq_complete');
    expect(doneCall[1]).toEqual(
      expect.objectContaining({
        items: ['p1'],
        item_count: 1,
        segment: 'b2b',
        quote_number: 'QT-100',
      })
    );

    // Regression — pre-existing RFQ events still fire from the same point.
    const legacyCall = trackEvent.mock.calls.find((c) => c[0] === 'quote_request_submitted');
    expect(legacyCall).toBeTruthy();
    expect(legacyCall[1]).toEqual(
      expect.objectContaining({ quote_number: 'QT-100', source: 'quote_request_form' })
    );
    expect(require('@/services/MetaPixelTracker').default.trackCustomEvent).toHaveBeenCalled();
    expect(require('@/utils/marketingBeacon').trackMarketingEvent).toHaveBeenCalled();
  });
});

