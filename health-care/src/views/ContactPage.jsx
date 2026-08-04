'use client';

import { FaPhone, FaEnvelope, FaWhatsapp, FaMapMarkerAlt, FaClock, FaIndustry, FaPaperPlane } from 'react-icons/fa';
import { CONTACT } from '@/constants/api';
import { SITE_CONFIG } from '@/config/seo';

const CHANNELS = [
  {
    icon: <FaPhone className="text-xl" />,
    label: 'Call Us',
    value: CONTACT.phone,
    sub: 'Sun â€“ Thu, 9 AM â€“ 6 PM',
    href: `tel:${CONTACT.phone.replace(/[\s\-]/g, '')}`,
    color: 'bg-blue-50 text-blue-600',
    cta: 'Call Now',
  },
  {
    icon: <FaWhatsapp className="text-xl" />,
    label: 'WhatsApp',
    value: CONTACT.phone,
    sub: 'Quick replies during business hours',
    href: `https://wa.me/${CONTACT.whatsapp}`,
    color: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]',
    cta: 'Chat on WhatsApp',
  },
  {
    icon: <FaEnvelope className="text-xl" />,
    label: 'Email',
    value: CONTACT.supportEmail,
    sub: 'Response within 24 hours',
    href: `mailto:${CONTACT.supportEmail}`,
    color: 'bg-purple-50 text-purple-600',
    cta: 'Send Email',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-page">
      {/* Hero */}
      <section className="bg-brand-navy text-white py-8 md:py-10 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1 rounded-full mb-4">
            <FaPaperPlane className="text-brand-teal-light" />
            Contact Us
          </div>
          <h1 className="text-xl md:text-2xl font-semibold mb-2">We are here to help</h1>
          <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
            Questions about a product, an order, or a B2B partnership? Reach our team directly â€” we typically respond within one business day.
          </p>
        </div>
      </section>

      {/* Contact Channels */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Get in Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CHANNELS.map((opt) => (
              <div
                key={opt.label}
                className="bg-white rounded-2xl border border-[var(--color-border-tertiary)] shadow-sm p-6 flex flex-col gap-4"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${opt.color}`}>
                  {opt.icon}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[var(--color-text-secondary)] mb-0.5">{opt.label}</p>
                  <p className="font-semibold text-[var(--color-text-primary)] text-sm">{opt.value}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{opt.sub}</p>
                </div>
                <a
                  href={opt.href}
                  target={opt.href.startsWith('http') ? '_blank' : undefined}
                  rel={opt.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="block text-center text-sm font-semibold text-brand-navy bg-[var(--color-background-secondary)] hover:bg-[var(--color-background-tertiary)] transition-colors rounded-xl py-2.5"
                >
                  {opt.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showroom & Hours */}
      <section className="py-4 px-4 pb-16">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[var(--color-border-tertiary)] shadow-sm p-6 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-teal-tint text-brand-teal">
                <FaMapMarkerAlt className="text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)] text-sm mb-1">Showroom &amp; Warehouse</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {SITE_CONFIG.address.street}
                  <br />
                  {SITE_CONFIG.address.city} {SITE_CONFIG.address.postalCode}, {SITE_CONFIG.address.country}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[var(--color-border-tertiary)] shadow-sm p-6 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                <FaClock className="text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)] text-sm mb-1">Business Hours</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Saturday â€“ Thursday: 9:00 AM â€“ 6:00 PM
                  <br />
                  Friday: Closed
                </p>
              </div>
            </div>
          </div>

          {/* B2B CTA */}
          <div className="mt-6 bg-brand-navy rounded-2xl p-5 text-white text-center">
            <FaIndustry className="text-2xl text-brand-teal-light mx-auto mb-2" />
            <h3 className="font-semibold text-lg mb-2">Looking for institutional pricing?</h3>
            <p className="text-white/70 text-sm mb-5">
              Hospitals, clinics, and diagnostic centres â€” request bulk pricing and credit terms through the B2B portal.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href="/b2b"
                className="inline-block bg-brand-teal text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[var(--color-brand-teal-hover)] transition-colors"
              >
                Visit B2B Portal
              </a>
              <a
                href={`mailto:${CONTACT.supportEmail}?subject=B2B%20Partnership%20Inquiry`}
                className="inline-block bg-white text-brand-navy font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[var(--color-background-tertiary)] transition-colors"
              >
                Email B2B Team
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
