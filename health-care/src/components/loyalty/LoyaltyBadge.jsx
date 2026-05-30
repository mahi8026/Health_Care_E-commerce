'use client';

const TIER_STYLES = {
  Bronze:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   icon: '🥉' },
  Silver:   { bg: 'bg-gray-50',    text: 'text-gray-600',    border: 'border-gray-300',    icon: '🥈' },
  Gold:     { bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-300',  icon: '🥇' },
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
