"use client";

export default function Sidebar() {
  return (
    <div className="w-full md:w-64 lg:w-72 bg-[var(--color-background-primary)] border-r-[0.5px] border-[var(--color-border-tertiary)] h-screen flex flex-col">
      <div className="p-4 md:p-6 border-b-[0.5px] border-[var(--color-border-tertiary)]">
        <div className="font-[family-name:var(--font-lora)] text-lg md:text-xl font-semibold text-brand-navy">
          Mediport<sup className="text-xs text-brand-teal">BD</sup>
        </div>
        <div className="text-xs text-[var(--color-text-secondary)] mt-1">B2B Portal</div>
      </div>
      <nav className="flex-1 p-3 md:p-4 overflow-y-auto">
        <button className="w-full text-left min-h-[44px] text-xs md:text-xs font-semibold text-brand-navy px-2 md:px-3 py-2.5 bg-[var(--color-background-secondary)] rounded-lg mb-1">
          Dashboard
        </button>
        <button className="w-full text-left min-h-[44px] text-xs md:text-xs text-[var(--color-text-secondary)] px-2 md:px-3 py-2.5 hover:bg-[var(--color-background-secondary)] rounded-lg cursor-pointer transition-colors">
          Orders
        </button>
        <button className="w-full text-left min-h-[44px] text-xs md:text-xs text-[var(--color-text-secondary)] px-2 md:px-3 py-2.5 hover:bg-[var(--color-background-secondary)] rounded-lg cursor-pointer transition-colors">
          Quotations
        </button>
        <button className="w-full text-left min-h-[44px] text-xs md:text-xs text-[var(--color-text-secondary)] px-2 md:px-3 py-2.5 hover:bg-[var(--color-background-secondary)] rounded-lg cursor-pointer transition-colors">
          Products
        </button>
        <button className="w-full text-left min-h-[44px] text-xs md:text-xs text-[var(--color-text-secondary)] px-2 md:px-3 py-2.5 hover:bg-[var(--color-background-secondary)] rounded-lg cursor-pointer transition-colors">
          Account
        </button>
      </nav>
    </div>
  );
}
