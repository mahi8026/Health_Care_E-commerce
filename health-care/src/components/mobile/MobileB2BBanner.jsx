export default function MobileB2BBanner() {
  return (
    <div className="px-4 py-4 bg-white">
      <div className="bg-gradient-to-r from-[#0E8A6E] to-[#4DDBB8] rounded-lg p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="text-[28px]">🏢</div>
          <div className="flex-1">
            <div className="text-[12px] font-semibold mb-1 font-[family-name:var(--font-plus-jakarta)]">
              B2B Account Benefits
            </div>
            <div className="text-[10px] opacity-90 mb-2">
              Get bulk discounts, credit terms & priority support
            </div>
            <button className="bg-white text-[#0E8A6E] px-3 py-[6px] rounded text-[10px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
              Register now →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
