/**
 * DashboardSkeleton - Loading placeholder for Admin Dashboard
 * Provides visual feedback while the admin dashboard components are being loaded
 */
export default function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-[220px_1fr] min-h-screen bg-page-muted animate-pulse">
      {/* Sidebar Skeleton */}
      <div className="bg-[var(--color-background-primary)] border-r border-[var(--color-border-tertiary)] p-4">
        {/* User Profile Skeleton */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--color-border-tertiary)]">
          <div className="w-10 h-10 rounded-full bg-[var(--color-background-muted)]"></div>
          <div className="flex-1">
            <div className="h-4 bg-[var(--color-background-muted)] rounded w-24 mb-2"></div>
            <div className="h-3 bg-[var(--color-background-muted)] rounded w-32"></div>
          </div>
        </div>

        {/* Navigation Items Skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-10 bg-[var(--color-background-muted)] rounded"></div>
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex flex-col overflow-hidden">
        {/* Top Bar Skeleton */}
        <div className="bg-[var(--color-background-primary)] border-b border-[var(--color-border-tertiary)] p-4 flex items-center justify-between">
          <div className="h-6 bg-[var(--color-background-muted)] rounded w-48"></div>
          <div className="h-9 bg-[var(--color-background-muted)] rounded w-32"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="bg-[var(--color-background-primary)] border-b border-[var(--color-border-tertiary)] px-6 flex gap-6">
          {[1, 2, 3, 4, 5, 6].map((tab) => (
            <div key={tab} className="h-12 w-24 bg-[var(--color-background-muted)] rounded-t"></div>
          ))}
        </div>

        {/* Content Area Skeleton */}
        <div className="p-5 px-6 overflow-y-auto">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((card) => (
              <div key={card} className="bg-[var(--color-background-primary)] rounded-lg p-4 border border-[var(--color-border-tertiary)]">
                <div className="h-4 bg-[var(--color-background-muted)] rounded w-20 mb-3"></div>
                <div className="h-8 bg-[var(--color-background-muted)] rounded w-24 mb-2"></div>
                <div className="h-3 bg-[var(--color-background-muted)] rounded w-16"></div>
              </div>
            ))}
          </div>

          {/* Chart Skeleton */}
          <div className="bg-[var(--color-background-primary)] rounded-lg p-6 border border-[var(--color-border-tertiary)] mb-6">
            <div className="h-5 bg-[var(--color-background-muted)] rounded w-32 mb-4"></div>
            <div className="h-64 bg-[var(--color-background-muted)] rounded"></div>
          </div>

          {/* Table Skeleton */}
          <div className="bg-[var(--color-background-primary)] rounded-lg border border-[var(--color-border-tertiary)]">
            <div className="p-4 border-b border-[var(--color-border-tertiary)]">
              <div className="h-5 bg-[var(--color-background-muted)] rounded w-40"></div>
            </div>
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="flex gap-4">
                  <div className="h-4 bg-[var(--color-background-muted)] rounded flex-1"></div>
                  <div className="h-4 bg-[var(--color-background-muted)] rounded flex-1"></div>
                  <div className="h-4 bg-[var(--color-background-muted)] rounded flex-1"></div>
                  <div className="h-4 bg-[var(--color-background-muted)] rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
