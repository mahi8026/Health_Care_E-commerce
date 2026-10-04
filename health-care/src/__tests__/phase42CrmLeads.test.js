// health-care/src/__tests__/phase42CrmLeads.test.js
//
// Phase 4.2 — CRM admin lead pipeline (frontend contract).
//
// Covers: lead list + filter query contract, lead detail with attribution,
// status transition PATCH (incl. server-rejected illegal transition),
// RFQ/quote linkage call, and unauthorized (403) handling.
// Synthetic data only — no network, no real customer records.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/admin/leads',
  useSearchParams: () => ({ get: () => null }),
}));

import LeadsManagement from '@/components/admin/LeadsManagement';

const lead = (over = {}) => ({
  _id: 'lead-1',
  lead_id: 'LD-2026-0001',
  organization: 'Sunrise Diagnostic Centre',
  organization_type: 'diagnostic_centre',
  district: 'Dhaka',
  division: 'Dhaka',
  phone: '01712345678',
  email: 'contact@sunrise.example.com',
  source: 'google_ads',
  medium: 'cpc',
  campaign: 'phase42-test',
  landing_page: '/guides/ecg-guide',
  status: 'new',
  lead_quality: 'unrated',
  assigned_to: null,
  notes: [],
  related_quotes: [],
  rfq_status: 'none',
  customer_status: 'prospect',
  created_at: '2026-10-01T10:00:00.000Z',
  updated_at: '2026-10-01T10:00:00.000Z',
  ...over,
});

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

const listResponse = (data = [lead()]) => jsonResponse({
  success: true,
  data,
  pagination: { page: 1, limit: 20, total: data.length, totalPages: 1, hasNext: false, hasPrev: false },
});

let fetchMock;

beforeEach(() => {
  fetchMock = jest.fn();
  global.fetch = fetchMock;
  localStorage.setItem('Mediport_token', 'test-token');
  window.localStorage.clear();
  localStorage.setItem('Mediport_token', 'test-token');
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('LeadsManagement list + filters', () => {
  it('renders leads and the metrics total', async () => {
    fetchMock.mockImplementation((url) => {
      if (String(url).includes('/crm/metrics')) {
        return Promise.resolve(jsonResponse({ success: true, data: { total: 1, by_status: { new: 1 } } }));
      }
      return Promise.resolve(listResponse());
    });

    render(<LeadsManagement />);

    expect(await screen.findByText('Sunrise Diagnostic Centre')).toBeInTheDocument();
    expect(screen.getByText('LD-2026-0001')).toBeInTheDocument();
    expect(await screen.findByText('Total leads')).toBeInTheDocument();
  });

  it('sends the admin Bearer token and the filter query contract', async () => {
    fetchMock.mockImplementation((url) => {
      if (String(url).includes('/crm/metrics')) return Promise.resolve(jsonResponse({ success: true, data: { total: 0 } }));
      return Promise.resolve(listResponse([]));
    });

    render(<LeadsManagement />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const listCall = fetchMock.mock.calls.find(([u]) => String(u).includes('/api/crm?') || /\/crm\?/.test(String(u)));
    expect(listCall).toBeTruthy();
    expect(listCall[0]).toContain('page=1');
    expect(listCall[0]).toContain('limit=20');
    expect(listCall[1].headers.Authorization).toBe('Bearer test-token');

    // status filter
    const select = screen.getAllByRole('combobox')[0];
    fireEvent.change(select, { target: { value: 'rfq' } });
    await waitFor(() => {
      const call = fetchMock.mock.calls.find(([u]) => /\/crm\?.*status=rfq/.test(String(u)));
      expect(call).toBeTruthy();
    });
  });

  it('shows an error and renders no rows when the API rejects access (403)', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ success: false, message: 'Role customer is not authorized' }, 403)));

    render(<LeadsManagement />);

    expect(await screen.findByText(/Failed to load leads/i)).toBeInTheDocument();
    expect(screen.queryByText('LD-2026-0001')).not.toBeInTheDocument();
  });
});

describe('LeadsManagement detail, transitions and RFQ linkage', () => {
  const openDetail = async () => {
    fetchMock.mockImplementation((url, options) => {
      const u = String(url);
      if (u.includes('/crm/metrics')) return Promise.resolve(jsonResponse({ success: true, data: { total: 1 } }));
      if (options && options.method === 'PATCH') return Promise.resolve(jsonResponse({ success: true, data: lead({ status: 'contacted' }) }));
      if (options && options.method === 'POST' && u.includes('/quote')) return Promise.resolve(jsonResponse({ success: true, data: lead({ related_quotes: [{ quote_number: 'QT-2026-0042' }] }) }, 201));
      if (/\/crm\/lead-1$/.test(u)) return Promise.resolve(jsonResponse({ success: true, data: lead() }));
      return Promise.resolve(listResponse());
    });
    render(<LeadsManagement />);
    fireEvent.click(await screen.findByText('Sunrise Diagnostic Centre'));
    await waitFor(() => expect(screen.getByText('Attribution (first touch)')).toBeInTheDocument());
  };

  it('opens a lead detail showing attribution (Phase 4.1 first touch) and quote linkage', async () => {
    await openDetail();
    expect(screen.getAllByText(/google ads/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Landing page: \/guides\/ecg-guide/)).toBeInTheDocument();
    expect(screen.getByText(/No quotation linked yet/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Quote number/i)).toBeInTheDocument();
    expect(screen.getByText(/Attribution \(first touch\)/i)).toBeInTheDocument();
  });

  it('advances the pipeline with a PATCH for a legal transition', async () => {
    await openDetail();
    const patchCalls = () => fetchMock.mock.calls.filter(([, o]) => o && o.method === 'PATCH');
    const advance = await screen.findByRole('button', { name: /→ Contacted/i });
    fireEvent.click(advance);
    await waitFor(() => expect(patchCalls().length).toBeGreaterThan(0));
    expect(patchCalls()[0][0]).toContain('/crm/lead-1');
    expect(patchCalls()[0][1].body).toContain('"status":"contacted"');
  });

  it('surfaces a server-rejected illegal transition instead of applying it', async () => {
    fetchMock.mockImplementation((url, options) => {
      const u = String(url);
      if (u.includes('/crm/metrics')) return Promise.resolve(jsonResponse({ success: true, data: { total: 1 } }));
      if (options && options.method === 'PATCH') {
        return Promise.resolve(jsonResponse({
          success: false,
          message: "Invalid status transition from 'new' to 'won'",
          errors: { allowed: ['verified', 'contacted', 'lost'] },
        }, 400));
      }
      if (/\/crm\/lead-1$/.test(u)) return Promise.resolve(jsonResponse({ success: true, data: lead() }));
      return Promise.resolve(listResponse());
    });
    render(<LeadsManagement />);
    fireEvent.click(await screen.findByText('Sunrise Diagnostic Centre'));
    await waitFor(() => expect(screen.getByText('Attribution (first touch)')).toBeInTheDocument());

    const advance = await screen.findByRole('button', { name: /→ Contacted/i });
    fireEvent.click(advance);

    expect(await screen.findByText(/Invalid status transition/i)).toBeInTheDocument();
    expect(screen.getByText(/Allowed: verified, contacted, lost/i)).toBeInTheDocument();
  });

  it('links a quotation reference without touching the quotation payload', async () => {
    await openDetail();
    const postCalls = () => fetchMock.mock.calls.filter(([, o]) => o && o.method === 'POST' && String(o.headers.Authorization || '').includes('test-token'));

    fireEvent.change(screen.getByPlaceholderText(/Quote number/i), { target: { value: 'QT-2026-0042' } });
    fireEvent.click(screen.getByRole('button', { name: /Link quote/i }));

    await waitFor(() => expect(postCalls().length).toBeGreaterThan(0));
    expect(postCalls()[0][0]).toContain('/crm/lead-1/quote');
    expect(postCalls()[0][1].body).toContain('QT-2026-0042');
  });
});

