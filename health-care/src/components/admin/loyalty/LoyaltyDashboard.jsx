'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaStar, FaUsers, FaGift, FaTrophy, FaSearch, FaFilter } from 'react-icons/fa';
import api from '@/utils/api';
import Spinner from '@/components/ui/Spinner';
import LoyaltyBadge from '@/components/loyalty/LoyaltyBadge';
import { showToast } from '@/components/ui/Toast';

const TIERS = {
  Bronze:   { min: 0,     max: 999,   label: 'Bronze',   icon: '🥉', color: '#CD7F32' },
  Silver:   { min: 1000,  max: 4999,  label: 'Silver',   icon: '🥈', color: '#C0C0C0' },
  Gold:     { min: 5000,  max: 9999,  label: 'Gold',     icon: '🥇', color: '#FFD700' },
  Platinum: { min: 10000, max: Infinity, label: 'Platinum', icon: '💎', color: '#E5E4E2' },
};

function getTier(points) {
  if (points >= TIERS.Platinum.min) return TIERS.Platinum;
  if (points >= TIERS.Gold.min) return TIERS.Gold;
  if (points >= TIERS.Silver.min) return TIERS.Silver;
  return TIERS.Bronze;
}

export default function LoyaltyDashboard() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalPoints: 0,
    totalCustomers: 0,
    tierDistribution: { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 },
    recentActivity: [],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [sortBy, setSortBy] = useState('points'); // points, name, tier

  const fetchLoyaltyData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/users?role=customer');
      const users = response.data || [];

      // Calculate stats
      const totalPoints = users.reduce((sum, u) => sum + (u.loyaltyPoints || 0), 0);
      const tierDist = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
      
      users.forEach(u => {
        const tier = getTier(u.loyaltyPoints || 0);
        tierDist[tier.label]++;
      });

      setCustomers(users);
      setStats({
        totalPoints,
        totalCustomers: users.length,
        tierDistribution: tierDist,
        recentActivity: [], // Activity log integration planned for v2.0
      });
    } catch (error) {
      console.error('Failed to fetch loyalty data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLoyaltyData();
  }, []); // Only run on mount

  const handleAdjustPoints = async (userId, adjustment, reason) => {
    try {
      await api.post('/loyalty/admin/adjust', {
        userId,
        points: adjustment,
        description: reason,
      });
      fetchLoyaltyData();
    } catch (error) {
      console.error('Failed to adjust points:', error);
      showToast.error('Failed to adjust points');
    }
  };

  // Filter and sort customers
  const filteredCustomers = customers
    .filter(c => {
      const matchesSearch = !searchTerm || 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const tier = getTier(c.loyaltyPoints || 0);
      const matchesTier = filterTier === 'all' || tier.label === filterTier;
      
      return matchesSearch && matchesTier;
    })
    .sort((a, b) => {
      if (sortBy === 'points') return (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'tier') {
        const tierA = getTier(a.loyaltyPoints || 0);
        const tierB = getTier(b.loyaltyPoints || 0);
        return tierB.min - tierA.min;
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-2">Loyalty Program</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">Manage customer loyalty points, tiers, and rewards</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[var(--color-border-primary)] p-5">
          <div className="flex items-center justify-between mb-2">
            <FaStar className="text-warning w-5 h-5" />
            <span className="text-xs text-[var(--color-text-secondary)]">Total Points</span>
          </div>
          <p className="text-2xl font-semibold text-brand-navy">{stats.totalPoints.toLocaleString()}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">≈ ৳{stats.totalPoints.toLocaleString()} value</p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-border-primary)] p-5">
          <div className="flex items-center justify-between mb-2">
            <FaUsers className="text-brand-teal w-5 h-5" />
            <span className="text-xs text-[var(--color-text-secondary)]">Total Customers</span>
          </div>
          <p className="text-2xl font-semibold text-brand-navy">{stats.totalCustomers}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">With loyalty accounts</p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-border-primary)] p-5">
          <div className="flex items-center justify-between mb-2">
            <FaTrophy className="text-[#FFD700] w-5 h-5" />
            <span className="text-xs text-[var(--color-text-secondary)]">Top Tier</span>
          </div>
          <p className="text-2xl font-semibold text-brand-navy">{stats.tierDistribution.Platinum}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Platinum members</p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-border-primary)] p-5">
          <div className="flex items-center justify-between mb-2">
            <FaGift className="text-[#8B5CF6] w-5 h-5" />
            <span className="text-xs text-[var(--color-text-secondary)]">Avg Points</span>
          </div>
          <p className="text-2xl font-semibold text-brand-navy">
            {stats.totalCustomers > 0 ? Math.round(stats.totalPoints / stats.totalCustomers) : 0}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Per customer</p>
        </div>
      </div>

      {/* Tier Distribution */}
      <div className="bg-white rounded-xl border border-[var(--color-border-primary)] p-5">
        <h2 className="text-lg font-semibold text-brand-navy mb-4">Tier Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(TIERS).map(([key, tier]) => (
            <div key={key} className="text-center p-4 rounded-lg bg-[var(--color-background-secondary)] border border-[var(--color-border-primary)]">
              <div className="text-3xl mb-2">{tier.icon}</div>
              <p className="text-sm font-semibold text-brand-navy">{tier.label}</p>
              <p className="text-2xl font-semibold text-brand-navy mt-1">{stats.tierDistribution[tier.label]}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                {tier.min.toLocaleString()}+ pts
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-[var(--color-border-primary)] p-5">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-4 py-2 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15"
            >
              <option value="all">All Tiers</option>
              <option value="Bronze">🥉 Bronze</option>
              <option value="Silver">🥈 Silver</option>
              <option value="Gold">🥇 Gold</option>
              <option value="Platinum">💎 Platinum</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15"
            >
              <option value="points">Sort by Points</option>
              <option value="name">Sort by Name</option>
              <option value="tier">Sort by Tier</option>
            </select>
          </div>
        </div>

        {/* Customer List */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border-primary)]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Customer</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Tier</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Points</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Value</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-[var(--color-text-secondary)]">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const tier = getTier(customer.loyaltyPoints || 0);
                  const points = customer.loyaltyPoints || 0;
                  const value = points;

                  return (
                    <tr key={customer._id} className="border-b border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-secondary)]">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-semibold text-brand-navy">{customer.name}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">{customer.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <LoyaltyBadge tier={tier} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="text-sm font-semibold text-brand-navy">{points.toLocaleString()}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="text-sm text-[var(--color-text-secondary)]">৳{value.toLocaleString()}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            const adjustment = prompt('Enter points adjustment (positive or negative):');
                            if (adjustment) {
                              const reason = prompt('Reason for adjustment:');
                              handleAdjustPoints(customer._id, parseInt(adjustment), reason || 'Manual adjustment');
                            }
                          }}
                          className="text-xs font-semibold text-brand-teal hover:underline"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length > 0 && (
          <div className="mt-4 text-sm text-[var(--color-text-secondary)] text-center">
            Showing {filteredCustomers.length} of {customers.length} customers
          </div>
        )}
      </div>
    </div>
  );
}
