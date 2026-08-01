'use client';

import { FaCircle } from 'react-icons/fa';

const STATUS_OPTIONS = [
  { value: 'online', label: 'Online', color: 'text-[var(--color-status-success)]' },
  { value: 'away', label: 'Away', color: 'text-[var(--color-status-warning)]' },
  { value: 'busy', label: 'Busy', color: 'text-[var(--color-status-danger)]' },
  { value: 'offline', label: 'Offline', color: 'text-[var(--color-text-secondary)]' }
];

export default function AgentStatusSelector({ currentStatus, onChange }) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-[var(--color-text-secondary)]">Status:</span>
      <select
        value={currentStatus}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FaCircle
        className={`w-3 h-3 ${
          STATUS_OPTIONS.find((opt) => opt.value === currentStatus)?.color || 'text-[var(--color-text-secondary)]'
        }`}
      />
    </div>
  );
}
