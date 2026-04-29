import AdminShell from '@/components/admin/AdminShell';
import ReviewsManagement from '@/components/admin/ReviewsManagement';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reviews Management - MedCore BD Admin',
  description: 'Moderate and manage customer product reviews',
};

export default function AdminReviewsPage() {
  return (
    <AdminShell title="Reviews Management" action="Export reviews">
      <div className="p-5 px-6">
        <ReviewsManagement />
      </div>
    </AdminShell>
  );
}
