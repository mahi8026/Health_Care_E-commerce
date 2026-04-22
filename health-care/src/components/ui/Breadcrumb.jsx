export default function Breadcrumb({ items }) {
  return (
    <div className="px-7 py-3 text-[11px] text-[var(--color-text-secondary)] flex gap-[6px] items-center bg-[var(--color-background-primary)] border-b-[0.5px] border-[var(--color-border-tertiary)]">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-[6px]">
          {idx > 0 && <span className="text-[var(--color-text-tertiary)]">›</span>}
          {item.href === '#' ? (
            <span>{item.label}</span>
          ) : (
            <a href={item.href} className="hover:text-[var(--color-text-primary)]">
              {item.label}
            </a>
          )}
        </span>
      ))}
    </div>
  );
}
