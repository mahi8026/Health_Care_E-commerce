'use client';

const TIER_STYLES = {
  Bronze:   { bg: 'bg-[var(--color-status-warning-tint)]',   text: 'text-[var(--color-status-warning)]',   border: 'border-[var(--color-status-warning-tint)]',   icon: '🥉' },
  Silver:   { bg: 'bg-[var(--color-background-secondary)]',    text: 'text-[var(--color-text-secondary)]',    border: 'border-[var(--color-border-primary)]',    icon: '🥈' },
  Gold:     { bg: 'bg-[var(--color-status-warning-tint)]',  text: 'text-[var(--color-status-warning)]',  border: 'border-[var(--color-status-warning-tint)]',  icon: '🥇' },
  Platinum: { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  icon: '💎' },
};

export default function LoyaltyBadge({ tier, size = 'sm' }) {
  if (!tier) return null;
  const style = TIER_STYLES[tier.label] || TIER_STYLES.Bronze;
  const sizeClass = size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-xs px-2 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-semibold ${style.bg} ${style.text} ${style.border} ${sizeClass}`}>
      <span>{style.icon}</span>
      <span>{tier.label}</span>
    </span>
  );
}
