'use client';

import ReagentCard from './ReagentCard';

export default function ReagentGrid({ reagents, onProductClick }) {
  if (!Array.isArray(reagents) || reagents.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {reagents.map((reagent) => {
        const key = reagent?._id || reagent?.id || reagent?.sku || Math.random();
        // Skip completely broken items silently
        if (!reagent || typeof reagent !== 'object') return null;
        return (
          <ReagentCard
            key={key}
            reagent={reagent}
            onProductClick={onProductClick}
          />
        );
      })}
    </div>
  );
}
