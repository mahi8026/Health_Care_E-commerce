"use client";

export default function CreditPanel({ accountData }) {
  const creditUsed = accountData?.creditUsed || 0;
  const creditLimit = accountData?.creditLimit || 0;
  const creditAvailable = creditLimit - creditUsed;
  // Clamp to 0–100% to prevent overflow
  const usagePercent = creditLimit > 0 ? Math.min(100, Math.max(0, (creditUsed / creditLimit) * 100)) : 0;

  return (
    <div className="bg-white rounded-lg p-4 border-[0.5px] border-[var(--color-border-tertiary)]">
      <h3 className="text-sm font-semibold mb-3">Credit Status</h3>
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-[var(--color-text-secondary)]">Used</span>
          <span className="font-medium">৳{creditUsed.toLocaleString()}</span>
        </div>
        <div className="w-full h-2 bg-[var(--color-background-tertiary)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-teal rounded-full"
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="text-[var(--color-text-secondary)]">Available</span>
          <span className="font-medium">৳{creditAvailable.toLocaleString()}</span>
        </div>
      </div>
      <div className="pt-3 border-t-[0.5px] border-[var(--color-border-tertiary)]">
        <div className="text-xs text-[var(--color-text-secondary)] mb-1">Credit Limit</div>
        <div className="text-base font-semibold text-brand-navy">৳{creditLimit.toLocaleString()}</div>
      </div>
    </div>
  );
}
