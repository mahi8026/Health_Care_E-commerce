import { Suspense } from 'react';
import QuoteRequestPage from '@/views/account/QuoteRequestPage';

export const metadata = {
  title: 'Request a Quotation',
  description: 'Request a customized quotation for bulk medical equipment orders',
};

export default function RequestQuotePage() {
  return (
    <Suspense>
      <QuoteRequestPage />
    </Suspense>
  );
}