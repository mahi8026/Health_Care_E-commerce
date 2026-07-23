import { SITE_CONFIG } from '@/config/seo';
import WishlistClient from './WishlistClient';

export const metadata = {
  title: 'My Wishlist | MediportBD',
  description: 'Your saved medical equipment and supplies on MediportBD.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_CONFIG.url}/wishlist` },
};

export default function WishlistPage() {
  return <WishlistClient />;
}
