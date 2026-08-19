import { Suspense } from 'react';
import QuoteRequestPage from '@/views/account/QuoteRequestPage';

export const metadata = {
  title: 'Request a Quotation',
  description: 'Request a customized quotation for bulk medical equipment orders',
  robots: { index: false, follow: true },
};

export default function RequestQuotePage() {
  return (
    <Suspense>
      <QuoteRequestPage />
    </Suspense>
  );
}