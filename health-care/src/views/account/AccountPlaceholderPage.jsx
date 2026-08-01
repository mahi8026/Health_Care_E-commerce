'use client';

import Link from 'next/link';
import AccountPageShell from '@/components/account/AccountPageShell';

const COPY = {
  'payment-methods': {
    title: 'Payment Methods',
    description: 'Saved cards and payment preferences.',
    body: 'Online card vault and saved bKash numbers are coming soon. You can still pay at checkout using bKash, bank transfer, or B2B credit terms.',
    cta: { label: 'Go to checkout help', href: '/help' },
  },
  notifications: {
    title: 'Notifications',
    description: 'Email and SMS preferences.',
    body: 'Notification preferences will be available in a future update. Order and delivery updates are currently sent to your registered email and phone.',
    cta: { label: 'View order history', href: '/orders' },
  },
};

export default function AccountPlaceholderPage({ slug }) {
  const content = COPY[slug];
  if (!content) return null;

  return (
    <AccountPageShell title={content.title} description={content.description}>
      <div className="bg-white rounded-lg border border-[var(--color-border-tertiary)] p-6 sm:p-8 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">🔜</div>
        <h2 className="text-base font-semibold text-brand-navy mb-2">Coming soon</h2>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
          {content.body}
        </p>
        {content.cta && (
          <Link
            href={content.cta.href}
            className="inline-block mt-6 px-5 py-2.5 bg-brand-navy hover:bg-[var(--color-brand-navy-hover)] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {content.cta.label}
          </Link>
        )}
      </div>
    </AccountPageShell>
  );
}
