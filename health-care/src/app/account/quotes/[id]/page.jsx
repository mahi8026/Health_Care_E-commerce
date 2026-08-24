import QuoteDetailPage from '@/views/account/QuoteDetailPage';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Quotation ${id}`,
    description: 'View quotation details',
    robots: { index: false, follow: false },
  };
}

export default async function AccountQuoteDetailPage({ params }) {
  const { id } = await params;
  return <QuoteDetailPage quoteId={id} />;
}