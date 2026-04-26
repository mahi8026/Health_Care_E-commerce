import ReagentCard from './ReagentCard';

export default function ReagentGrid({ reagents, onProductClick }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {reagents.map(reagent => (
        <ReagentCard 
          key={reagent._id || reagent.id || reagent.sku} 
          reagent={reagent}
          onProductClick={onProductClick}
        />
      ))}
    </div>
  );
}
