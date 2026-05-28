'use client';

import { FaCircle } from 'react-icons/fa';

const STATUS_OPTIONS = [
  { value: 'online', label: 'Online', color: 'text-green-500' },
  { value: 'away', label: 'Away', color: 'text-yellow-500' },
  { value: 'busy', label: 'Busy', color: 'text-red-500' },
  { value: 'offline', label: 'Offline', color: 'text-gray-400' }
];

export default function AgentStatusSelector({ currentStatus, onChange }) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Status:</span>
      <select
        value={currentStatus}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FaCircle
        className={`w-3 h-3 ${
          STATUS_OPTIONS.find((opt) => opt.value === currentStatus)?.color || 'text-gray-400'
        }`}
      />
    </div>
  );
}
