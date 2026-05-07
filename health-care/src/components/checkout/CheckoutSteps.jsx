export default function CheckoutSteps({ currentStep = 2 }) {
  const steps = [
    { num: 1, label: 'Cart review', sublabel: '3 items' },
    { num: 2, label: 'Delivery details', sublabel: 'Address & options' },
    { num: 3, label: 'Payment', sublabel: 'Choose method' },
    { num: 4, label: 'Confirmation', sublabel: 'Order placed' }
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0 mb-4 sm:mb-6 bg-[var(--color-background-primary)] rounded-[10px] px-3 sm:px-5 py-3 sm:py-4 border-[0.5px] border-[var(--color-border-tertiary)] overflow-x-auto">
      {steps.map((step, idx) => (
        <div key={step.num} className="flex items-center flex-1 w-full sm:w-auto min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className={`w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-semibold flex-shrink-0 ${
                step.num < currentStep
                  ? 'bg-[#0E8A6E] text-white'
                  : step.num === currentStep
                  ? 'bg-[#0B2545] text-white'
                  : 'bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)] border-[0.5px] border-[var(--color-border-secondary)]'
              }`}
            >
              {step.num < currentStep ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="sm:w-[11px] sm:h-[11px]">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                step.num
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={`text-[10px] sm:text-[11px] font-medium truncate ${
                  step.num === currentStep ? 'text-[#0B2545]' : 'text-[var(--color-text-primary)]'
                }`}
              >
                {step.label}
              </div>
              <div className="text-[9px] sm:text-[10px] text-[var(--color-text-secondary)] truncate hidden sm:block">{step.sublabel}</div>
            </div>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`hidden sm:block flex-1 h-[0.5px] mx-2 ${
                step.num < currentStep ? 'bg-[#0E8A6E]' : 'bg-[var(--color-border-secondary)]'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
