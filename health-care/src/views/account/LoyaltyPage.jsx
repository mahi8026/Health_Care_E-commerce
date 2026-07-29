'use client';

import { useState, useEffect } from 'react';
import AccountPageShell from '@/components/account/AccountPageShell';
import { useAuth } from '@/context/AuthContext';
import LoyaltyBadge from '@/components/loyalty/LoyaltyBadge';
import { FaStar, FaHistory, FaGift, FaArrowUp, FaArrowDown, FaInfoCircle } from 'react-icons/fa';
import { format } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const TIER_PROGRESS = {
  Bronze:   { next: 'Silver',   needed: 1000,  color: 'bg-amber-500' },
  Silver:   { next: 'Gold',     needed: 5000,  color: 'bg-gray-400' },
  Gold:     { next: 'Platinum', needed: 10000, color: 'bg-yellow-500' },
  Platinum: { next: null,       needed: null,  color: 'bg-purple-500' },
};

function TransactionRow({ tx }) {
  const isEarn = tx.points > 0;
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isEarn ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isEarn
            ? <FaArrowUp className="w-3 h-3 text-green-600" />
            : <FaArrowDown className="w-3 h-3 text-red-500" />
          }
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{tx.description}</p>
          <p className="text-xs text-gray-400">
            {tx.createdAt ? format(new Date(tx.createdAt), 'dd MMM yyyy, HH:mm') : ''}
            {tx.order?.orderNumber && ` · ${tx.order.orderNumber}`}
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`font-bold text-sm ${isEarn ? 'text-green-600' : 'text-red-500'}`}>
          {isEarn ? '+' : ''}{tx.points.toLocaleString()} pts
        </p>
        <p className="text-xs text-gray-400">Balance: {tx.balance.toLocaleString()}</p>
      </div>
    </div>
  );
}

export default function LoyaltyPage() {
  const { user } = useAuth();
  const [summary, setSummary]         = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [txLoading, setTxLoading]     = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('Mediport_token') : null;
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${API_URL}/loyalty/summary`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.data) setSummary(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch(`${API_URL}/loyalty/transactions?limit=20`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.data) setTransactions(data.data); })
      .catch(() => {})
      .finally(() => setTxLoading(false));
  }, []);

  const tier = summary?.tier;
  const tierProgress = tier ? TIER_PROGRESS[tier.label] : null;
  const progressPct = tierProgress?.needed
    ? Math.min(100, Math.round(((summary?.totalEarned || 0) / tierProgress.needed) * 100))
    : 100;

  return (
    <AccountPageShell title="Loyalty Points">
      {loading ? (
        <div className="space-y-6 animate-fade-in">
          {/* Stats card skeleton */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6">
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-blue-400/30 rounded-full w-32" />
              <div className="h-12 bg-blue-400/30 rounded-lg w-40" />
              <div className="h-3 bg-blue-400/30 rounded-full w-48" />
            </div>
          </div>
          
          {/* Grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="h-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer" />
              </div>
            ))}
          </div>
          
          {/* Transactions skeleton */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3">
            <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full w-48 animate-shimmer" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Points Balance Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-blue-200 text-sm font-medium">Available Points</p>
                <p className="text-5xl font-bold mt-1">
                  {(summary?.currentPoints || user?.loyaltyPoints || 0).toLocaleString()}
                </p>
                <p className="text-blue-200 text-sm mt-1">
                  ≈ ৳{((summary?.currentPoints || 0) * 0.10).toFixed(0)} redeemable value
                </p>
              </div>
              <div className="text-right">
                {tier && <LoyaltyBadge tier={tier} size="lg" />}
                <p className="text-blue-200 text-xs mt-2">
                  {(summary?.totalEarned || 0).toLocaleString()} total earned
                </p>
              </div>
            </div>

            {/* Tier progress bar */}
            {tierProgress?.next && (
              <div>
                <div className="flex justify-between text-xs text-blue-200 mb-1">
                  <span>{tier?.label}</span>
                  <span>{tierProgress.next} at {tierProgress.needed.toLocaleString()} pts</span>
                </div>
                <div className="w-full bg-blue-900/50 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-blue-200 mt-1">
                  {(summary?.pointsToNextTier || 0).toLocaleString()} pts to {tierProgress.next}
                </p>
              </div>
            )}
            {!tierProgress?.next && (
              <p className="text-sm text-blue-200 mt-2">🎉 You&apos;ve reached the highest tier!</p>
            )}
          </div>

          {/* How to earn */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaGift className="text-blue-600 w-4 h-4" /> How to Earn Points
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Every ৳100 spent',     pts: '1 pt',   icon: '🛒' },
                { label: 'First order bonus',     pts: '+200 pts', icon: '🎉' },
                { label: 'Leave a product review', pts: '+50 pts', icon: '⭐' },
                { label: 'Refer a friend',         pts: '+500 pts', icon: '👥' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-blue-600 font-semibold">{item.pts}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tier benefits */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaStar className="text-yellow-500 w-4 h-4" /> Tier Benefits
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Bronze',   pts: '0–999',    icon: '🥉', benefit: 'Earn points on every order' },
                { label: 'Silver',   pts: '1K–4.9K',  icon: '🥈', benefit: '5% extra discount' },
                { label: 'Gold',     pts: '5K–9.9K',  icon: '🥇', benefit: '10% extra + free shipping' },
                { label: 'Platinum', pts: '10K+',     icon: '💎', benefit: '15% extra + priority support' },
              ].map(t => (
                <div
                  key={t.label}
                  className={`p-3 rounded-xl border text-center ${
                    tier?.label === t.label
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <p className="text-2xl mb-1">{t.icon}</p>
                  <p className="font-semibold text-sm text-gray-900">{t.label}</p>
                  <p className="text-xs text-gray-500">{t.pts} pts</p>
                  <p className="text-xs text-blue-600 mt-1">{t.benefit}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Redemption info */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <FaInfoCircle className="text-amber-500 w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">How to Redeem</p>
              <p>1000 points = ৳10 discount · Minimum 500 points to redeem · Max 20% of order total · Redeem at checkout</p>
            </div>
          </div>

          {/* Transaction history */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaHistory className="text-gray-500 w-4 h-4" /> Transaction History
            </h3>
            {txLoading ? (
              <div className="space-y-3 py-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FaHistory className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No transactions yet. Place an order to earn points!</p>
              </div>
            ) : (
              <div>
                {transactions.map(tx => (
                  <TransactionRow key={tx._id} tx={tx} />
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </AccountPageShell>
  );
}
