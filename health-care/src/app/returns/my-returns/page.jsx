import { SITE_CONFIG } from '@/config/seo';
import MyReturnsClient from './MyReturnsClient';

export const metadata = {
  title: 'My Return Requests | MedCore BD',
  description: 'Track and manage your product return requests on MedCore BD.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_CONFIG.url}/returns/my-returns` },
};

export default function MyReturnsPage() {
  return <MyReturnsClient />;
}
