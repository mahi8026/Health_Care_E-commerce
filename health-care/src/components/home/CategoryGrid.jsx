'use client';

import Link from 'next/link';
import { 
  FaStethoscope, 
  FaSyringe, 
  FaFlask, 
  FaHospital, 
  FaMicroscope, 
  FaShieldAlt, 
  FaTooth, 
  FaBone,
} from 'react-icons/fa';
import { CATEGORY_NAME_TO_SLUG } from '@/constants/categories';

/**
 * CategoryGrid Component
 * 
 * Displays a grid of product categories with icons, descriptions, and product counts.
 * Each category links to its filtered products page.
 * 
 * @param {Array} categories - Array of category objects from API
 * @param {Object} categoryCounts - Object mapping category names to product counts
 */
export default function CategoryGrid({ categories, categoryCounts }) {
  // Always use API categories if available, only use fallback if API returns empty
  const displayCategories = (categories && categories.length > 0) 
    ? categories.filter(cat => cat.isActive !== false) // Filter out inactive categories
    : FALLBACK_CATEGORIES;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-[var(--color-text-primary)] mb-3">
            Shop by Category
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Browse our comprehensive range of medical equipment and supplies across multiple categories
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {displayCategories.map((cat) => {
            const categoryName = cat.name || cat._id;
            const slug = CATEGORY_NAME_TO_SLUG[categoryName];
            const count = categoryCounts?.[categoryName] || 0;

            return (
              <Link
                key={categoryName}
                href={slug ? `/products/category/${slug}` : `/products?category=${encodeURIComponent(categoryName)}`}
                className="group bg-white rounded-2xl p-6 border-2 border-[var(--color-border-tertiary)] hover:border-brand-teal hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center"
              >
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl text-brand-teal group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: cat.color || 'var(--color-status-success-tint)' }}
                >
                  {getCategoryIcon(categoryName)}
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2 text-sm md:text-base">
                  {categoryName}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                  {cat.description || cat.desc || 'Medical equipment'}
                </p>
                {count > 0 && (
                  <span className="text-xs text-brand-teal font-medium">
                    {count} products
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * Get icon component for category
 */
function getCategoryIcon(categoryName) {
  const iconMap = {
    'Diagnostic Equipment': <FaStethoscope />,
    'Surgical Instruments': <FaSyringe />,
    'Laboratory Reagents': <FaFlask />,
    'Hospital Machines': <FaHospital />,
    'Lab Equipment': <FaMicroscope />,
    'PPE & Safety': <FaShieldAlt />,
    'Dental Equipment': <FaTooth />,
    'Implants & Ortho': <FaBone />,
  };
  return iconMap[categoryName] || <FaStethoscope />;
}

/**
 * Fallback categories if API fails
 */
const FALLBACK_CATEGORIES = [
  { name: 'Diagnostic Equipment', desc: 'ECG · Ultrasound · Monitors', color: 'var(--color-status-info-tint)' },
  { name: 'Surgical Instruments', desc: 'Instruments · Implants', color: 'var(--color-status-success-tint)' },
  { name: 'Laboratory Reagents', desc: 'Clinical · Molecular', color: '#FAF5FF' },
  { name: 'Hospital Machines', desc: 'ICU · Ventilators · Dialysis', color: 'var(--color-status-warning-tint)' },
  { name: 'Lab Equipment', desc: 'Centrifuges · Microscopes', color: 'var(--color-status-success-tint)' },
  { name: 'PPE & Safety', desc: 'Masks · Gloves · Gowns', color: 'var(--color-status-danger-tint)' },
  { name: 'Dental Equipment', desc: 'Chairs · Drills', color: 'var(--color-status-warning-tint)' },
  { name: 'Implants & Ortho', desc: 'Bone Plates · Screws', color: 'var(--color-background-secondary)' },
];
