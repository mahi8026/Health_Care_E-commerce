import { generatePageMetadata } from '@/utils/metadata';
import { pageMetadata } from '@/config/seo';
import CheckoutPage from '@/views/CheckoutPage';

export const metadata = generatePageMetadata(pageMetadata.checkout);

export default function Checkout() {
  return <CheckoutPage />;
}
