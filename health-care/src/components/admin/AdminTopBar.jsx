"use client";

import { showToast } from '@/components/ui/Toast';

/**
 * AdminTopBar
 *
 * Renders the top bar for the Admin Dashboard.
 * When the action button is "Export orders" or "Export report", it dynamically
 * imports the PDF exporter utility on click so that jspdf / jspdf-autotable are
 * never included in the initial bundle.
 *
 * Requirements: 3.4, 3.5
 */

const EXPORT_ACTIONS = new Set(['Export orders', 'Export report']);

async function handleExportClick(action) {
  // PDF export is not yet implemented — placeholder for future sprint
  console.info(`[AdminTopBar] Export action triggered: ${action}`);
  showToast.info(`${action} — PDF export coming soon.`);
}

export default function AdminTopBar({ title, action, onAction }) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isExportAction = EXPORT_ACTIONS.has(action);

  return (
    <div className="bg-gradient-to-r from-white via-blue-50 to-cyan-50 border-b-[0.5px] border-blue-100 px-3 sm:px-4 md:px-6 py-3 sm:py-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-[16px] sm:text-[18px] font-semibold mb-0.5 sm:mb-1 font-[family-name:var(--font-lora)] bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent truncate">
            {title}
          </h1>
          <div className="text-[10px] sm:text-[11px] text-[var(--color-text-secondary)] hidden sm:block">
            {currentDate}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          {/* Search - Hidden on mobile, visible on tablet+ */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              aria-label="Search in admin"
              className="w-[180px] lg:w-[240px] pl-9 pr-3 py-[8px] bg-[var(--color-background-tertiary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] focus:outline-none focus:bg-white focus:border-[0.5px] focus:border-[var(--color-border-secondary)]"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Notifications - 44x44 touch target */}
          <button aria-label="Notifications" className="relative p-2 hover:bg-[var(--color-background-tertiary)] rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#E24B4A] rounded-full"></span>
          </button>

          {/* Profile - Hidden on mobile */}
          <button aria-label="Profile" className="hidden sm:flex items-center gap-2 p-2 hover:bg-[var(--color-background-tertiary)] rounded-lg min-w-[44px] min-h-[44px]">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-[11px] shadow-lg">
              SA
            </div>
          </button>

          {/* Action Button - Responsive sizing */}
          <button
            className="px-3 sm:px-4 py-2 sm:py-[8px] bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-[11px] sm:text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)] hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105 min-h-[44px] whitespace-nowrap"
            onClick={isExportAction ? () => handleExportClick(action) : () => onAction?.(action)}
          >
            <span className="hidden sm:inline">{action}</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>
      </div>
    </div>
  );
}
