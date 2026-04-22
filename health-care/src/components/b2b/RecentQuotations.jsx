"use client";

export default function RecentQuotations({ quotations = [] }) {
  const mockQuotations = quotations.length > 0 ? quotations : [
    { id: 'QUO-2241', date: '2025-04-12', items: 12, total: 125000, status: 'Pending' },
    { id: 'QUO-2240', date: '2025-04-10', items: 6, total: 58000, status: 'Approved' },
    { id: 'QUO-2239', date: '2025-04-08', items: 4, total: 32000, status: 'Converted' }
  ];

  return (
    <div className="bg-white rounded-lg p-4 border-[0.5px] border-[var(--color-border-tertiary)]">
      <h3 className="text-[14px] font-semibold mb-3">Recent Quotations</h3>
      <div className="space-y-2">
        {mockQuotations.map((quote) => (
          <div key={quote.id} className="flex items-center justify-between p-3 border-[0.5px] border-[var(--color-border-tertiary)] rounded-lg">
            <div>
              <div className="text-[12px] font-medium">{quote.id}</div>
              <div className="text-[10px] text-[var(--color-text-secondary)]">{quote.date} • {quote.items} items</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] font-bold">৳{quote.total.toLocaleString()}</div>
              <div className={`text-[10px] ${
                quote.status === 'Approved' ? 'text-[#0E8A6E]' :
                quote.status === 'Pending' ? 'text-[#F59E0B]' :
                'text-[var(--color-text-secondary)]'
              }`}>
                {quote.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
