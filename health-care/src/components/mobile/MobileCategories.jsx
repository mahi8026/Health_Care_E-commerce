'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/constants/api';

// Icon map for known category names — fallback to 🏥
const CATEGORY_ICONS = {
  'Diagnostic Equipment': '🩺',
  'Surgical Instruments': '💉',
  'Laboratory Reagents': '🧪',
  'Hospital Machines': '🏥',
  'Lab Equipment': '🔬',
  'PPE & Safety': '🦺',
  'Dental Equipment': '🦷',
  'Implants & Ortho': '🦴',
};

export default function MobileCategories() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/categories`)
      .then((r) => r.json())
      .then((data) => {
        const list = data.data?.categories || data.categories || [];
        setCategories(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const skeletons = [1, 2, 3, 4, 5, 6];

  return (
    <div className="px-4 py-4 bg-white">
      <div className="text-[12px] font-semibold mb-3 font-[family-name:var(--font-plus-jakarta)]">
        Categories
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {loading
          ? skeletons.map((i) => (
              <div
                key={i}
                className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 bg-gray-100 rounded-lg min-w-[70px] animate-pulse"
              >
                <div className="w-5 h-5 bg-gray-200 rounded" />
                <div className="w-10 h-2.5 bg-gray-200 rounded mt-1" />
              </div>
            ))
          : categories.map((cat) => {
              const name = typeof cat === 'string' ? cat : cat.name;
              const icon = CATEGORY_ICONS[name] || '🏥';
              const shortName = name.split(' ')[0]; // e.g. "Diagnostic" from "Diagnostic Equipment"
              return (
                <button
                  key={name}
                  onClick={() =>
                    router.push(`/products?category=${encodeURIComponent(name)}`)
                  }
                  className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 bg-[var(--color-background-tertiary)] rounded-lg hover:bg-[#F0FBF8] hover:border-[#0E8A6E] border border-transparent transition-colors min-w-[70px]"
                  aria-label={name}
                >
                  <span className="text-[20px]">{icon}</span>
                  <span className="text-[10px] font-medium font-[family-name:var(--font-plus-jakarta)] text-center leading-tight">
                    {shortName}
                  </span>
                </button>
              );
            })}
      </div>
    </div>
  );
}
