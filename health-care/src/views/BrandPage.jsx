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
import { FaGlobe, FaMapMarkerAlt, FaShieldAlt, FaFileInvoiceDollar, FaWhatsapp, FaCheckCircle } from 'react-icons/fa';

export default function BrandPage({ brand, initialProducts = [] }) {
  const router = useRouter();
  const [products] = useState(initialProducts);

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
    <div className="min-h-screen bg-[#F5F8FB]">
      {/* ── Hero banner ──────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg, #001D5D 0%, #002B78 55%, #18AFA9 100%)' }}
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute bottom-0 -left-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Brands', href: '/brands' },
              { label: brandName },
            ]}
            className="mb-6 text-white/60 [&_a]:text-white/60 [&_a:hover]:text-teal-300 [&_span]:text-white/40"
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 md:gap-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              {brandLogo ? (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white border border-white/20 shadow-xl flex items-center justify-center p-2.5">
                  <Image
                    src={brandLogo}
                    alt={`${brandName} logo`}
                    width={80}
                    height={80}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-4xl">
                  🏥
                </div>
              )}
            </div>

            {/* Brand info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-400/15 border border-teal-400/25 px-2.5 py-0.5 text-[10px] font-semibold text-teal-300 uppercase tracking-wider">
                  <FaCheckCircle size={8} /> DGDA Registered
                </span>
                {brand?.country && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-[10px] font-semibold text-white/70">
                    <FaMapMarkerAlt size={8} className="text-teal-400" /> {brand.country}
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 leading-tight">
                {brandName} Products in Bangladesh
              </h1>
              <p className="text-sm text-white/60 mb-4 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <FaShieldAlt className="text-teal-400" />
                  {productCount} DGDA-registered products
                </span>
                {website && (
                  <a
                    href={website.startsWith('http') ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-teal-300 transition-colors"
                  >
                    <FaGlobe className="text-teal-400" />
                    {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                )}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push('/quotes/request')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#001D5D] text-sm font-bold hover:bg-[#F5F8FB] transition-colors shadow-md"
                >
                  <FaFileInvoiceDollar size={14} className="text-[#18AFA9]" />
                  Request Bulk Quote
                </button>
                <a
                  href={`https://wa.me/${CONTACT.whatsapp}?text=${waMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366]/20 border border-[#25D366]/30 text-white text-sm font-semibold hover:bg-[#25D366]/30 transition-colors"
                >
                  <FaWhatsapp size={14} className="text-[#4ade80]" />
                  Ask on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        {/* Brand description */}
        {brand?.description && (
          <div className="mb-6 rounded-2xl bg-white border border-[#D9E4EC] p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-2">About {brandName}</h2>
            <p className="text-sm text-[#475569] leading-relaxed">{brand.description}</p>
          </div>
        )}

        {/* Trust badges */}
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '✅', label: 'DGDA Registered', sub: 'All products certified' },
            { icon: '🛡️', label: 'Genuine Products', sub: 'Manufacturer warranty' },
            { icon: '🚚', label: 'Fast Delivery', sub: 'Nationwide shipping' },
            { icon: '🔧', label: 'Free Installation', sub: 'Dhaka metro area' },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="rounded-xl bg-white border border-[#D9E4EC] p-3 flex items-start gap-2.5">
              <span className="text-xl flex-shrink-0">{icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#001D5D] leading-snug">{label}</p>
                <p className="text-[10px] text-tertiary mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">Available in</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => {
                const slug = CATEGORY_NAME_TO_SLUG[cat];
                return slug ? (
                  <Link
                    key={cat}
                    href={`/products/category/${slug}`}
                    className="text-xs font-medium text-[#18AFA9] border border-[#18AFA9]/30 rounded-full px-3.5 py-1.5 hover:bg-[#18AFA9] hover:text-white transition-colors"
                  >
                    {cat}
                  </Link>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Product grid */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#001D5D]">
                {brandName} Products
              </h2>
              <p className="text-xs text-tertiary mt-0.5">
                Genuine {brandName} equipment — DGDA registered, warranty included
              </p>
            </div>
            {products.length > 0 && (
              <span className="text-xs text-tertiary bg-[#f1f5f9] px-2.5 py-1 rounded-full">
                {products.length} items
              </span>
            )}
          </div>

          {products.length === 0 ? (
            <EmptyState
              icon="📦"
              title={`No ${brandName} products listed yet`}
              description="Please check back soon or contact us for availability and pricing."
              action={{ label: 'Request a Quote', onClick: () => router.push('/quotes/request') }}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {products.map(product => (
                <ProductCard key={product._id || product.id} product={product} showCategory />
              ))}
            </div>
          )}
        </section>

        {/* Bottom CTA */}
        <div className="mt-10 rounded-2xl text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-8"
          style={{ background: 'linear-gradient(135deg, #001D5D 0%, #002B78 60%, #18AFA9 100%)' }}>
          <div className="flex-1">
            <h2 className="text-base md:text-lg font-bold mb-1">
              Need {brandName} products for your facility?
            </h2>
            <p className="text-sm text-white/60">
              Our B2B team provides institutional pricing, credit terms, and tender support across Bangladesh.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <button
              onClick={() => router.push('/quotes/request')}
              className="px-5 py-2.5 rounded-xl bg-[#18AFA9] text-white text-sm font-bold hover:bg-[#007F7B] transition-colors"
            >
              Request a Quote
            </button>
            <Link
              href="/b2b"
              className="px-5 py-2.5 rounded-xl border border-white/30 text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              B2B Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
