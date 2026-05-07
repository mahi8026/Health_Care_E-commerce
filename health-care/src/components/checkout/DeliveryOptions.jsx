export default function DeliveryOptions({ selected, onSelect }) {
  const options = [
    {
      id: 'standard',
      name: 'Standard delivery — Dhaka metro',
      description: 'Estimated: Tomorrow, 11 Apr 2025 · Includes free installation',
      price: 0,
      isFree: true
    },
    {
      id: 'express',
      name: 'Express same-day (order before 12 PM)',
      description: 'Today by 6 PM · Dhaka only · No installation today',
      price: 500
    },
    {
      id: 'nationwide',
      name: 'Outside Dhaka — nationwide courier',
      description: '3–5 business days · Sundarban / SA Paribahan',
      price: 1200
    },
    {
      id: 'coldchain',
      name: 'Cold chain delivery — reagents',
      description: '2–8°C maintained door-to-door · Certificate included',
      price: 1800,
      highlight: true
    }
  ];

  return (
    <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[10px] px-3 sm:px-[18px] py-3 sm:py-[18px] mb-3 sm:mb-[14px]">
      <div className="text-[12px] sm:text-[13px] font-semibold mb-3 sm:mb-[14px]">Delivery method</div>
      
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <div
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`border-[0.5px] rounded-lg px-3 sm:px-[14px] py-2.5 sm:py-3 cursor-pointer flex items-start sm:items-center gap-2 sm:gap-3 ${
              selected === option.id
                ? option.highlight
                  ? 'border-[#185FA5] bg-[#E6F1FB]'
                  : 'border-[#0B2545] bg-[#E6F1FB]'
                : 'border-[var(--color-border-secondary)]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 ${
                selected === option.id
                  ? option.highlight
                    ? 'border-[#185FA5] bg-[#185FA5]'
                    : 'border-[#0B2545] bg-[#0B2545]'
                  : 'border-[var(--color-border-secondary)]'
              }`}
            >
              {selected === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={`text-[11px] sm:text-[12px] font-medium ${
                  option.highlight && selected === option.id ? 'text-[#0C447C]' : ''
                }`}
              >
                {option.name}
              </div>
              <div className="text-[9px] sm:text-[10px] text-[var(--color-text-secondary)] mt-[1px]">
                {option.description}
              </div>
            </div>
            <div
              className={`ml-auto text-[11px] sm:text-[12px] font-medium flex-shrink-0 ${
                option.isFree
                  ? 'text-[#0E8A6E]'
                  : option.highlight && selected === option.id
                  ? 'text-[#0C447C]'
                  : 'text-[#0B2545]'
              }`}
            >
              {option.isFree ? 'Free' : `৳ ${option.price.toLocaleString()}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
