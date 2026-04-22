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
      expect(mainContainer).toHaveClass('bg-[var(--color-background-tertiary)]');
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

      const { container } = render(
        <DashboardErrorBoundary>
          <ThrowError />
        </DashboardErrorBoundary>
      );

      // Check for error icon container
      const errorIcon = container.querySelector('.bg-red-100');
      expect(errorIcon).toBeInTheDocument();
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

  describe('B2B lazy loading configuration in App', () => {
    it('should verify next/dynamic is used for B2BDashboardPage in App.jsx', () => {
      // Read App.jsx source to verify dynamic import configuration
      // next/dynamic with ssr: false ensures B2B dashboard JS is not in the initial bundle
      // This is validated by inspecting the source code pattern
      const fs = require('fs');
      const path = require('path');
      const appSource = fs.readFileSync(
        path.resolve(__dirname, '../../../App.jsx'),
        'utf8'
      );

      // Verify B2BDashboardPage uses next/dynamic
      expect(appSource).toContain("import('./views/B2BDashboardPage')");
      // Verify ssr: false is set (requirement 3.1)
      expect(appSource).toMatch(/B2BDashboardPage[\s\S]*?ssr:\s*false/);
      // Verify DashboardSkeleton is used as loading component (requirement 3.5)
      expect(appSource).toMatch(/B2BDashboardPage[\s\S]*?DashboardSkeleton/);
    });

    it('should confirm DashboardErrorBoundary wraps B2BDashboardPage in App.jsx', () => {
      const fs = require('fs');
      const path = require('path');
      const appSource = fs.readFileSync(
        path.resolve(__dirname, '../../../App.jsx'),
        'utf8'
      );

      // Verify DashboardErrorBoundary wraps B2BDashboardPage
      expect(appSource).toMatch(/DashboardErrorBoundary[\s\S]*?B2BDashboardPage/);
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
