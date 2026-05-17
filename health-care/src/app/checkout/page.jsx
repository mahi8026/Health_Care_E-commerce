import { generatePageMetadata } from '@/utils/metadata';
import { pageMetadata } from '@/config/seo';
import CheckoutPage from '@/views/CheckoutPage';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export const metadata = generatePageMetadata(pageMetadata.checkout);

export default function Checkout() {
  return (
    <ErrorBoundary
      title="Checkout Error"
      message="We encountered an issue processing your checkout. Please refresh the page or contact support."
      onReset={() => window.location.reload()}
    >
      <CheckoutPage />
    </ErrorBoundary>
  );
}
