'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { showToast } from '@/components/ui/Toast';
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
  cold: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
  freeze: 'bg-[#EEEDFE] text-[#3C3489]',
  room: 'bg-brand-teal-tint text-[var(--color-status-success)]',
};

const HAZARD_STYLES = {
  bio: 'bg-[#FCEBEB] text-[var(--color-status-danger)]',
  chem: 'bg-[#FAEEDA] text-[var(--color-status-warning)]',
  safe: 'bg-brand-teal-tint text-[var(--color-status-success)]',
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
    // Toast is shown automatically by CartContext
  };

  const handleCardClick = () => {
    if (onProductClick) onProductClick(reagent._id || reagent.id);
  };

  return (
    <article
      onClick={handleCardClick}
      className="group flex flex-col bg-white rounded-xl border border-[var(--color-border-tertiary)] overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-brand-teal/40 hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-[#F0FBF8] via-white to-[#E6F1FB] flex items-center justify-center overflow-hidden">
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
          <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-md bg-brand-navy text-white">
            {reagent.badge === 'sale' ? 'Sale' : 'New'}
          </span>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${TEMP_STYLES[temp]}`}>
            {temp === 'cold' ? '2–8°C' : temp === 'freeze' ? '−20°C' : 'Room'}
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4">
        <p className="text-xs font-semibold text-brand-teal uppercase tracking-wide truncate">
          {brandName || 'Reagent'}
        </p>

        <h3 className="mt-1 text-sm font-semibold text-brand-navy leading-snug line-clamp-2 min-h-[2.75rem] font-[family-name:var(--font-plus-jakarta)]">
          {reagent.name}
        </h3>

        {showCategory && (
          <p className="mt-1 text-xs text-text-secondary truncate">{categoryName}</p>
        )}

        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${HAZARD_STYLES[hazard]}`}>
            {hazard === 'bio' ? 'Biohazard' : hazard === 'chem' ? 'Chemical' : 'Safe'}
          </span>
          {sku && (
            <span className="text-xs text-text-secondary bg-background-tertiary px-2 py-0.5 rounded-full font-mono truncate max-w-full">
              {sku.length > 22 ? `${sku.slice(0, 20)}…` : sku}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4 flex items-end justify-between gap-3 border-t border-[var(--color-border-tertiary)]">
          <div>
            <p className="text-lg font-semibold text-brand-navy leading-none">
              {price > 0 ? `৳${price.toLocaleString()}` : 'Quote'}
            </p>
            {reagent.oldPrice > price && (
              <p className="text-xs text-text-tertiary line-through mt-0.5">
                ৳{reagent.oldPrice.toLocaleString()}
              </p>
            )}
            <p className={`text-xs mt-1 font-medium ${inStock ? 'text-brand-teal' : 'text-text-tertiary'}`}>
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
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-brand-navy text-white rounded-lg text-xs font-semibold hover:bg-[var(--color-brand-navy-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            aria-label={`Add ${reagent.name} to cart`}
          >
            <FaShoppingCart size={12} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </article>
  );
}
