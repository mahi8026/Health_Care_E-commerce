export default function MobileNav() {
  return (
    <div className="px-4 py-3 bg-white border-b-[0.5px] border-[var(--color-border-tertiary)]">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="font-[family-name:var(--font-lora)] text-[15px] font-semibold text-[#0B2545]">
          Mediport<span className="text-[#0E8A6E]">BD</span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search products..."
            aria-label="Search products"
            className="w-full pl-8 pr-3 py-[6px] bg-[var(--color-background-tertiary)] rounded-full text-[11px] font-[family-name:var(--font-plus-jakarta)] focus:outline-none focus:bg-white focus:border-[0.5px] focus:border-[var(--color-border-secondary)]"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--color-text-tertiary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Cart Icon */}
        <button className="relative" aria-label="Shopping cart — 3 items">
          <svg className="w-5 h-5 text-[var(--color-text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E24B4A] text-white text-[9px] font-bold rounded-full flex items-center justify-center" aria-hidden="true">
            3
          </span>
        </button>
      </div>
    </div>
  );
}
