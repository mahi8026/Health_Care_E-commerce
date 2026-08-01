'use client';

import { useState } from 'react';
import { FaUsers, FaPercentage, FaChartLine } from 'react-icons/fa';
import B2BUsersList from './B2BUsersList';
import CategoryDiscounts from './CategoryDiscounts';
import B2BStatistics from './B2BStatistics';

export default function B2BManagement() {
  const [activeTab, setActiveTab] = useState('users'); // users, discounts, stats

  const tabs = [
    { id: 'users', label: 'B2B Users', icon: FaUsers },
    { id: 'discounts', label: 'Category Discounts', icon: FaPercentage },
    { id: 'stats', label: 'Statistics', icon: FaChartLine }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">B2B Management</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Manage B2B users, approvals, and category discounts</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--color-border-primary)]">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-brand-teal text-brand-teal'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-primary)]'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'users' && <B2BUsersList />}
        {activeTab === 'discounts' && <CategoryDiscounts />}
        {activeTab === 'stats' && <B2BStatistics />}
      </div>
    </div>
  );
}
