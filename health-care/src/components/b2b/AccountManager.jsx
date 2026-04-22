"use client";

export default function AccountManager({ manager }) {
  const defaultManager = manager || {
    name: 'Fatima Rahman',
    role: 'Senior Account Manager',
    phone: '+880 1712-345678',
    email: 'fatima.rahman@medcorebd.com'
  };

  return (
    <div className="bg-white rounded-lg p-4 border-[0.5px] border-[var(--color-border-tertiary)]">
      <h3 className="text-[14px] font-semibold mb-3">Your Account Manager</h3>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-[#0E8A6E] flex items-center justify-center text-white text-[16px] font-semibold">
          {defaultManager.name.charAt(0)}
        </div>
        <div>
          <div className="text-[12px] font-medium">{defaultManager.name}</div>
          <div className="text-[10px] text-[var(--color-text-secondary)]">{defaultManager.role}</div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-[11px]">
          <span className="text-[var(--color-text-secondary)]">Phone:</span> {defaultManager.phone}
        </div>
        <div className="text-[11px]">
          <span className="text-[var(--color-text-secondary)]">Email:</span> {defaultManager.email}
        </div>
      </div>
      <button className="w-full mt-3 px-4 py-2 bg-[#0E8A6E] text-white rounded-lg text-[11px] font-medium">
        Contact Manager
      </button>
    </div>
  );
}
