'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { FaShieldAlt, FaTruck, FaCheckCircle, FaWrench } from 'react-icons/fa';
import { CATEGORY_NAME_TO_SLUG } from '@/constants/categories';

/**
 * Renders a rich, data-driven SEO content block for a product page.
 * Mirrors the JSON-LD FAQPage/Product schema emitted server-side so the
 * visible content matches what Google can surface as rich results.
 */
export default function ProductSeoContent({ product }) {
  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;
  const categorySlug = categoryName ? CATEGORY_NAME_TO_SLUG[categoryName] : null;

  const specs = useMemo(() => {
    const specMap = product.specifications || {};
    if (typeof specMap === 'object' && !Array.isArray(specMap) && Object.keys(specMap).length > 0) {
      return Object.entries(specMap).slice(0, 12);
    }
    return [];
  }, [product.specifications]);

  const certifications = Array.isArray(product.certifications) ? product.certifications : [];

  const applications = Array.isArray(product.tags) ? product.tags.slice(0, 8) : [];

  const compatibleWith = Array.isArray(product.compatibleWith) ? product.compatibleWith.slice(0, 8) : [];

  const priceStr = product.price && product.price > 0 ? `৳${Number(product.price).toLocaleString()}` : 'Contact for Price';

  const faqs = [
    {
      q: `Is this ${product.name} genuine and DGDA registered?`,
      a: `Yes. MediportBD is an authorised distributor${brandName ? ` of ${brandName}` : ''} in Bangladesh. All products are DGDA registered and CE certified, with full documentation available for hospital procurement and tenders.`,
    },
    {
      q: `What is the warranty on this product?`,
      a: `This product comes with full manufacturer warranty, typically 1–3 years depending on the equipment type. Extended warranty and annual maintenance contracts (AMC) are available for most items.`,
    },
    {
      q: `How much does ${product.name} cost in Bangladesh?`,
      a: `The retail price of ${product.name} in Bangladesh is ${priceStr}. B2B buyers (hospitals, clinics, diagnostic centres) receive 8–30% bulk discount depending on order volume and credit terms.`,
    },
    {
      q: `Do you provide installation and training?`,
      a: 'Yes, installation and staff training are included for diagnostic and hospital equipment in Dhaka metro. For other regions, installation is available at nominal charges.',
    },
    {
      q: 'What is the delivery time across Bangladesh?',
      a: 'Delivery within Dhaka takes 1–2 business days, and 3–5 business days for other cities. Cold-chain and temperature-controlled delivery is available for reagents and temperature-sensitive items.',
    },
  ];

  const certificationList = certifications.length > 0 ? certifications : ['DGDA Registered', 'CE Certified'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border-tertiary)] p-4 sm:p-6 mt-5">
      <h2 className="text-base font-semibold text-brand-navy mb-3">
        About {product.name} in Bangladesh
      </h2>

      {product.description && (
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
          {product.description}
        </p>
      )}

      {/* Key specifications */}
      {specs.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-brand-navy mb-2">Key Specifications</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {specs.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 py-1 border-b border-[var(--color-border-tertiary)]/60">
                <dt className="text-[var(--color-text-secondary)] capitalize">{key.replace(/[_-]/g, ' ')}</dt>
                <dd className="font-medium text-[var(--color-text-primary)] text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Certifications */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-brand-navy mb-2">Certifications & Compliance</h3>
        <div className="flex flex-wrap gap-2">
          {certificationList.map(cert => (
            <span
              key={cert}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-[var(--color-status-success-tint)] text-[var(--color-status-success)] border border-[var(--color-status-success-tint)]"
            >
              <FaShieldAlt size={11} /> {cert}
            </span>
          ))}
        </div>
      </div>

      {/* Applications */}
      {applications.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-brand-navy mb-2">Common Uses</h3>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {applications.map(tag => tag.charAt(0).toUpperCase() + tag.slice(1)).join(', ')}.
          </p>
        </div>
      )}

      {/* Compatible accessories */}
      {compatibleWith.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-brand-navy mb-2">Compatible Accessories & Consumables</h3>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {compatibleWith.join(', ')}.
          </p>
        </div>
      )}

      {/* Delivery & support */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-brand-navy mb-2">Delivery, Installation & Support</h3>
        <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <li className="flex items-start gap-2">
            <FaTruck className="text-brand-teal mt-0.5 flex-shrink-0" size={13} />
            <span>Free delivery in Dhaka for orders over ৳50,000; nationwide shipping to all major cities.</span>
          </li>
          <li className="flex items-start gap-2">
            <FaWrench className="text-brand-teal mt-0.5 flex-shrink-0" size={13} />
            <span>Installation and operator training included for diagnostic and hospital equipment in Dhaka metro.</span>
          </li>
          <li className="flex items-start gap-2">
            <FaCheckCircle className="text-brand-teal mt-0.5 flex-shrink-0" size={13} />
            <span>24/7 technical support and AMC contracts available for institutional clients.</span>
          </li>
        </ul>
      </div>

      {categorySlug && (
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
          Browse the full {categoryName} collection for more options, or compare prices across brands before you buy.
        </p>
      )}

      {/* Visible FAQ — matches the FAQPage JSON-LD on this page */}
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-brand-navy mb-2">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {faqs.map(faq => (
            <details key={faq.q} className="group rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-background-secondary)]/50 px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-[var(--color-text-primary)] list-none flex items-center justify-between gap-2">
                <span>{faq.q}</span>
                <span className="text-brand-teal group-open:rotate-45 transition-transform" aria-hidden="true">+</span>
              </summary>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      {categorySlug && (
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link
            href={`/products/category/${categorySlug}`}
            className="font-semibold text-brand-teal hover:underline"
          >
            View more {categoryName} →
          </Link>
          <Link
            href="/brands"
            className="text-[var(--color-text-secondary)] hover:text-brand-teal hover:underline transition-colors"
          >
            Browse by Brand
          </Link>
          <Link
            href="/topics"
            className="text-[var(--color-text-secondary)] hover:text-brand-teal hover:underline transition-colors"
          >
            Topic Guides
          </Link>
          <Link
            href="/equipment"
            className="text-[var(--color-text-secondary)] hover:text-brand-teal hover:underline transition-colors"
          >
            Price Guides
          </Link>
          <Link
            href="/b2b"
            className="text-[var(--color-text-secondary)] hover:text-brand-teal hover:underline transition-colors"
          >
            B2B Pricing
          </Link>
        </div>
      )}
    </div>
  );
}