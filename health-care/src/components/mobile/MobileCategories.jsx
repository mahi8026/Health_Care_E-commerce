export default function MobileCategories() {
  const categories = [
    { icon: '🩺', name: 'Diagnostic' },
    { icon: '💉', name: 'Surgical' },
    { icon: '🧪', name: 'Lab' },
    { icon: '🏥', name: 'Hospital' },
    { icon: '🦷', name: 'Dental' },
    { icon: '👁', name: 'Optical' }
  ];

  return (
    <div className="px-4 py-4 bg-white">
      <div className="text-[12px] font-semibold mb-3 font-[family-name:var(--font-plus-jakarta)]">
        Categories
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category, index) => (
          <button
            key={index}
            className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 bg-[var(--color-background-tertiary)] rounded-lg hover:bg-[var(--color-background-secondary)] min-w-[70px]"
          >
            <span className="text-[20px]">{category.icon}</span>
            <span className="text-[10px] font-medium font-[family-name:var(--font-plus-jakarta)]">
              {category.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
