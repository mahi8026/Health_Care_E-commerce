'use client';

import { ExportService } from '@/utils/exportService';

export default function KPIDetailModal({ kpi, onClose, onNavigate }) {
  const handleExport = () => {
    try {
      const data = {
        metric: kpi.label,
        value: kpi.value,
        change: kpi.change,
        exportDate: new Date().toISOString()
      };
      
      const filename = ExportService.generateFilename(
        kpi.label.toLowerCase().replace(/\s+/g, '-'),
        'json'
      );
      
      ExportService.exportToJSON(data, filename);
      alert('Data exported successfully!');
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  const getDetailContent = () => {
    switch (kpi.label) {
      case 'Total Revenue':
        return {
          title: 'Revenue Analytics',
          icon: '💰',
          stats: [
            { label: 'This Month', value: kpi.value, trend: kpi.change },
            { label: 'Last Month', value: '৳28.5M', trend: '+35%' },
            { label: 'Average Order Value', value: '৳145,000', trend: '+12%' },
            { label: 'B2B Revenue', value: '৳22.1M', trend: '+48%' },
            { label: 'Retail Revenue', value: '৳7.1M', trend: '+32%' },
          ],
          actions: [
            { label: 'View Analytics', action: () => { onClose(); onNavigate('analytics'); } },
            { label: 'Export Report', action: handleExport }
          ]
        };
      
      case 'Total Orders':
        return {
          title: 'Orders Overview',
          icon: '📦',
          stats: [
            { label: 'Total Orders', value: kpi.value, trend: kpi.change },
            { label: 'Pending', value: '3', color: 'text-[#92400E]' },
            { label: 'Processing', value: '5', color: 'text-[#1E40AF]' },
            { label: 'Shipped', value: '8', color: 'text-[#3730A3]' },
            { label: 'Delivered', value: '4', color: 'text-[#065F46]' },
          ],
          actions: [
            { label: 'View All Orders', action: () => { onClose(); onNavigate('orders'); } },
            { label: 'Process Pending', action: () => { onClose(); onNavigate('orders'); } }
          ]
        };
      
      case 'Active B2B Clients':
        return {
          title: 'B2B Clients',
          icon: '👥',
          stats: [
            { label: 'Active Clients', value: kpi.value, trend: '+8 this month' },
            { label: 'Platinum Tier', value: '1', color: 'text-[#3C3489]' },
            { label: 'Gold Tier', value: '2', color: 'text-[#633806]' },
            { label: 'Silver Tier', value: '2', color: 'text-[#0C447C]' },
            { label: 'Pending Quotes', value: kpi.change.split(' ')[0], color: 'text-[#92400E]' },
          ],
          actions: [
            { label: 'View Customers', action: () => { onClose(); onNavigate('customers'); } },
            { label: 'Review Quotes', action: () => { onClose(); onNavigate('quotations'); } }
          ]
        };
      
      case 'Low Stock Items':
        return {
          title: 'Stock Alerts',
          icon: '⚠️',
          stats: [
            { label: 'Low Stock Items', value: kpi.value, color: 'text-[#92400E]' },
            { label: 'Critical (< 5 units)', value: '2', color: 'text-[#991B1B]' },
            { label: 'Low (< 10 units)', value: '8', color: 'text-[#92400E]' },
            { label: 'Total Products', value: '30', color: 'text-[#065F46]' },
            { label: 'Out of Stock', value: '0', color: 'text-[var(--color-text-secondary)]' },
          ],
          actions: [
            { label: 'Manage Inventory', action: () => { onClose(); onNavigate('products'); } },
            { label: 'Create Purchase Order', action: () => alert('Purchase order feature coming soon!') }
          ]
        };
      
      default:
        return null;
    }
  };

  const content = getDetailContent();
  if (!content) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B2545] to-[#0d2d52] text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-[32px]">{content.icon}</div>
            <div>
              <h2 className="text-[16px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                {content.title}
              </h2>
              <p className="text-[11px] opacity-80">Detailed breakdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Stats Grid */}
          <div className="space-y-3 mb-6">
            {content.stats.map((stat, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-[var(--color-background-tertiary)] rounded-lg"
              >
                <span className="text-[12px] text-[var(--color-text-secondary)]">
                  {stat.label}
                </span>
                <div className="text-right">
                  <div className={`text-[14px] font-semibold font-[family-name:var(--font-plus-jakarta)] ${stat.color || 'text-[#0B2545]'}`}>
                    {stat.value}
                  </div>
                  {stat.trend && (
                    <div className="text-[10px] text-[#0E8A6E]">
                      {stat.trend}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {content.actions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`w-full px-4 py-3 rounded-lg text-[12px] font-semibold transition-colors ${
                  index === 0
                    ? 'bg-[#0B2545] text-white hover:bg-[#0d2d52]'
                    : 'border-[0.5px] border-[var(--color-border-secondary)] hover:bg-[var(--color-background-tertiary)]'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
