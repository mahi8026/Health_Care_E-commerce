'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import { CATEGORY_NAME_TO_SLUG } from '@/constants/categories';
import { CONTACT } from '@/constants/api';
import { FaGlobe, FaMapMarkerAlt, FaShieldAlt, FaFileInvoiceDollar, FaWhatsapp } from 'react-icons/fa';

export default function BrandPage({ brand, initialProducts = [] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);

  const brandName = brand?.name || 'Medical Brand';
  const productCount = brand?.productCount ?? products.length;

  const categories = [...new Set(
    products
      .map(p => (typeof p.category === 'object' ? p.category?.name : p.category))
      .filter(Boolean)
  )];

  const waMsg = encodeURIComponent(
    `Hi MediportBD, I'd like to know more about ${brandName} products and pricing.`
  );

  const brandLogo = brand?.logo?.url;
  const website = brand?.website;

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Brands', href: '/brands' },
            { label: brandName },
          ]}
        />

        {/* Hero */}
        <section className="mt-4 bg-white rounded-2xl border border-[var(--color-border-primary)] overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-brand-navy via-brand-teal to-brand-teal-light" />
          <div className="p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {brandLogo ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-[var(--color-border-primary)] bg-white p-2 flex items-center justify-center flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={brandLogo}
                    alt={`${brandName} logo`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[var(--color-background-secondary)] flex items-center justify-center text-3xl flex-shrink-0">
                  🏥
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-brand-navy font-[family-name:var(--font-lora)]">
                  {brandName} Products in Bangladesh
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-[var(--color-text-secondary)]">
                  {brand?.country && (
                    <span className="inline-flex items-center gap-1.5">
                      <FaMapMarkerAlt className="text-brand-teal" /> {brand.country}
                    </span>
                  )}
                  {website && (
                    <a
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-brand-teal"
                    >
                      <FaGlobe className="text-brand-teal" /> {website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <FaShieldAlt className="text-[var(--color-status-success)]" /> {productCount} products
                  </span>
                </div>
              </div>
            </div>

            {brand?.description && (
              <p className="mt-4 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
                {brand.description}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => router.push(`/quotes/request`)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-navy hover:bg-[var(--color-brand-navy-hover)] text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <FaFileInvoiceDollar /> Request Bulk Quote
              </button>
              <a
                href={`https://wa.me/${CONTACT.whatsapp}?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--color-status-success-tint)] hover:bg-[var(--color-status-success)] hover:text-white text-[var(--color-status-success)] border border-[var(--color-status-success-tint)] rounded-xl text-sm font-semibold transition-colors"
              >
                <FaWhatsapp /> Ask on WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Category chips — internal linking */}
        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map(cat => {
              const slug = CATEGORY_NAME_TO_SLUG[cat];
              return slug ? (
                <Link
                  key={cat}
                  href={`/products/category/${slug}`}
                  className="text-xs font-medium text-brand-teal border border-brand-teal/40 rounded-full px-3.5 py-1.5 hover:bg-brand-teal hover:text-white transition-colors"
                >
                  {cat}
                </Link>
              ) : null;
            })}
          </div>
        )}

        {/* Product grid */}
        <section className="mt-8">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-brand-navy">
                {brandName} Products
              </h2>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                Genuine {brandName} equipment with DGDA registration, warranty and nationwide delivery
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon="📦"
              title={`No ${brandName} products listed yet`}
              description="Please check back soon or contact us for availability and pricing."
              action={{
                label: 'Request a Quote',
                onClick: () => router.push('/quotes/request'),
              }}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {products.map(product => (
                <ProductCard key={product._id || product.id} product={product} showCategory />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}