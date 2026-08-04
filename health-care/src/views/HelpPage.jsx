'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FaPhone,
  FaEnvelope,
  FaWhatsapp,
  FaChevronDown,
  FaChevronUp,
  FaTruck,
  FaBoxOpen,
  FaCreditCard,
  FaUndo,
  FaUserCircle,
  FaHeadset,
} from 'react-icons/fa';

const CONTACT_OPTIONS = [
  {
    icon: <FaPhone className="text-xl" />,
    label: 'Call Us',
    value: '+880 1646-886795',
    sub: 'Sun â€“ Thu, 9 AM â€“ 6 PM',
    href: 'tel:+8801646886795',
    color: 'bg-blue-50 text-blue-600',
    cta: 'Call Now',
  },
  {
    icon: <FaWhatsapp className="text-xl" />,
    label: 'WhatsApp',
    value: '+880 1646-886795',
    sub: 'Quick replies during business hours',
    href: 'https://wa.me/8801646886795',
    color: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]',
    cta: 'Chat on WhatsApp',
  },
  {
    icon: <FaEnvelope className="text-xl" />,
    label: 'Email Support',
    value: 'mahimrahman07@gmail.com',
    sub: 'Response within 24 hours',
    href: 'mailto:mahimrahman07@gmail.com',
    color: 'bg-purple-50 text-purple-600',
    cta: 'Send Email',
  },
];

const FAQ_SECTIONS = [
  {
    category: 'Orders & Delivery',
    icon: <FaTruck />,
    color: 'text-blue-600',
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Standard delivery within Dhaka takes 1â€“2 business days. Chittagong and Sylhet take 2â€“3 business days. For other districts, allow 3â€“5 business days. Cold-chain items are dispatched same day if ordered before 12 PM.',
      },
      {
        q: 'Is free delivery available?',
        a: 'Yes â€” free delivery on all orders over à§³50,000 within Dhaka, Chittagong, and Sylhet. Orders below this threshold have a flat delivery fee based on your location.',
      },
      {
        q: 'How do I track my order?',
        a: 'Use the Track Order link in the top navigation bar. Enter your order number to get real-time status updates. You will also receive SMS notifications at each stage.',
      },
    ],
  },
  {
    category: 'Products & Stock',
    icon: <FaBoxOpen />,
    color: 'text-[var(--color-status-success)]',
    items: [
      {
        q: 'Are all products DGDA registered?',
        a: 'Yes. Every product listed on MediportBD carries a valid DGDA registration number. You can view the registration details on each product page or contact our regulatory team for documentation.',
      },
      {
        q: 'Can I request a product not listed on the site?',
        a: 'Absolutely. Use the B2B portal to submit a custom quote request, or email us at procurement@MediportBD.com with the product name, manufacturer, and quantity required.',
      },
      {
        q: 'How are temperature-sensitive reagents handled?',
        a: 'Cold-chain products are stored in our temperature-controlled warehouse and dispatched in validated cold boxes with ice packs. Delivery is door-to-door with chain-of-custody documentation.',
      },
    ],
  },
  {
    category: 'Payments & Invoicing',
    icon: <FaCreditCard />,
    color: 'text-purple-600',
    items: [
      {
        q: 'What payment methods are accepted?',
        a: 'We accept credit/debit cards (Visa, Mastercard), bKash, Nagad, bank transfer, and purchase orders for registered B2B institutions. All transactions are secured with SSL encryption.',
      },
      {
        q: 'Can I get a VAT invoice?',
        a: 'Yes. A VAT-compliant invoice is automatically generated for every order and available for download from your account dashboard under Order History.',
      },
      {
        q: 'Do you offer credit terms for institutions?',
        a: 'Registered hospitals, clinics, and diagnostic centres can apply for 30-day credit terms through the B2B portal. Approval is subject to a brief verification process.',
      },
    ],
  },
  {
    category: 'Returns & Refunds',
    icon: <FaUndo />,
    color: 'text-orange-600',
    items: [
      {
        q: 'What is the return policy?',
        a: 'Unopened, undamaged products can be returned within 7 days of delivery. Cold-chain and sterile items cannot be returned once delivered due to regulatory requirements. Please inspect your order upon receipt.',
      },
      {
        q: 'How do I initiate a return?',
        a: 'Go to My Orders in your account, select the order, and click "Request Return". Our team will review the request within 1 business day and arrange a pickup if approved.',
      },
      {
        q: 'When will I receive my refund?',
        a: 'Refunds are processed within 5â€“7 business days after the returned item is received and inspected. The amount is credited back to the original payment method.',
      },
    ],
  },
  {
    category: 'Account & B2B',
    icon: <FaUserCircle />,
    color: 'text-brand-teal',
    items: [
      {
        q: 'How do I register as a B2B customer?',
        a: 'Click "B2B Portal" in the top navigation and complete the institutional registration form. You will need your trade licence, TIN certificate, and DGDA licence (if applicable). Approval takes 1â€“2 business days.',
      },
      {
        q: 'What discounts are available for bulk orders?',
        a: 'B2B institutions receive up to 30% discount on bulk orders depending on product category and volume. Contact our sales team for a custom pricing agreement.',
      },
    ],
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--color-border-tertiary)] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 min-h-[48px]"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-[var(--color-text-primary)]">{q}</span>
        {open ? (
          <FaChevronUp className="text-[var(--color-text-secondary)] flex-shrink-0 text-xs" />
        ) : (
          <FaChevronDown className="text-[var(--color-text-secondary)] flex-shrink-0 text-xs" />
        )}
      </button>
      {open && (
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed pb-4">{a}</p>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-page">
      {/* Hero */}
      <section className="bg-brand-navy text-white py-8 md:py-10 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1 rounded-full mb-4">
            <FaHeadset className="text-[#1DB954]" />
            Customer Support
          </div>
          <h1 className="text-xl md:text-2xl font-semibold mb-2">How can we help you?</h1>
          <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
            Browse our frequently asked questions or reach out directly â€” our support team is available Sunday through Thursday, 9 AM to 6 PM.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Contact Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CONTACT_OPTIONS.map((opt) => (
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

      {/* FAQ */}
      <section className="py-4 px-4 pb-16">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Frequently Asked Questions</h2>
          <div className="flex flex-col gap-4">
            {FAQ_SECTIONS.map((section) => (
              <div
                key={section.category}
                className="bg-white rounded-2xl border border-[var(--color-border-tertiary)] shadow-sm overflow-hidden"
              >
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--color-border-tertiary)]">
                  <span className={section.color}>{section.icon}</span>
                  <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">{section.category}</h3>
                </div>
                <div className="px-6">
                  {section.items.map((item) => (
                    <FAQItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Still need help */}
          <div className="mt-6 bg-brand-navy rounded-2xl p-5 text-white text-center">
            <FaHeadset className="text-2xl text-[#1DB954] mx-auto mb-2" />
            <h3 className="font-semibold text-lg mb-2">Still need help?</h3>
            <p className="text-white/70 text-sm mb-5">
              Our support team is ready to assist with any question not covered above.
            </p>
            <a
              href="mailto:mahimrahman07@gmail.com"
              className="inline-block bg-white text-brand-navy font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[var(--color-background-tertiary)] transition-colors"
            >
              Email Support Team
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
