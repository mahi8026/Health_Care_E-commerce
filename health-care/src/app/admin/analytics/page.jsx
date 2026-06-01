import AdminShell from '@/components/admin/AdminShell';
import dynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Analytics & Reports - MedCore BD Admin',
  description: 'View sales analytics, revenue reports, and business insights',
};

// Dynamically import AnalyticsReports to avoid build-time recharts issues
const AnalyticsReports = dynamic(
  () => import('@/components/admin/AnalyticsReports').catch(() => {
    // Fallback if recharts fails to load
    return {
      default: () => (
        <div className="p-8 text-center">
          <p className="text-[14px] text-[var(--color-text-secondary)] mb-4">
            Analytics charts are temporarily unavailable.
          </p>
          <p className="text-[12px] text-[var(--color-text-tertiary)]">
            Please check back later or contact support.
          </p>
        </div>
      ),
    };
  }),
  {
    loading: () => (
      <div className="p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0E8A6E] border-r-transparent"></div>
        <p className="mt-4 text-[12px] text-[var(--color-text-secondary)]">Loading analytics...</p>
      </div>
    ),
    ssr: false,
  }
);

export default function AnalyticsPage() {
  return (
    <AdminShell title="Analytics & Reports" action="Export report">
      <div className="p-5 px-6">
        <AnalyticsReports />
      </div>
    </AdminShell>
  );
}
