export default function MobileB2BBanner() {
  return (
    <div className="px-4 py-4 bg-white">
      <div className="bg-gradient-to-r from-brand-teal to-brand-teal-light rounded-lg p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🏢</div>
          <div className="flex-1">
            <div className="text-xs font-semibold mb-1 font-[family-name:var(--font-plus-jakarta)]">
              B2B Account Benefits
            </div>
            <div className="text-xs opacity-90 mb-2">
              Get bulk discounts, credit terms & priority support
            </div>
            <button className="bg-white text-brand-teal px-3 py-[6px] rounded text-xs font-semibold font-[family-name:var(--font-plus-jakarta)]">
              Register now →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
