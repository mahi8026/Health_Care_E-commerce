import { generatePageMetadata } from '@/utils/metadata';
import { pageMetadata } from '@/config/seo';
import CartPage from '@/views/CartPage';

export const dynamic = 'force-dynamic';

export const metadata = generatePageMetadata(pageMetadata.cart);

export default function Cart() {
  return <CartPage />;
}
