'use client';

import ReagentCard from './ReagentCard';

export default function ReagentGrid({ reagents, onProductClick }) {
  if (!Array.isArray(reagents) || reagents.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {reagents.map((reagent) => {
        const key = reagent?._id || reagent?.id || reagent?.sku;
        if (!reagent || typeof reagent !== 'object' || !key) return null;
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
