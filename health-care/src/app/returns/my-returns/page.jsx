import { SITE_CONFIG } from '@/config/seo';
import MyReturnsClient from './MyReturnsClient';

export const metadata = {
  title: 'My Return Requests',
  description: 'Track and manage your product return requests on MediportBD.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_CONFIG.url}/returns/my-returns` },
};

export default function MyReturnsPage() {
  return <MyReturnsClient />;
}
