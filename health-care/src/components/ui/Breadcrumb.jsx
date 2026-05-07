export default function Breadcrumb({ items }) {
  return (
    <div className="px-3 sm:px-5 md:px-7 py-2 sm:py-3 text-[10px] sm:text-[11px] text-[var(--color-text-secondary)] flex gap-[4px] sm:gap-[6px] items-center bg-[var(--color-background-primary)] border-b-[0.5px] border-[var(--color-border-tertiary)] overflow-x-auto whitespace-nowrap">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-[4px] sm:gap-[6px] flex-shrink-0">
          {idx > 0 && <span className="text-[var(--color-text-tertiary)]">›</span>}
          {item.href === '#' ? (
            <span className="truncate max-w-[120px] sm:max-w-none">{item.label}</span>
          ) : (
            <a href={item.href} className="hover:text-[var(--color-text-primary)] truncate max-w-[120px] sm:max-w-none">
              {item.label}
            </a>
          )}
        </span>
      ))}
    </div>
  );
}
