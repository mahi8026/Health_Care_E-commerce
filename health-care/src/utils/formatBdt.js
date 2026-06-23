/**
 * Format amounts in Bangladeshi Taka (BDT) — ৳
 *
 * Rules:
 *  - Always show ৳ symbol
 *  - Use proper BDT comma grouping  (1,00,000 South Asian style)
 *  - For KPI/dashboard large numbers abbreviate:
 *      ≥ 1 Cr  (10,000,000) → ৳X.XCr
 *      ≥ 1 Lac (100,000)    → ৳X.XL
 *      ≥ 1,000              → ৳X,XXX (full — no K suffix for normal use)
 *  - For inline prices always show full number
 */

/**
 * Full price display — always shows the complete number.
 * Use this for product prices, order totals, cart items.
 * e.g.  3250  →  ৳3,250
 *       125000 →  ৳1,25,000
 */
export function formatPrice(amount) {
  const n = Number(amount) || 0;
  if (n === 0) return '৳0';
  // Use en-IN locale for South Asian grouping (1,00,000)
  return '৳' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

/**
 * Compact KPI display — abbreviated for dashboards where space is limited.
 * e.g.  38,500,000  →  ৳3.85Cr
 *       500,000     →  ৳5.0L
 *       13,000      →  ৳13,000   (under 1L shows full)
 *       350         →  ৳350
 */
export function formatBdt(amount) {
  const n = Number(amount) || 0;
  if (n === 0) return '৳0';

  // Crore: 1 Cr = 1,00,00,000 (10 million)
  if (n >= 10_000_000) {
    const cr = n / 10_000_000;
    return `৳${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2).replace(/\.?0+$/, '')}Cr`;
  }

  // Lac: 1 L = 1,00,000 (100,000)
  if (n >= 100_000) {
    const lac = n / 100_000;
    return `৳${lac % 1 === 0 ? lac.toFixed(0) : lac.toFixed(2).replace(/\.?0+$/, '')}L`;
  }

  // Under 1 Lac — show full with proper grouping
  return '৳' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

/**
 * Format a BDT range e.g. ৳5,000 – ৳20,000
 */
export function formatBdtRange(min, max) {
  if (!max) return `${formatPrice(min)}+`;
  return `${formatPrice(min)} – ${formatPrice(max)}`;
}

/**
 * Growth badge for KPI cards.
 */
export function formatGrowthBadge(pct, trend) {
  if (pct === null || pct === undefined) {
    return { text: 'New this month', variant: 'neutral' };
  }
  const sign = pct > 0 ? '+' : '';
  return {
    text: `${sign}${Number(pct).toFixed(1)}% vs last month`,
    variant: trend === 'down' || pct < 0 ? 'down' : pct === 0 ? 'neutral' : 'up',
  };
}
