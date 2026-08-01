"use client";

export default function AccountManager({ accountManager }) {
  // Use real account manager data from props; fall back to generic contact info
  const manager = accountManager || {
    name: 'B2B Support Team',
    role: 'Senior B2B Executive',
    phone: '+880 1800-Mediport',
    email: 'b2b@MediportBD.com',
    isOnline: false,
  };

  return (
    <div className="bg-white rounded-lg p-4 border-[0.5px] border-[var(--color-border-tertiary)]">
      <h3 className="text-sm font-semibold mb-3">Your Account Manager</h3>
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-brand-teal flex items-center justify-center text-white text-base font-semibold">
            {manager.name.charAt(0)}
          </div>
          {manager.isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-white rounded-full" />
          )}
        </div>
        <div>
          <div className="text-xs font-medium">{manager.name}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">{manager.role}</div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs">
          <span className="text-[var(--color-text-secondary)]">Phone:</span> {manager.phone}
        </div>
        <div className="text-xs">
          <span className="text-[var(--color-text-secondary)]">Email:</span> {manager.email}
        </div>
      </div>
      <a
        href={`mailto:${manager.email}`}
        className="block w-full mt-3 px-4 py-2 bg-brand-teal text-white rounded-lg text-xs font-medium text-center hover:bg-[var(--color-brand-teal-hover)] transition-colors"
      >
        Contact Manager
      </a>
    </div>
  );
}
