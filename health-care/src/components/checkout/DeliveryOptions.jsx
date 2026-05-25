'use client';

const OPTIONS = [
  {
    id: 'standard',
    name: 'Standard — Dhaka metro',
    description: '1–2 days · Installation included',
    fee: 150,
  },
  {
    id: 'express',
    name: 'Express same-day',
    description: 'Order before 12 PM · Dhaka only',
    fee: 500,
  },
  {
    id: 'nationwide',
    name: 'Nationwide courier',
    description: '3–5 business days',
    fee: 1200,
  },
  {
    id: 'coldchain',
    name: 'Cold chain — reagents',
    description: '2–8°C · Certificate included',
    fee: 1800,
  },
];

export default function DeliveryOptions({ selected, onSelect }) {
  return (
    <section className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5">
      <div className="mb-4 pb-3 border-b border-[#F3F4F6]">
        <h2 className="text-[15px] font-bold text-[#0B2545] m-0">Delivery method</h2>
        <p className="text-[12px] text-[#6B7280] m-0 mt-0.5">Select shipping speed</p>
      </div>

      <div className="space-y-2">
        {OPTIONS.map((option) => {
          const isSelected = selected === option.id;
          return (
            <label
              key={option.id}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all min-h-[60px] ${
                isSelected
                  ? 'border-[#0E8A6E] bg-[#F0FDF9]'
                  : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
              }`}
            >
              <input
                type="radio"
                name="delivery"
                checked={isSelected}
                onChange={() => onSelect(option.id)}
                className="w-5 h-5 accent-[#0E8A6E] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#0B2545]">{option.name}</div>
                <div className="text-[11px] text-[#6B7280] mt-0.5">{option.description}</div>
              </div>
              <span className={`text-[13px] font-bold shrink-0 ${isSelected ? 'text-[#0E8A6E]' : 'text-[#0B2545]'}`}>
                ৳{option.fee.toLocaleString()}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
