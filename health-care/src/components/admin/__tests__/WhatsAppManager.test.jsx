/**
 * Regression tests for the admin WhatsApp conversation list.
 *
 * `@/utils/api` resolves to the parsed JSON *body* (see `handleResponse` in
 * `src/utils/api.js`), so the payload envelope is `{ success, data, pagination }`
 * as produced by the backend's `responseHelper.js`. The component used to read
 * it axios-style (`response.data.success` / `response.data.conversations`),
 * which made the guard permanently falsy: every admin saw
 * "Error loading conversations" / "Failed to load conversations" regardless of
 * the data, the auth token or the API's health.
 *
 * These tests pin the component to the real envelope so the bug cannot return.
 */
import { render, screen } from '@testing-library/react';
import WhatsAppManager from '../WhatsAppManager';
import api from '@/utils/api';

jest.mock('@/utils/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
}));

const conversation = {
  _id: 'conv-1',
  customerName: 'Rahim Uddin',
  phoneNumber: '+8801700000001',
  status: 'escalated',
  category: 'support',
  messageCount: 3,
  lastMessageAt: new Date().toISOString(),
};

describe('WhatsAppManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders conversations from the real { success, data, pagination } envelope', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: [conversation],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    });

    render(<WhatsAppManager />);

    // The customer name/phone/status can legitimately appear more than once
    // (list row plus summary/mobile markup), so query non-strictly.
    expect((await screen.findAllByText('Rahim Uddin')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('+8801700000001').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/escalated/i).length).toBeGreaterThan(0);

    // The old axios-style guard left the page stuck on the error state.
    expect(screen.queryByText('Error loading conversations')).not.toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/whatsapp/conversations?'));
  });

  it('shows the error state with the API message when the request fails', async () => {
    api.get.mockRejectedValue(new Error('Invalid or expired token'));

    render(<WhatsAppManager />);

    expect(await screen.findByText('Error loading conversations')).toBeInTheDocument();
    expect(screen.getByText('Invalid or expired token')).toBeInTheDocument();
  });
});
