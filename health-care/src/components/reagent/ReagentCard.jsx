'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import Toast from '@/components/ui/Toast';
import { getProductBrandName, getProductCategoryName } from '@/utils/helpers';
import { FaShoppingCart } from 'react-icons/fa';

function resolveTemperature(reagent) {
  const raw = reagent.temperature || reagent.storageTemp;
  if (raw === 'frozen' || raw === 'freeze') return 'freeze';
  if (raw === 'cold') return 'cold';
  return 'room';
}

function resolveHazard(reagent) {
  const raw = reagent.hazard || reagent.hazardClass;
  if (raw === 'bio' || raw === 'biohazard') return 'bio';
  if (raw === 'chem' || raw === 'chemical') return 'chem';
  return 'safe';
}

const TEMP_STYLES = {
  cold: 'bg-[#E6F1FB] text-[#0C447C]',
  freeze: 'bg-[#EEEDFE] text-[#3C3489]',
  room: 'bg-[#E1F5EE] text-[#085041]',
};

const HAZARD_STYLES = {
  bio: 'bg-[#FCEBEB] text-[#791F1F]',
  chem: 'bg-[#FAEEDA] text-[#633806]',
  safe: 'bg-[#E1F5EE] text-[#085041]',
};

function formatExpiry(reagent) {
  const d = reagent.expiryDate || reagent.expiry;
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('en-BD', { month: 'short', year: 'numeric' });
  } catch {
    return null;
  }
}

export default function ReagentCard({ reagent, onProductClick }) {
  const { addToCart } = useCart();
  const [showToast, setShowToast] = useState(false);

  const brandName = getProductBrandName(reagent);
  const categoryName = getProductCategoryName(reagent);
  const showCategory = categoryName && categoryName !== 'Laboratory Reagents';
  const temp = resolveTemperature(reagent);
  const hazard = resolveHazard(reagent);
  const expiry = formatExpiry(reagent);
  const sku = reagent.lotNumber || reagent.sku;
  const inStock = reagent.stock === undefined ? reagent.inStock !== false : reagent.stock > 0;
  const price = reagent.price ?? 0;

  const primaryImage = useMemo(() => {
    const img = reagent.images?.find((i) => typeof i === 'object' && i.isPrimary) || reagent.images?.[0];
    if (!img) return null;
    return typeof img === 'string' ? img : img.url;
  }, [reagent.images]);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart({
      ...reagent,
      id: reagent._id || reagent.id,
      name: reagent.name,
      price: reagent.price,
      brand: brandName,
      category: categoryName || 'Laboratory Reagents',
    }, 1);
    setShowToast(true);
  };

  const handleCardClick = () => {
    if (onProductClick) onProductClick(reagent._id || reagent.id);
  };

  return (
    <article
      onClick={handleCardClick}
      className="group flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[#0E8A6E]/40 hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative aspect-[5/4] bg-gradient-to-br from-[#F0FBF8] via-white to-[#E6F1FB] flex items-center justify-center overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={`${reagent.name}${brandName ? ` — ${brandName}` : ''} — Bangladesh`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
            className="object-contain p-4 group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <span className="text-4xl opacity-40" aria-hidden>🧪</span>
        )}
        {reagent.badge && (
          <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0B2545] text-white">
            {reagent.badge === 'sale' ? 'Sale' : 'New'}
          </span>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${TEMP_STYLES[temp]}`}>
            {temp === 'cold' ? '2–8°C' : temp === 'freeze' ? '−20°C' : 'Room'}
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4">
        <p className="text-[11px] font-semibold text-[#0E8A6E] uppercase tracking-wide truncate">
          {brandName || 'Reagent'}
        </p>

        <h3 className="mt-1 text-[14px] font-semibold text-[#0B2545] leading-snug line-clamp-2 min-h-[2.75rem] font-[family-name:var(--font-plus-jakarta)]">
          {reagent.name}
        </h3>

        {showCategory && (
          <p className="mt-1 text-[11px] text-[#6B7280] truncate">{categoryName}</p>
        )}

        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${HAZARD_STYLES[hazard]}`}>
            {hazard === 'bio' ? 'Biohazard' : hazard === 'chem' ? 'Chemical' : 'Safe'}
          </span>
          {sku && (
            <span className="text-[10px] text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-full font-mono truncate max-w-full">
              {sku.length > 22 ? `${sku.slice(0, 20)}…` : sku}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4 flex items-end justify-between gap-3 border-t border-gray-50">
          <div>
            <p className="text-[17px] font-bold text-[#0B2545] leading-none">
              {price > 0 ? `৳${price.toLocaleString()}` : 'Quote'}
            </p>
            {reagent.oldPrice > price && (
              <p className="text-[11px] text-[#9CA3AF] line-through mt-0.5">
                ৳{reagent.oldPrice.toLocaleString()}
              </p>
            )}
            <p className={`text-[10px] mt-1 font-medium ${inStock ? 'text-[#0E8A6E]' : 'text-[#9CA3AF]'}`}>
              {inStock
                ? reagent.stock <= 5 && reagent.stock > 0
                  ? `Low stock (${reagent.stock})`
                  : 'In stock'
                : 'Out of stock'}
              {expiry ? ` · Exp ${expiry}` : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#0B2545] text-white rounded-lg text-[12px] font-semibold hover:bg-[#0d2d52] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            aria-label={`Add ${reagent.name} to cart`}
          >
            <FaShoppingCart size={12} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>

      {showToast && (
        <Toast
          message={`${reagent.name} added to cart`}
          type="success"
          duration={2000}
          onClose={() => setShowToast(false)}
        />
      )}
    </article>
  );
}
