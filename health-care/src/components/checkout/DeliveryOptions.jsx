'use client';

// ─── Steadfast Courier Zone Map ───────────────────────────────────────────────
// Source: https://steadfast.com.bd (official FAQ, 1 kg parcel rates)
// Inside Dhaka:   ৳70   (Dhaka city proper)
// Dhaka Suburban: ৳100  (satellite towns within 30 km of Dhaka)
// Outside Dhaka:  ৳130  (rest of Bangladesh)
// ─────────────────────────────────────────────────────────────────────────────

const SUBURBAN_DISTRICTS = new Set([
  'narayanganj', 'gazipur', 'manikganj', 'munshiganj', 'narsingdi',
]);

export function getDeliveryZone(district = '') {
  const d = district.trim().toLowerCase();
  if (!d || d === 'dhaka') return 'inside_dhaka';
  if (SUBURBAN_DISTRICTS.has(d)) return 'dhaka_suburban';
  return 'outside_dhaka';
}

export const DELIVERY_ZONE_INFO = {
  inside_dhaka: {
    label: 'Inside Dhaka',
    fee: 70,
    eta: '1–2 business days',
    icon: '🏙️',
    color: '#0E8A6E',
    bg: '#F0FDF9',
    border: '#0E8A6E',
  },
  dhaka_suburban: {
    label: 'Dhaka Suburban',
    fee: 100,
    eta: '2–3 business days',
    icon: '🏘️',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#2563EB',
  },
  outside_dhaka: {
    label: 'Outside Dhaka',
    fee: 130,
    eta: '3–5 business days',
    icon: '🚚',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#7C3AED',
  },
};

export default function DeliveryOptions({ district = '' }) {
  const zone = getDeliveryZone(district);
  const info = DELIVERY_ZONE_INFO[zone];

  return (
    <section className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-[#F3F4F6]">
        <h2 className="text-[15px] font-bold text-[#0B2545] m-0">Delivery charge</h2>
        <p className="text-[12px] text-[#6B7280] m-0 mt-0.5">
          Powered by Steadfast Courier · Auto-calculated from your address
        </p>
      </div>

      {/* Zone Card */}
      <div
        style={{ border: `2px solid ${info.border}`, background: info.bg }}
        className="rounded-xl p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{info.icon}</span>
            <div>
              <div className="text-[14px] font-bold text-[#0B2545]">{info.label}</div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">⏱ {info.eta}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[20px] font-black" style={{ color: info.color }}>
              ৳{info.fee}
            </div>
            <div className="text-[10px] text-[#9CA3AF] font-medium">delivery fee</div>
          </div>
        </div>

        {/* Zone breakdown info */}
        <div className="mt-3 pt-3 border-t border-black/5 grid grid-cols-3 gap-1 text-center">
          {Object.entries(DELIVERY_ZONE_INFO).map(([key, z]) => (
            <div
              key={key}
              className={`rounded-lg p-2 transition-all ${
                key === zone ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <div className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wide">
                {z.label}
              </div>
              <div className="text-[13px] font-black text-[#0B2545] mt-0.5">৳{z.fee}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Steadfast badge */}
      <div className="mt-3 flex items-center gap-2 text-[11px] text-[#9CA3AF]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
        <span>
          Delivered via{' '}
          <a
            href="https://steadfast.com.bd"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0E8A6E] font-semibold hover:underline"
          >
            Steadfast Courier
          </a>
          {' '}· COD available · 1% COD handling fee applies
        </span>
      </div>
    </section>
  );
}
