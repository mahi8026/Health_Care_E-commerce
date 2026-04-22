export default function CustomersManagement() {
  const customers = [
    { id: 1, name: 'Square Hospital', type: 'Hospital', contact: 'Dr. Rahman', email: 'procurement@square.com', credit: 500000, spent: 2450000, status: 'active' },
    { id: 2, name: 'Apollo Hospitals', type: 'Hospital', contact: 'Ms. Sultana', email: 'purchase@apollo.com', credit: 750000, spent: 1890000, status: 'active' },
    { id: 3, name: 'Labaid Diagnostics', type: 'Diagnostic Center', contact: 'Mr. Karim', email: 'admin@labaid.com', credit: 300000, spent: 980000, status: 'active' },
    { id: 4, name: 'United Hospital', type: 'Hospital', contact: 'Dr. Ahmed', email: 'supply@united.com', credit: 1000000, spent: 3200000, status: 'active' },
    { id: 5, name: 'Ibn Sina Hospital', type: 'Hospital', contact: 'Ms. Haque', email: 'procurement@ibnsina.com', credit: 400000, spent: 1560000, status: 'pending' }
  ];

  const getStatusColor = (status) => {
    return status === 'active' 
      ? 'bg-[#D1FAE5] text-[#065F46]' 
      : 'bg-[#FEF3C7] text-[#92400E]';
  };

  return (
    <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)]">
      {/* Filters */}
      <div className="p-4 border-b-[0.5px] border-[var(--color-border-tertiary)] flex gap-3">
        <select className="px-3 py-[8px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] bg-white">
          <option>All types</option>
          <option>Hospital</option>
          <option>Diagnostic Center</option>
          <option>Clinic</option>
          <option>Pharmacy</option>
        </select>
        <select className="px-3 py-[8px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] bg-white">
          <option>All statuses</option>
          <option>Active</option>
          <option>Pending</option>
          <option>Suspended</option>
        </select>
        <input
          type="text"
          placeholder="Search customers..."
          className="flex-1 px-3 py-[8px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)]"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-[0.5px] border-[var(--color-border-tertiary)]">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                Customer Name
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                Type
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                Contact Person
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                Email
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                Credit Limit
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                Total Spent
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                Status
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id} className="border-b-[0.5px] border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-tertiary)]">
                <td className="px-4 py-3 text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                  {customer.name}
                </td>
                <td className="px-4 py-3 text-[12px]">{customer.type}</td>
                <td className="px-4 py-3 text-[12px]">{customer.contact}</td>
                <td className="px-4 py-3 text-[11px] text-[var(--color-text-secondary)]">
                  {customer.email}
                </td>
                <td className="px-4 py-3 text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                  ৳{customer.credit.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                  ৳{customer.spent.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-[3px] rounded font-medium ${getStatusColor(customer.status)}`}>
                    {customer.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-[11px] text-[#0E8A6E] font-medium hover:underline">
                    View profile
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
