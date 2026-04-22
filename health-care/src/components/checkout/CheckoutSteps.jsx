export default function CheckoutSteps({ currentStep = 2 }) {
  const steps = [
    { num: 1, label: 'Cart review', sublabel: '3 items' },
    { num: 2, label: 'Delivery details', sublabel: 'Address & options' },
    { num: 3, label: 'Payment', sublabel: 'Choose method' },
    { num: 4, label: 'Confirmation', sublabel: 'Order placed' }
  ];

  return (
    <div className="flex items-center gap-0 mb-6 bg-[var(--color-background-primary)] rounded-[10px] px-5 py-4 border-[0.5px] border-[var(--color-border-tertiary)]">
      {steps.map((step, idx) => (
        <div key={step.num} className="flex items-center flex-1">
          <div className="flex items-center gap-2">
            <div
              className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
                step.num < currentStep
                  ? 'bg-[#0E8A6E] text-white'
                  : step.num === currentStep
                  ? 'bg-[#0B2545] text-white'
                  : 'bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)] border-[0.5px] border-[var(--color-border-secondary)]'
              }`}
            >
              {step.num < currentStep ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                step.num
              )}
            </div>
            <div>
              <div
                className={`text-[11px] font-medium ${
                  step.num === currentStep ? 'text-[#0B2545]' : 'text-[var(--color-text-primary)]'
                }`}
              >
                {step.label}
              </div>
              <div className="text-[10px] text-[var(--color-text-secondary)]">{step.sublabel}</div>
            </div>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`flex-1 h-[0.5px] mx-2 ${
                step.num < currentStep ? 'bg-[#0E8A6E]' : 'bg-[var(--color-border-secondary)]'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
