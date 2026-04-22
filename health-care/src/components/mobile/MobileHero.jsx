export default function MobileHero() {
  return (
    <div className="px-4 py-4 bg-gradient-to-br from-[#0B2545] to-[#0d2d52] text-white">
      <div className="mb-3">
        <div className="text-[13px] font-semibold mb-1 font-[family-name:var(--font-plus-jakarta)]">
          Welcome back, Dr. Shahid 👋
        </div>
        <div className="text-[10px] opacity-90">
          Trusted medical equipment supplier
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
          <div className="text-[14px] font-bold font-[family-name:var(--font-plus-jakarta)]">
            5,200+
          </div>
          <div className="text-[9px] opacity-80">Products</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
          <div className="text-[14px] font-bold font-[family-name:var(--font-plus-jakarta)]">
            50+
          </div>
          <div className="text-[9px] opacity-80">Brands</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
          <div className="text-[14px] font-bold font-[family-name:var(--font-plus-jakarta)]">
            24/7
          </div>
          <div className="text-[9px] opacity-80">Support</div>
        </div>
      </div>
    </div>
  );
}
