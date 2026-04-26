export default function ProductCard({ product }) {
  // Compute primary image from product.images array - handle both old and new formats
  const imageData = product.images?.find(img => typeof img === 'object' && img.isPrimary) || product.images?.[0];
  const primaryImage = imageData ? {
    url: typeof imageData === 'string' ? imageData : imageData.url,
    alt: typeof imageData === 'object' ? imageData.alt : product.name
  } : null;

  return (
    <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[10px] overflow-hidden flex flex-col">
      <div className="h-[130px] bg-[var(--color-background-secondary)] flex items-center justify-center relative flex-shrink-0 overflow-hidden">
        {primaryImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }
              }}
            />
            {/* Fallback shown when image fails to load */}
            <div className="hidden absolute inset-0 items-center justify-center text-[40px] text-[#9CA3AF] bg-[#F3F4F6]">
              🏥
            </div>
          </>
        ) : (
          /* Fallback shown when no image exists */
          <div className="flex items-center justify-center w-full h-full text-[40px] text-[#9CA3AF] bg-[#F3F4F6]">
            🏥
          </div>
        )}
        
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.badges?.map((badge, idx) => (
            <span key={idx} className={`text-[9px] px-[7px] py-[3px] rounded font-medium ${badge.className}`}>
              {badge.text}
            </span>
          ))}
        </div>
        <button className="absolute top-2 right-2 w-[26px] h-[26px] rounded-full bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] flex items-center justify-center cursor-pointer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        </button>
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <div className="text-[9px] text-[#0E8A6E] font-medium uppercase tracking-[0.5px] mb-[3px]">{product.brand}</div>
        <div className="text-[12px] font-medium leading-[1.35] text-[var(--color-text-primary)] mb-[6px] flex-1">{product.name}</div>
        <div className="flex items-center gap-1 mb-2">
          <div className="flex gap-[1px]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-[10px] h-[10px] ${i < product.rating ? 'bg-[#F59E0B]' : 'bg-[var(--color-border-secondary)]'}`} style={{ clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' }}></div>
            ))}
          </div>
          <span className="text-[10px] text-[var(--color-text-secondary)]">({product.reviews})</span>
        </div>
        <div className="flex items-baseline gap-[6px] mb-[10px]">
          <span className="font-[family-name:var(--font-lora)] text-[16px] text-[#0B2545] font-semibold">{product.price}</span>
          {product.oldPrice && <span className="text-[11px] text-[var(--color-text-secondary)] line-through">{product.oldPrice}</span>}
          {product.discount && <span className="text-[10px] text-[#0E8A6E] font-medium">{product.discount}</span>}
        </div>
        <div className="flex items-center gap-[5px] mb-[10px]">
          <div className="w-[6px] h-[6px] rounded-full bg-[#639922] flex-shrink-0"></div>
          <span className="text-[10px] text-[var(--color-text-secondary)]">{product.stock}</span>
        </div>
        <div className="grid grid-cols-2 gap-[6px]">
          <button className="bg-[#0B2545] text-white border-none px-2 py-2 rounded-[7px] text-[11px] font-medium cursor-pointer font-[family-name:var(--font-plus-jakarta)]">{product.button1}</button>
          <button className="bg-transparent text-[#0B2545] border-[0.5px] border-[#0B2545] px-2 py-2 rounded-[7px] text-[11px] cursor-pointer font-[family-name:var(--font-plus-jakarta)]">{product.button2}</button>
        </div>
      </div>
    </div>
  );
}
