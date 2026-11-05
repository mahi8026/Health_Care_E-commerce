/**
 * Regression tests for admin data mapping (Analytics / Reviews / Loyalty).
 *
 * The backend responds with a standard envelope `{ success, data, pagination }`
 * (see `backend/src/utils/responseHelper.js`). These components used to read
 * response keys that the API never returns (`sales.data.totalRevenue`,
 * `products.data.topProducts`, top-level `stats`, `/users?role=customer`, ...),
 * so every affected field silently rendered 0 / "No data" while the pages
 * "looked" fine. These tests pin each component to the real response shapes
 * so the mismatches cannot return.
 */
import { render, screen } from '@testing-library/react';
import AnalyticsReports from '../AnalyticsReports';
import AnalyticsCharts from '../AnalyticsCharts';
import ReviewsManagement from '../ReviewsManagement';
import LoyaltyDashboard from '../loyalty/LoyaltyDashboard';
import api from '@/utils/api';

jest.mock('@/utils/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

// next/dynamic with ssr:false returns an async loader; resolve it for tests.
jest.mock('next/dynamic', () => {
  const React = require('react');
  return function dynamicMock(loader) {
    let Loaded = null;
    let pending = null;
    function MockDynamic(props) {
      const [Comp, setComp] = React.useState(() => Loaded);
      React.useEffect(() => {
        if (!pending) {
          pending = loader().then((mod) => {
            Loaded = mod.default || mod;
          });
        }
        pending.then(() => setComp(() => Loaded));
      }, []);
      return Comp ? React.createElement(Comp, props) : null;
    }
    return MockDynamic;
  };
});

jest.mock('@/components/ui/Spinner', () => ({
  __esModule: true,
  default: () => <div>Loading</div>,
}));

jest.mock('@/components/loyalty/LoyaltyBadge', () => ({
  __esModule: true,
  default: ({ tier }) => <span>{tier.label}</span>,
}));

jest.mock('@/components/ui/Toast', () => ({
  showToast: { success: jest.fn(), error: jest.fn() },
}));

// Real backend envelopes (backend/src/controllers/analyticsController.js,
// reviewController.js, loyaltyController.js).
const salesBody = {
  success: true,
  data: {
    total: 950,
    growth: 12.5,
    data: [{ date: '2026-11-01', revenue: 700, orderCount: 25 }],
    metadata: { startDate: '2026-10-05', endDate: '2026-11-05', groupBy: 'day' },
  },
};
const ordersBody = {
  success: true,
  data: {
    totalOrders: 1234,
    avgOrderValue: 190,
    fulfillmentRate: 80,
    statusBreakdown: [],
    paymentMethodBreakdown: [],
  },
};
const customersBody = {
  success: true,
  data: {
    newCustomers: 1,
    returningCustomers: 2,
    retentionRate: 42,
    avgLifetimeValue: 300,
    topCustomers: [{ userId: 'u1', name: 'Rahim Uddin', email: 'rahim@x.com', totalSpent: 500, orderCount: 3 }],
    customerSegmentation: {},
    avgTimeBetweenOrders: 0,
  },
};
const productsBody = {
  success: true,
  data: {
    topSellingProducts: [],
    topRevenueProducts: [{ productId: 'p1', name: 'Glucometer', revenue: 900, quantitySold: 7 }],
  },
};
const paymentsBody = {
  success: true,
  data: {
    methodDistribution: [{ method: 'cod', count: 5, percentage: 100, totalAmount: 950, successRate: 100 }],
    successRate: 100,
  },
};
const reviewsBody = {
  success: true,
  data: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 9,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    stats: { pending: 2, approved: 3, rejected: 4 },
  },
};

const jsonRes = (body) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) });

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.setItem('Mediport_token', 'test-token');
  global.fetch = jest.fn((url) => {
    const u = String(url);
    if (u.includes('/analytics/sales')) return jsonRes(salesBody);
    if (u.includes('/analytics/orders')) return jsonRes(ordersBody);
    if (u.includes('/analytics/customers')) return jsonRes(customersBody);
    if (u.includes('/analytics/products')) return jsonRes(productsBody);
    if (u.includes('/analytics/payments')) return jsonRes(paymentsBody);
    if (u.includes('/reviews/admin/all')) return jsonRes(reviewsBody);
    return jsonRes({ success: false, message: `unexpected URL: ${u}` });
  });
});

describe('AnalyticsReports — reads the real analytics envelope', () => {
  it('maps revenue/AOV/growth from the keys the API actually returns', async () => {
    render(<AnalyticsReports />);

    // sales.data.total (NOT .totalRevenue)
    expect(await screen.findByText('৳950')).toBeInTheDocument();
    // orders.data.avgOrderValue (NOT sales.data.avgOrderValue)
    expect(await screen.findByText('৳190')).toBeInTheDocument();
    // sales.data.growth (NOT .revenueGrowth)
    expect(await screen.findByText('+12.5%')).toBeInTheDocument();
    // customers.data.retentionRate
    expect(await screen.findByText('42%')).toBeInTheDocument();
    // orders.data.totalOrders
    expect(await screen.findByText('1,234')).toBeInTheDocument();
  });

  it('renders top products from topRevenueProducts with quantitySold/revenue', async () => {
    render(<AnalyticsReports />);

    expect(await screen.findByText('Glucometer')).toBeInTheDocument();
    expect(await screen.findByText('7 units sold')).toBeInTheDocument();
    expect(await screen.findByText('৳900')).toBeInTheDocument();
  });

  it('renders top customers from topCustomers with orderCount/totalSpent', async () => {
    render(<AnalyticsReports />);

    expect(await screen.findByText('Rahim Uddin')).toBeInTheDocument();
    expect(await screen.findByText('3 orders')).toBeInTheDocument();
    expect(await screen.findByText('৳500')).toBeInTheDocument();
  });
});

describe('AnalyticsCharts — renders live revenueByPeriod data', () => {
  it('renders daily revenue and order rows from the sales series', () => {
    render(<AnalyticsCharts data={salesBody.data.data} />);

    expect(screen.getByText('Revenue by Day')).toBeInTheDocument();
    expect(screen.getByText('Orders by Day')).toBeInTheDocument();
    expect(screen.getAllByText('2026-11-01')).toHaveLength(2); // one row per table
    expect(screen.getByText('৳700')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    // The old hardcoded monthly sample data must not come back.
    expect(screen.queryByText(/Sample data/)).not.toBeInTheDocument();
  });

  it('shows empty states when there is no data', () => {
    render(<AnalyticsCharts />);
    expect(screen.getAllByText('No data for this period')).toHaveLength(2);
  });
});

describe('ReviewsManagement — reads stats from pagination.stats', () => {
  it('renders pending/approved/rejected/total from the paginated envelope', async () => {
    render(<ReviewsManagement />);

    expect(await screen.findByText('No reviews found')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // pending
    expect(screen.getByText('3')).toBeInTheDocument(); // approved
    expect(screen.getByText('4')).toBeInTheDocument(); // rejected
    expect(screen.getByText('9')).toBeInTheDocument(); // total reviews card (2+3+4)
  });
});

describe('LoyaltyDashboard — uses real loyalty endpoints and the 0.1 redemption rate', () => {
  it('loads members via /loyalty/admin/members and stats via /loyalty/admin/stats', async () => {
    api.get.mockImplementation((endpoint) => {
      if (endpoint.includes('/loyalty/admin/members')) {
        return Promise.resolve({
          success: true,
          data: [{ _id: 'u1', name: 'Rahim Uddin', email: 'rahim@x.com', loyaltyPoints: 1500 }],
          pagination: { page: 1, limit: 100, total: 19, totalPages: 1, hasNext: false, hasPrev: false },
        });
      }
      if (endpoint.includes('/loyalty/admin/stats')) {
        return Promise.resolve({
          success: true,
          data: {
            totalMembers: 1,
            totalPointsIssued: 1700,
            totalPointsRedeemed: 200,
            tierDistribution: { Bronze: 18, Silver: 1, Gold: 0, Platinum: 0 },
            recentTransactions: [],
          },
        });
      }
      return Promise.reject(new Error(`unexpected endpoint: ${endpoint}`));
    });

    render(<LoyaltyDashboard />);

    expect(await screen.findByText('Rahim Uddin')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/loyalty/admin/members?page=1&limit=100');
    expect(api.get).toHaveBeenCalledWith('/loyalty/admin/stats');

    // 1,500 points shown in table + total-points card
    expect((await screen.findAllByText('1,500')).length).toBeGreaterThanOrEqual(2);
    // Redemption value at POINTS_TO_TAKA = 0.1 -> 1,500 pts = ৳150 (not ৳1,500)
    expect(await screen.findByText('৳150')).toBeInTheDocument();
    // Total customers comes from pagination.total
    expect(await screen.findByText('19')).toBeInTheDocument();
    // Tier badge for 1,500 points is Silver
    expect((await screen.findAllByText('Silver')).length).toBeGreaterThan(0);
  });
});


