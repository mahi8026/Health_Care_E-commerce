"use client";

import GA4Tracker from '@/services/GA4Tracker';

export default function QuickActions() {
  const actions = [
    { icon: '📦', label: 'New Order', desc: 'Place a new order', action: 'new_order' },
    { icon: '📋', label: 'Request Quote', desc: 'Get a quotation', action: 'request_quote' },
    { icon: '🔄', label: 'Reorder', desc: 'Repeat last order', action: 'reorder' },
    { icon: '📊', label: 'Reports', desc: 'View analytics', action: 'reports' }
  ];

  const handleActionClick = (action) => {
    // Track quotation request
    if (action === 'request_quote') {
      // Create a mock quotation object for tracking
      const quotation = {
        id: `QUO-${Date.now()}`,
        total: 0,
        items: []
      };
      GA4Tracker.trackQuotationRequest(quotation);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 border-[0.5px] border-[var(--color-border-tertiary)] mb-6">
      <h3 className="text-[14px] font-semibold mb-3">Quick Actions</h3>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleActionClick(action.action)}
            className="flex flex-col items-center gap-2 p-3 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg hover:bg-[var(--color-background-secondary)] cursor-pointer"
          >
            <div className="text-[24px]">{action.icon}</div>
            <div className="text-[11px] font-medium">{action.label}</div>
            <div className="text-[10px] text-[var(--color-text-secondary)]">{action.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
