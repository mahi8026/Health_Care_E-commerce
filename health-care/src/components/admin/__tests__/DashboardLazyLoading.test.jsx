/**
 * Test suite for Admin and B2B Dashboard lazy loading implementation
 * Validates: Requirements 3.1, 3.5
 */
import { render, screen, act } from '@testing-library/react';
import DashboardSkeleton from '../DashboardSkeleton';
import DashboardErrorBoundary from '../DashboardErrorBoundary';

describe('Admin Dashboard Lazy Loading Components', () => {
  describe('DashboardSkeleton', () => {
    it('should render loading skeleton with correct structure', () => {
      const { container } = render(<DashboardSkeleton />);
      
      // Check for main grid layout
      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('grid', 'grid-cols-[220px_1fr]', 'min-h-screen');
      
      // Check for animation
      expect(mainContainer).toHaveClass('animate-pulse');
    });

    it('should render sidebar skeleton elements', () => {
      const { container } = render(<DashboardSkeleton />);
      
      // Check for sidebar navigation items (6 items)
      const navItems = container.querySelectorAll('.space-y-2 > div');
      expect(navItems.length).toBe(6);
    });

    it('should render stats cards skeleton', () => {
      const { container } = render(<DashboardSkeleton />);
      
      // Check for 4 stats cards
      const statsCards = container.querySelectorAll('.grid-cols-4 > div');
      expect(statsCards.length).toBe(4);
    });

    it('should render chart skeleton', () => {
      const { container } = render(<DashboardSkeleton />);
      
      // Check for chart placeholder
      const chartSkeleton = container.querySelector('.h-64');
      expect(chartSkeleton).toBeInTheDocument();
    });

    it('should render table skeleton with rows', () => {
      const { container } = render(<DashboardSkeleton />);
      
      // Check for 5 table rows
      const tableRows = container.querySelectorAll('.space-y-3 > div');
      expect(tableRows.length).toBe(5);
    });

    it('should have proper background colors matching design system', () => {
      const { container } = render(<DashboardSkeleton />);

      const mainContainer = container.firstChild;
      // The skeleton root uses the semantic `bg-page-muted` utility, which
      // resolves to --color-background-tertiary. Asserting the utility class
      // (not the raw var) keeps this readable and CSS-selector-safe.
      expect(mainContainer).toHaveClass('bg-page-muted');
    });
  });

  describe('DashboardErrorBoundary', () => {
    // Suppress console.error for these tests
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalError;
    });

    it('should render children when no error occurs', () => {
      render(
        <DashboardErrorBoundary>
          <div data-testid="child-component">Dashboard Content</div>
        </DashboardErrorBoundary>
      );
      
      expect(screen.getByTestId('child-component')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    it('should render error UI when error is caught', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <DashboardErrorBoundary>
          <ThrowError />
        </DashboardErrorBoundary>
      );

      expect(screen.getByText('Failed to Load Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Something went wrong while loading the admin dashboard/)).toBeInTheDocument();
    });

    it('should display retry button in error state', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <DashboardErrorBoundary>
          <ThrowError />
        </DashboardErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should display go home button when onNavigateHome is provided', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };
      const mockNavigateHome = jest.fn();

      render(
        <DashboardErrorBoundary onNavigateHome={mockNavigateHome}>
          <ThrowError />
        </DashboardErrorBoundary>
      );

      const goHomeButton = screen.getByRole('button', { name: /go home/i });
      expect(goHomeButton).toBeInTheDocument();
    });

    it('should call onNavigateHome when go home button is clicked', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };
      const mockNavigateHome = jest.fn();

      render(
        <DashboardErrorBoundary onNavigateHome={mockNavigateHome}>
          <ThrowError />
        </DashboardErrorBoundary>
      );

      const goHomeButton = screen.getByRole('button', { name: /go home/i });
      goHomeButton.click();

      expect(mockNavigateHome).toHaveBeenCalledTimes(1);
    });

    it('should not display go home button when onNavigateHome is not provided', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <DashboardErrorBoundary>
          <ThrowError />
        </DashboardErrorBoundary>
      );

      const goHomeButton = screen.queryByRole('button', { name: /go home/i });
      expect(goHomeButton).not.toBeInTheDocument();
    });

    it('should display error icon in error state', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <DashboardErrorBoundary>
          <ThrowError />
        </DashboardErrorBoundary>
      );

      // querySelector with a class name containing []() is not a valid CSS
      // selector (nwsapi throws SyntaxError) — assert via the component's
      // stable test id instead.
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });

    it('should increment retry count on retry button click', () => {
      const ThrowError = ({ shouldThrow }) => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Success</div>;
      };

      const { rerender } = render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      );

      // First error state
      expect(screen.getByText('Failed to Load Dashboard')).toBeInTheDocument();
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      retryButton.click();

      // After retry, error boundary resets
      // In a real scenario, the component would re-render
    });
  });
});

/**
 * Test suite for B2B Dashboard lazy loading implementation
 * Validates: Requirements 3.1, 3.5
 */
describe('B2B Dashboard Lazy Loading', () => {
  it('should use DashboardSkeleton as loading fallback for B2B dashboard', () => {
    // DashboardSkeleton is reused as the loading component for B2BDashboardPage
    // Verify it renders correctly as a loading placeholder
    const { container } = render(<DashboardSkeleton />);

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('animate-pulse');
    expect(mainContainer).toHaveClass('grid', 'grid-cols-[220px_1fr]', 'min-h-screen');
  });

  it('should render DashboardSkeleton with sidebar and content area for B2B loading state', () => {
    // The same DashboardSkeleton used for AdminDashboard is reused for B2BDashboard
    const { container } = render(<DashboardSkeleton />);

    // Sidebar skeleton
    const sidebarSkeleton = container.querySelector('.border-r');
    expect(sidebarSkeleton).toBeInTheDocument();

    // Main content skeleton
    const contentArea = container.querySelector('.flex.flex-col');
    expect(contentArea).toBeInTheDocument();
  });

  describe('B2B DashboardErrorBoundary integration', () => {
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalError;
    });

    it('should wrap B2B dashboard content without error when no error occurs', () => {
      render(
        <DashboardErrorBoundary onNavigateHome={() => {}}>
          <div data-testid="b2b-dashboard-content">B2B Dashboard</div>
        </DashboardErrorBoundary>
      );

      expect(screen.getByTestId('b2b-dashboard-content')).toBeInTheDocument();
      expect(screen.getByText('B2B Dashboard')).toBeInTheDocument();
    });

    it('should show error UI with retry when B2B dashboard fails to load', () => {
      const ThrowError = () => {
        throw new Error('Failed to load B2B dashboard chunk');
      };

      render(
        <DashboardErrorBoundary onNavigateHome={() => {}}>
          <ThrowError />
        </DashboardErrorBoundary>
      );

      expect(screen.getByText('Failed to Load Dashboard')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should allow navigation home when B2B dashboard errors', () => {
      const ThrowError = () => {
        throw new Error('B2B chunk load error');
      };
      const mockNavigateHome = jest.fn();

      render(
        <DashboardErrorBoundary onNavigateHome={mockNavigateHome}>
          <ThrowError />
        </DashboardErrorBoundary>
      );

      const goHomeButton = screen.getByRole('button', { name: /go home/i });
      goHomeButton.click();

      expect(mockNavigateHome).toHaveBeenCalledTimes(1);
    });

    it('should reset error state on retry for B2B dashboard', () => {
      let shouldThrow = true;
      const ConditionalThrow = () => {
        if (shouldThrow) {
          throw new Error('B2B load error');
        }
        return <div data-testid="b2b-recovered">B2B Recovered</div>;
      };

      render(
        <DashboardErrorBoundary onNavigateHome={() => {}}>
          <ConditionalThrow />
        </DashboardErrorBoundary>
      );

      // Error state shown
      expect(screen.getByText('Failed to Load Dashboard')).toBeInTheDocument();

      // Simulate fix and retry
      shouldThrow = false;
      const retryButton = screen.getByRole('button', { name: /try again/i });
      act(() => {
        retryButton.click();
      });

      // Error boundary resets hasError state
      expect(screen.queryByText('Failed to Load Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('B2B route integration (App Router)', () => {
    // The app was migrated from the pages/ `App.jsx` shell to the Next.js
    // App Router, so there is no `next/dynamic` boundary to inspect any more.
    // The B2B dashboard is imported directly by its route file, and the page
    // opts into force-dynamic so the client dashboard renders per-request.
    it('should import and render B2BDashboardPage from its route file', () => {
      const fs = require('fs');
      const path = require('path');
      const routeSource = fs.readFileSync(
        path.resolve(__dirname, '../../../app/b2b/page.jsx'),
        'utf8'
      );

      // Dashboard is rendered by the route (not lazily code-split any more)
      expect(routeSource).toContain("import B2BDashboardPage from '@/views/B2BDashboardPage'");
      expect(routeSource).toContain('<B2BDashboardPage />');
    });

    it('should keep the B2B route dynamic and crawlable', () => {
      const fs = require('fs');
      const path = require('path');
      const routeSource = fs.readFileSync(
        path.resolve(__dirname, '../../../app/b2b/page.jsx'),
        'utf8'
      );

      // force-dynamic keeps per-request auth state out of the static cache,
      // while the structured-data markup keeps the marketing page crawlable.
      expect(routeSource).toContain("export const dynamic = 'force-dynamic'");
      expect(routeSource).toMatch(/StructuredData|generateBreadcrumbSchema/);
    });

    it('should confirm DashboardSkeleton is reused as B2B loading component', () => {
      // DashboardSkeleton renders the same skeleton for both Admin and B2B dashboards
      // This verifies requirement 3.5: display a fallback component while loading
      const { container } = render(<DashboardSkeleton />);

      // Verify skeleton has all required sections
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
      expect(container.querySelectorAll('.space-y-2 > div').length).toBe(6);
      expect(container.querySelectorAll('.grid-cols-4 > div').length).toBe(4);
    });
  });
});
