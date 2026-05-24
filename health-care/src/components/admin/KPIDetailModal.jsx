'use client';

import { ExportService } from '@/utils/exportService';
import { formatBdt } from '@/utils/formatBdt';

export default function KPIDetailModal({ kpi, onClose, onNavigate }) {
  const k = kpi.detailStats?.stats || {};
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
      case 'Revenue (YTD)':
      case 'Total Revenue':
        return {
          title: 'Revenue Analytics',
          icon: '💰',
          stats: [
            { label: 'Year to date', value: formatBdt(k.totalRevenue), trend: kpi.change },
            { label: 'This month', value: formatBdt(k.thisMonthRevenue), trend: '' },
            {
              label: 'Month-over-month',
              value: k.revenueGrowth != null ? `${k.revenueGrowth > 0 ? '+' : ''}${k.revenueGrowth}%` : 'New activity',
              trend: kpi.change,
            },
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
            { label: 'All time (excl. cancelled)', value: String(k.totalOrders ?? 0), trend: '' },
            { label: 'This month', value: String(k.ordersThisMonth ?? 0), trend: kpi.change },
            {
              label: 'Month-over-month',
              value: k.ordersGrowth != null ? `${k.ordersGrowth > 0 ? '+' : ''}${k.ordersGrowth}%` : 'New activity',
              trend: kpi.change,
            },
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
            { label: 'Active B2B accounts', value: String(k.activeB2B ?? 0), trend: '' },
            {
              label: 'Pending quotations',
              value: String(k.pendingQuotes ?? 0),
              color: (k.pendingQuotes ?? 0) > 0 ? 'text-[#92400E]' : 'text-[#065F46]',
            },
          ],
          actions: [
            { label: 'View Customers', action: () => { onClose(); onNavigate('customers'); } },
            { label: 'Review Quotes', action: () => { onClose(); onNavigate('quotes'); } },
          ],
        };

      case 'Abandoned Carts':
        return {
          title: 'Abandoned Carts',
          icon: '🛒',
          stats: [
            { label: 'Currently abandoned', value: String(k.abandonedCarts ?? 0), trend: '' },
            { label: 'Value at risk', value: formatBdt(k.abandonedCartValue), trend: '' },
            { label: 'Recovery rate', value: `${k.cartRecoveryRate ?? 0}%`, trend: '' },
            { label: 'Recovery emails sent', value: String(k.cartEmailsSent ?? 0), trend: '' },
          ],
          actions: [
            { label: 'View Orders', action: () => { onClose(); onNavigate('orders'); } },
          ],
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
            className="w-11 h-11 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
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
