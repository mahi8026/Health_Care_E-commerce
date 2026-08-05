/**
 * TrustBand — server-rendered E-E-A-T quality band shown on product pages.
 *
 * Renders DGDA / quality / B2B / delivery signals above the product view.
 * Registration numbers come from env vars only — never fabricated.
 */

const DGDA_REGISTRATION = process.env.NEXT_PUBLIC_DGDA_REGISTRATION_NUMBER;
const TRADE_LICENSE = process.env.NEXT_PUBLIC_TRADE_LICENSE;

export default function TrustBand() {
  const items = [
    {
      label: 'DGDA Registered',
      value: DGDA_REGISTRATION ? `Reg. ${DGDA_REGISTRATION}` : 'Authorized medical supplier',
    },
    { label: 'B2B Pricing', value: '8–30% bulk discounts for institutions' },
    { label: 'Delivery', value: 'Same-day in Dhaka · Nationwide 2–4 days' },
  ];

  return (
    <section
      aria-label="Trust and quality information"
      className="border-b border-[var(--color-border-primary)] bg-[var(--color-background-secondary)]"
    >
      <div className="container mx-auto max-w-[1400px] px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-full bg-[var(--color-status-success-tint)] text-[var(--color-brand-teal)] flex items-center justify-center font-bold text-xs flex-shrink-0"
                aria-hidden="true"
              >
                ✓
              </span>
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-primary)] leading-tight">
                  {item.label}
                </p>
                <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] leading-tight">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
          {TRADE_LICENSE && (
            <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)]">
              Trade License {TRADE_LICENSE}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
