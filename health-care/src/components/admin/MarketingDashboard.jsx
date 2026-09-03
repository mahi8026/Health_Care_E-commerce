// health-care/src/components/admin/MarketingDashboard.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { API } from '@/constants/api';

/**
 * MarketingDashboard — channel KPIs for MediportBD admin.
 *
 * Pulls /api/marketing/overview (first-party beacons + newsletter + orders)
 * and /api/coupons/active-promo for the currently live promo. Shows what the
 * marketing channels (WhatsApp, exit popup, email, coupons, flash deals) are
 * actually doing over the last 30 days — without depending on GA4 dashboards.
 */

const getToken = () => {
  try { return localStorage.getItem('Mediport_token') || ''; } catch { return ''; }
};

const formatBdt = (n) => `৳${Number(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;

function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--color-border-tertiary)] shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">{label}</span>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${accent || 'bg-[var(--color-background-secondary)]'}`}>{icon}</span>
      </div>
      <div className="text-2xl font-semibold text-[var(--color-text-primary)] leading-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-[var(--color-text-secondary)]">{sub}</div>}
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--color-border-tertiary)] shadow-sm p-5">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-[var(--color-text-secondary)] mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

const SOURCE_LABELS = {
  footer: 'Footer',
  exit_popup: 'Exit Popup',
  popup: 'Popup',
  checkout: 'Checkout',
  manual: 'Manual',
  b2b: 'B2B',
};

export default function MarketingDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [promo, setPromo] = useState(null);

  const load = useCallback(async () => {
    try {
      const [overviewRes, promoRes] = await Promise.all([
        fetch(`${API}/marketing/overview`, {
          headers: { Authorization: `Bearer ${getToken()}` },
          cache: 'no-store',
        }),
        fetch(`${API}/coupons/active-promo`, { cache: 'no-store' }),
      ]);
      const ov = await overviewRes.json();
      if (ov.success) setData(ov.data);
      else setError(ov.message || 'Failed to load marketing overview');

      const pr = await promoRes.json();
      if (pr.success) setPromo(pr.data?.coupon || null);
    } catch {
      setError('Failed to load marketing data. The API may be unavailable.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Defer to a macrotask so setState in load() never runs synchronously
    // inside the effect (react-hooks/set-state-in-effect).
    const timer = setTimeout(() => {
      load().finally(() => { if (!cancelled) setLoading(false); });
    }, 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [load]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    load().finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-[var(--color-border-tertiary)] shadow-sm p-10 text-center">
        <div className="text-3xl mb-3">📭</div>
        <p className="text-sm font-medium text-[var(--color-text-primary)] mb-3">{error}</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-brand-navy text-white text-xs font-semibold rounded-lg hover:bg-[var(--color-brand-navy-hover)] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const w = data?.whatsapp || {};
  const p = data?.popup || {};
  const n = data?.newsletter || {};
  const s = data?.sales30d || {};

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Orders (30d)" value={s.orders ?? 0} sub={`${formatBdt(s.revenue)} revenue`} icon="🛒" accent="bg-brand-teal-tint" />
        <StatCard label="WhatsApp Order Clicks" value={w.orderClicks30d ?? 0} sub={w.orderClicks30d ? `${formatBdt(w.orderClickValue30d)} in-cart value` : 'New — clicks will appear here'} icon="💬" accent="bg-[var(--color-status-success-tint)]" />
        <StatCard label="Popup Leads" value={p.leads30d ?? 0} sub={p.impressions30d ? `${Math.round(((p.leads30d || 0) / p.impressions30d) * 100)}% of ${p.impressions30d} impressions` : 'New — capture is live'} icon="🎁" accent="bg-amber-50" />
        <StatCard label="Newsletter (active)" value={n.active ?? 0} sub={`${n.newLast30d ?? 0} new in 30d`} icon="📧" accent="bg-blue-50" />
      </div>

      {/* Sales + WhatsApp 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-[var(--color-border-tertiary)] shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">💸 Revenue & Orders (last 30 days)</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">All non-cancelled orders</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[var(--color-background-secondary)] p-4">
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">Total orders</div>
              <div className="text-2xl font-semibold text-[var(--color-text-primary)]">{s.orders ?? 0}</div>
            </div>
            <div className="rounded-lg bg-[var(--color-background-secondary)] p-4">
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">Total revenue</div>
              <div className="text-2xl font-semibold text-[var(--color-text-primary)]">{formatBdt(s.revenue)}</div>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-[var(--color-status-success-tint)]/50 p-4 text-xs text-[var(--color-text-secondary)]">
            💡 <strong className="text-[var(--color-text-primary)]">Tip:</strong> If WhatsApp clicks are high but orders are low, buyers
            message you but don&apos;t finish checkout — reply fast and offer a direct invoice. That&apos;s your quickest revenue win.
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-border-tertiary)] shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">💬 WhatsApp Channel</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">Orders started via WhatsApp buttons (last 30 days)</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--color-text-primary)]">Order-by-WhatsApp clicks</span>
            <span className="text-lg font-semibold text-[var(--color-text-primary)]">{w.orderClicks30d ?? 0}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--color-background-secondary)] overflow-hidden mb-4">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-status-success)] to-brand-teal"
              style={{ width: `${Math.min(100, (w.orderClicks30d || 0) * 2)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-secondary)]">In-cart value at click</span>
            <span className="text-lg font-semibold text-[var(--color-text-primary)]">{formatBdt(w.orderClickValue30d)}</span>
          </div>
        </div>
      </div>
{/* Popup + newsletter 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-[var(--color-border-tertiary)] shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">🎁 Exit-Intent Popup</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">First-order discount capture (last 30 days)</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xl font-semibold text-[var(--color-text-primary)]">{p.impressions30d ?? 0}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">Impressions</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-[var(--color-text-primary)]">{p.leads30d ?? 0}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">Leads (emails)</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-[var(--color-text-primary)]">{p.whatsappFallback30d ?? 0}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">WhatsApp fallback</div>
            </div>
          </div>
          {promo && (
            <div className="mt-4 rounded-lg bg-[var(--color-status-warning-tint)] p-3 text-xs">
              <span className="font-semibold text-[var(--color-text-primary)]">Live offer:</span>{' '}
              <span className="text-[var(--color-text-primary)]">{promo.code}</span>
              <span className="text-[var(--color-text-secondary)]"> · {promo.type === 'fixed' ? `৳${promo.value}` : `${promo.value}%`} OFF</span>
              {promo.endDate && (
                <span className="text-[var(--color-text-secondary)]"> · ends {new Date(promo.endDate).toLocaleDateString('en-GB')}</span>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-border-tertiary)] shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">📧 Newsletter Growth</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">Subscriber sources — see where leads come from</p>
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div>
              <div className="text-xl font-semibold text-[var(--color-text-primary)]">{n.total ?? 0}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">Total</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-[var(--color-text-primary)]">{n.active ?? 0}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">Active</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-[var(--color-text-primary)]">{n.newLast30d ?? 0}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">New (30d)</div>
            </div>
          </div>
          {(n.bySource || []).length > 0 ? (
            <div className="space-y-2">
              {(n.bySource || []).slice(0, 5).map((row) => (
                <div key={row.source} className="flex items-center gap-3">
                  <span className="w-28 text-xs text-[var(--color-text-secondary)]">
                    {SOURCE_LABELS[row.source] || row.source}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--color-background-secondary)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-teal"
                      style={{ width: `${Math.min(100, (row.count / Math.max(1, n.total)) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-semibold text-[var(--color-text-primary)]">{row.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-secondary)]">No subscribers yet — the footer form and exit popup will grow this.</p>
          )}
        </div>
      </div>

      {/* Abandoned carts + recovery */}
      <div className="bg-white rounded-xl border border-[var(--color-border-tertiary)] shadow-sm p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">🛒 Abandoned Carts</h3>
        <p className="text-xs text-[var(--color-text-secondary)] mb-4">Potential lost revenue you can still recover</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[var(--color-background-secondary)] p-4">
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">Awaiting recovery email</div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {(data?.abandonedCarts?.awaitingRecovery) ?? 0}
            </div>
          </div>
          <div className="rounded-lg bg-[var(--color-background-secondary)] p-4">
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">Recovery email sent</div>
            <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {(data?.abandonedCarts?.recoveryEmailSent) ?? 0}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
          The backend cron checks for abandoned carts every 2 hours and sends an automated recovery email.
        </p>
      </div>

      {/* Top products */}
      <div className="bg-white rounded-xl border border-[var(--color-border-tertiary)] shadow-sm p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">🏆 Best Sellers</h3>
        <p className="text-xs text-[var(--color-text-secondary)] mb-4">By lifetime units sold — amplify these in ads &amp; the flash sale</p>
        <div className="divide-y divide-[var(--color-border-tertiary)]">
          {(data?.topProducts || []).map((item, i) => (
            <div key={item._id} className="flex items-center gap-3 py-2.5">
              <span className="w-5 text-sm font-bold text-[var(--color-text-secondary)]">{i + 1}</span>
              <div className="w-10 h-10 rounded-lg bg-[var(--color-background-secondary)] overflow-hidden flex-shrink-0">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt="" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">🏥</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={`/admin/products?edit=${item._id}`}
                  className="text-sm font-medium text-[var(--color-text-primary)] hover:text-brand-teal truncate block"
                >
                  {item.name}
                </a>
                <span className="text-xs text-[var(--color-text-secondary)]">{formatBdt(item.price)}</span>
              </div>
              <span className="text-sm font-semibold text-[var(--color-text-primary)] flex-shrink-0">
                {item.soldCount || 0} sold
              </span>
            </div>
          ))}
          {(data?.topProducts || []).length === 0 && (
            <p className="text-xs text-[var(--color-text-secondary)] text-center py-4">
              No sales data yet — top sellers will appear here as orders come in.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
