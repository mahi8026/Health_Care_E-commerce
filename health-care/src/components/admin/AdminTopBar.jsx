"use client";

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
  alert(`${action} — PDF export coming soon.`);
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
    <div className="bg-white border-b-[0.5px] border-[var(--color-border-tertiary)] px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold mb-1 font-[family-name:var(--font-lora)]">
            {title}
          </h1>
          <div className="text-[11px] text-[var(--color-text-secondary)]">
            {currentDate}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-[240px] pl-9 pr-3 py-[8px] bg-[var(--color-background-tertiary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] focus:outline-none focus:bg-white focus:border-[0.5px] focus:border-[var(--color-border-secondary)]"
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

          {/* Notifications */}
          <button className="relative p-2 hover:bg-[var(--color-background-tertiary)] rounded-lg">
            <svg className="w-5 h-5 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#E24B4A] rounded-full"></span>
          </button>

          {/* Profile */}
          <button className="flex items-center gap-2 p-2 hover:bg-[var(--color-background-tertiary)] rounded-lg">
            <div className="w-8 h-8 bg-[#0E8A6E] rounded-full flex items-center justify-center text-white font-bold text-[11px]">
              SA
            </div>
          </button>

          {/* Action Button */}
          <button
            className="px-4 py-[8px] bg-[#0B2545] text-white rounded-lg text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)] hover:bg-[#0d2d52]"
            onClick={isExportAction ? () => handleExportClick(action) : () => onAction?.(action)}
          >
            {action}
          </button>
        </div>
      </div>
    </div>
  );
}
