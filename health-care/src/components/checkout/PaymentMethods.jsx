export default function PaymentMethods({ selected, onSelect }) {
  const methods = [
    { id: 'stripe', label: 'Credit/Debit Card', color: '#E6EBFF', textColor: '#635BFF' },
    { id: 'bkash', label: 'bKash', color: '#FBEAF0', textColor: '#E2136E' },
    { id: 'nagad', label: 'Nagad', color: '#E1F5EE', textColor: '#0E8A6E' },
    { id: 'bank', label: 'Bank transfer (BEFTN)', color: '#E6F1FB', textColor: '#185FA5' },
    { id: 'npsb', label: 'NPSB', color: '#FAEEDA', textColor: '#854F0B' },
    { id: 'credit', label: 'B2B credit line', color: '#E1F5EE', textColor: '#0E8A6E' },
    { id: 'cheque', label: 'Cheque', color: '#EEEDFE', textColor: '#534AB7' }
  ];

  return (
    <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[10px] px-[18px] py-[18px] mb-[14px]">
      <div className="text-[13px] font-semibold mb-[14px]">Payment method</div>
      
      <div className="grid grid-cols-3 gap-2 mb-3">
        {methods.map((method) => (
          <div
            key={method.id}
            onClick={() => onSelect(method.id)}
            className={`border-[0.5px] rounded-lg px-[10px] py-[10px] cursor-pointer text-center flex flex-col items-center gap-[5px] ${
              selected === method.id
                ? 'border-[#0B2545] bg-[#E6F1FB] border-[1.5px]'
                : 'border-[var(--color-border-secondary)]'
            }`}
          >
            <div
              className="w-8 h-[22px] rounded flex items-center justify-center"
              style={{ background: method.color }}
            >
              <svg width="18" height="13" viewBox="0 0 32 20" fill="none">
                {method.id === 'stripe' && (
                  <>
                    <rect x="2" y="4" width="28" height="12" rx="2" fill={method.textColor} opacity="0.2" />
                    <rect x="4" y="7" width="8" height="2" rx="1" fill={method.textColor} />
                    <rect x="4" y="11" width="12" height="2" rx="1" fill={method.textColor} />
                  </>
                )}
                {method.id === 'bank' && (
                  <>
                    <rect x="1" y="1" width="22" height="14" rx="3" stroke={method.textColor} strokeWidth="1.2" />
                    <line x1="1" y1="5.5" x2="23" y2="5.5" stroke={method.textColor} strokeWidth="1.2" />
                    <rect x="3" y="8" width="6" height="2" rx="1" fill={method.textColor} />
                  </>
                )}
                {(method.id === 'bkash' || method.id === 'nagad' || method.id === 'npsb' || method.id === 'cheque' || method.id === 'credit') && (
                  <>
                    <rect width="32" height="20" rx="4" fill={method.textColor} opacity="0.15" />
                    <text x="16" y="14" fontSize="7" textAnchor="middle" fill={method.textColor} fontWeight="bold">
                      {method.label.split(' ')[0]}
                    </text>
                  </>
                )}
              </svg>
            </div>
            <div className="text-[10px] font-medium text-[var(--color-text-primary)]">
              {method.label}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[var(--color-background-secondary)] rounded-lg px-3 py-3 text-[11px] text-[var(--color-text-secondary)] leading-[1.7]">
        Bank: <strong className="text-[var(--color-text-primary)]">Dutch-Bangla Bank Ltd</strong> &nbsp;·&nbsp; 
        Account: <strong className="text-[var(--color-text-primary)]">1721 2030 5678</strong> &nbsp;·&nbsp; 
        Name: MedCore Bangladesh Ltd
        <br />
        Reference your order number in the transfer. Payment verification takes 2–4 hours on business days.
      </div>
    </div>
  );
}
