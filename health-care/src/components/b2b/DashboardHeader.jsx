"use client";

export default function DashboardHeader({ accountData }) {
  return (
    <div className="bg-[var(--color-background-primary)] border-b-[0.5px] border-[var(--color-border-tertiary)] px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold font-[family-name:var(--font-lora)]">
            Welcome back, {accountData?.name || 'User'}
          </h1>
          <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">
            Account ID: {accountData?.accountId || 'N/A'} • {accountData?.tier || 'Standard'} Tier
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] hover:bg-[var(--color-background-secondary)]">
            View Catalog
          </button>
          <button className="px-4 py-2 bg-[#0B2545] text-white rounded-lg text-[12px] font-medium">
            New Order
          </button>
        </div>
      </div>
    </div>
  );
}
