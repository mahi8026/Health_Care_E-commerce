export default function ReagentCard({ reagent }) {
  const getTempBadge = (temp) => {
    const badges = {
      cold: { bg: '#E6F1FB', text: '#0C447C', icon: '❄', label: 'Cold' },
      freeze: { bg: '#EEEDFE', text: '#3C3489', icon: '🧊', label: 'Frozen' },
      room: { bg: '#E1F5EE', text: '#085041', icon: '🌡', label: 'Room' }
    };
    return badges[temp] || badges.room;
  };

  const getHazardBadge = (hazard) => {
    const badges = {
      bio: { bg: '#FCEBEB', text: '#791F1F', icon: '⚠', label: 'Bio' },
      chem: { bg: '#FAEEDA', text: '#633806', icon: '⚠', label: 'Chem' },
      safe: { bg: '#E1F5EE', text: '#085041', icon: '✓', label: 'Safe' }
    };
    return badges[hazard] || badges.safe;
  };

  const tempBadge = getTempBadge(reagent.temperature);
  const hazardBadge = getHazardBadge(reagent.hazard);

  return (
    <div className="bg-white border-[0.5px] border-[var(--color-border-tertiary)] rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="text-[10px] text-[var(--color-text-tertiary)] mb-1 font-[family-name:var(--font-plus-jakarta)]">
            {reagent.brand}
          </div>
          <h3 className="text-[13px] font-medium leading-tight mb-2 font-[family-name:var(--font-plus-jakarta)]">
            {reagent.name}
          </h3>
        </div>
        {reagent.badge && (
          <span className={`text-[9px] px-2 py-[2px] rounded font-medium ${
            reagent.badge === 'sale' 
              ? 'bg-[#FCEBEB] text-[#791F1F]' 
              : 'bg-[#E1F5EE] text-[#085041]'
          }`}>
            {reagent.badge === 'sale' ? '🔥 SALE' : '✨ NEW'}
          </span>
        )}
      </div>

      {/* Category */}
      <div className="text-[10px] text-[var(--color-text-secondary)] mb-3">
        {reagent.category}
      </div>

      {/* Tests Info */}
      <div className="text-[11px] text-[var(--color-text-primary)] mb-2 font-[family-name:var(--font-plus-jakarta)]">
        {reagent.tests}
      </div>
      {reagent.minOrder && (
        <div className="text-[10px] text-[var(--color-text-tertiary)] mb-3">
          Min. order: {reagent.minOrder}
        </div>
      )}

      {/* Badges */}
      <div className="flex gap-2 mb-3">
        <span
          className="text-[9px] px-2 py-[3px] rounded font-medium"
          style={{ backgroundColor: tempBadge.bg, color: tempBadge.text }}
        >
          {tempBadge.icon} {tempBadge.label}
        </span>
        <span
          className="text-[9px] px-2 py-[3px] rounded font-medium"
          style={{ backgroundColor: hazardBadge.bg, color: hazardBadge.text }}
        >
          {hazardBadge.icon} {hazardBadge.label}
        </span>
      </div>

      {/* Lot & Expiry */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b-[0.5px] border-[var(--color-border-tertiary)]">
        <div className="flex-1">
          <div className="text-[9px] text-[var(--color-text-tertiary)] mb-[2px]">
            Lot number
          </div>
          <div className="text-[10px] font-medium font-[family-name:var(--font-plus-jakarta)]">
            {reagent.lotNumber}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-[9px] text-[var(--color-text-tertiary)] mb-[2px]">
            Expiry
          </div>
          <div className="text-[10px] font-medium font-[family-name:var(--font-plus-jakarta)]">
            {reagent.expiry}
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="flex gap-2 mb-3">
        <button className="flex-1 text-[10px] px-2 py-[6px] border-[0.5px] border-[var(--color-border-secondary)] rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-background-tertiary)] font-[family-name:var(--font-plus-jakarta)]">
          📄 MSDS
        </button>
        <button className="flex-1 text-[10px] px-2 py-[6px] border-[0.5px] border-[var(--color-border-secondary)] rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-background-tertiary)] font-[family-name:var(--font-plus-jakarta)]">
          📋 CoA
        </button>
      </div>

      {/* Price & Actions */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[16px] font-bold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
            ৳{reagent.price.toLocaleString()}
          </div>
          {reagent.oldPrice && (
            <div className="text-[11px] text-[var(--color-text-tertiary)] line-through">
              ৳{reagent.oldPrice.toLocaleString()}
            </div>
          )}
        </div>
        <button className="px-4 py-[7px] bg-[#0B2545] text-white rounded-lg text-[11px] font-semibold hover:bg-[#0d2d52] font-[family-name:var(--font-plus-jakarta)]">
          Add to cart
        </button>
      </div>

      {/* Stock Status */}
      {reagent.lowStock ? (
        <div className="mt-2 text-[10px] text-[#F59E0B] flex items-center gap-1">
          ⚠ Low stock
        </div>
      ) : reagent.inStock ? (
        <div className="mt-2 text-[10px] text-[#0E8A6E] flex items-center gap-1">
          ✓ In stock
        </div>
      ) : (
        <div className="mt-2 text-[10px] text-[var(--color-text-tertiary)] flex items-center gap-1">
          Out of stock
        </div>
      )}
    </div>
  );
}
