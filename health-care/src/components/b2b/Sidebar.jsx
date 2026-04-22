"use client";

export default function Sidebar() {
  return (
    <div className="w-64 bg-[var(--color-background-primary)] border-r-[0.5px] border-[var(--color-border-tertiary)] h-screen flex flex-col">
      <div className="p-6 border-b-[0.5px] border-[var(--color-border-tertiary)]">
        <div className="font-[family-name:var(--font-lora)] text-[20px] font-semibold text-[#0B2545]">
          MedCore<sup className="text-[10px] text-[#0E8A6E]">BD</sup>
        </div>
        <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">B2B Portal</div>
      </div>
      <nav className="flex-1 p-4">
        <div className="text-[12px] font-semibold text-[#0B2545] px-3 py-2 bg-[var(--color-background-secondary)] rounded-lg mb-1">
          Dashboard
        </div>
        <div className="text-[12px] text-[var(--color-text-secondary)] px-3 py-2 hover:bg-[var(--color-background-secondary)] rounded-lg cursor-pointer">
          Orders
        </div>
        <div className="text-[12px] text-[var(--color-text-secondary)] px-3 py-2 hover:bg-[var(--color-background-secondary)] rounded-lg cursor-pointer">
          Quotations
        </div>
        <div className="text-[12px] text-[var(--color-text-secondary)] px-3 py-2 hover:bg-[var(--color-background-secondary)] rounded-lg cursor-pointer">
          Products
        </div>
        <div className="text-[12px] text-[var(--color-text-secondary)] px-3 py-2 hover:bg-[var(--color-background-secondary)] rounded-lg cursor-pointer">
          Account
        </div>
      </nav>
    </div>
  );
}
