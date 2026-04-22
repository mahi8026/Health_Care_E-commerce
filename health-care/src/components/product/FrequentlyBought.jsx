export default function FrequentlyBought() {
  const items = [
    {
      name: 'Patient cable 10-lead',
      price: 3200,
      icon: 'cable',
      bgColor: '#E1F5EE',
      iconColor: '#0F6E56'
    },
    {
      name: 'Thermal paper rolls ×10',
      price: 1800,
      icon: 'paper',
      bgColor: '#FAEEDA',
      iconColor: '#854F0B'
    },
    {
      name: 'AMC service contract',
      price: 12000,
      suffix: '/yr',
      icon: 'briefcase',
      bgColor: '#EEEDFE',
      iconColor: '#534AB7'
    }
  ];

  return (
    <div>
      <div className="text-[11px] text-[var(--color-text-secondary)] mb-2">
        Frequently bought together
      </div>
      <div className="flex gap-2 flex-wrap">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="border-[0.5px] border-[var(--color-border-tertiary)] rounded-lg px-[10px] py-2 flex items-center gap-2 cursor-pointer bg-[var(--color-background-primary)] hover:border-[#0B2545]"
          >
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ background: item.bgColor }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={item.iconColor} strokeWidth="1.5">
                {item.icon === 'cable' && (
                  <>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/>
                    <circle cx="12" cy="12" r="4"/>
                  </>
                )}
                {item.icon === 'paper' && (
                  <>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </>
                )}
                {item.icon === 'briefcase' && (
                  <>
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                  </>
                )}
              </svg>
            </div>
            <div>
              <div className="text-[11px] font-medium">{item.name}</div>
              <div className="text-[10px] text-[var(--color-text-secondary)]">
                ৳ {item.price.toLocaleString()}{item.suffix || ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
