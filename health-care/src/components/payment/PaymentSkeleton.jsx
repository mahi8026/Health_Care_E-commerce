export default function PaymentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Card details label */}
      <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-lg p-4">
        <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
        {/* Card input area */}
        <div className="p-3 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg bg-white">
          <div className="h-5 bg-gray-200 rounded w-full" />
        </div>
      </div>

      {/* Pay button */}
      <div className="h-11 bg-gray-200 rounded-lg w-full" />

      {/* Secured by Stripe */}
      <div className="flex items-center justify-center gap-2">
        <div className="h-3 w-3 bg-gray-200 rounded-full" />
        <div className="h-3 w-28 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
