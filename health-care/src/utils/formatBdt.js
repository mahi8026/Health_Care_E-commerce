/**
 * Format amounts in Bangladeshi Taka for dashboards and admin UI.
 */
export function formatBdt(amount) {
  const n = Number(amount) || 0;
  if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `৳${(n / 1_000).toFixed(1)}K`;
  return `৳${n.toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;
}

export function formatGrowthBadge(pct, trend) {
  if (pct === null || pct === undefined) {
    return { text: 'New this month', variant: 'up' };
  }
  const sign = pct > 0 ? '+' : '';
  return {
    text: `${sign}${pct}% vs last month`,
    variant: trend === 'down' ? 'down' : pct === 0 ? 'neutral' : 'up',
  };
}
