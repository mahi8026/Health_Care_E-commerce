export default function QuotationsManagement() {
  const quotations = [
    { id: 'QUO-2025-042', customer: 'Square Hospital', items: 5, amount: 450000, status: 'pending', date: '13 Apr 2026', validUntil: '20 Apr 2026' },
    { id: 'QUO-2025-041', customer: 'Apollo Hospitals', items: 3, amount: 280000, status: 'approved', date: '12 Apr 2026', validUntil: '19 Apr 2026' },
    { id: 'QUO-2025-040', customer: 'Labaid Diagnostics', items: 8, amount: 125000, status: 'sent', date: '11 Apr 2026', validUntil: '18 Apr 2026' },
    { id: 'QUO-2025-039', customer: 'United Hospital', items: 12, amount: 890000, status: 'approved', date: '10 Apr 2026', validUntil: '17 Apr 2026' },
    { id: 'QUO-2025-038', customer: 'Ibn Sina Hospital', items: 4, amount: 320000, status: 'rejected', date: '9 Apr 2026', validUntil: '16 Apr 2026' }
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-[#FEF3C7] text-[#92400E]',
      sent: 'bg-[#DBEAFE] text-[#1E40AF]',
      approved: 'bg-[#D1FAE5] text-[#065F46]',
      rejected: 'bg-[#FEE2E2] text-[#991B1B]'
    };
    return colors[status];
  };

  return (
    <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)]">
      {/* Filters */}
      <div className="p-4 border-b-[0.5px] border-[var(--color-border-tertiary)] flex gap-3">
        <select className="px-3 py-[8px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] bg-white">
          <option>All statuses</option>
          <option>Pending</option>
          <option>Sent</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>
        <input
          type="date"
          className="px-3 py-[8px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)]"
        />
        <input
          type="text"
          placeholder="Search quotations..."
          className="flex-1 px-3 py-[8px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)]"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-[0.5px] border-[var(--color-border-tertiary)]">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                Quotation ID
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                Customer
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                Items
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                Amount
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                Status
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                Date
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                Valid Until
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {quotations.map(quote => (
              <tr key={quote.id} className="border-b-[0.5px] border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-tertiary)]">
                <td className="px-4 py-3 text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                  {quote.id}
                </td>
                <td className="px-4 py-3 text-[12px]">{quote.customer}</td>
                <td className="px-4 py-3 text-[12px]">{quote.items} items</td>
                <td className="px-4 py-3 text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                  ৳{quote.amount.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-[3px] rounded font-medium ${getStatusColor(quote.status)}`}>
                    {quote.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[11px] text-[var(--color-text-secondary)]">
                  {quote.date}
                </td>
                <td className="px-4 py-3 text-[11px] text-[var(--color-text-secondary)]">
                  {quote.validUntil}
                </td>
                <td className="px-4 py-3">
                  <button className="text-[11px] text-[#0E8A6E] font-medium hover:underline mr-3">
                    View
                  </button>
                  <button className="text-[11px] text-[#0B2545] font-medium hover:underline">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
