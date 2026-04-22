import { generatePageMetadata } from '@/utils/metadata';
import { pageMetadata } from '@/config/seo';
import AdminDashboardPage from '@/views/AdminDashboardPage';

export const metadata = generatePageMetadata(pageMetadata.admin);

export default function Admin() {
  return <AdminDashboardPage />;
}
