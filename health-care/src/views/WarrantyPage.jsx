'use client';

import { FaShieldAlt, FaTools, FaFileAlt, FaExclamationTriangle, FaEnvelope } from 'react-icons/fa';
import { CONTACT } from '@/constants/api';

const COVERAGE = [
  {
    title: 'Manufacturer warranty',
    desc: 'Most diagnostic equipment, hospital machines, and surgical instruments carry a manufacturer warranty from 6 to 24 months from the delivery date. The exact period is stated on each product page.',
  },
  {
    title: 'Mediport service warranty',
    desc: 'On top of the manufacturer warranty, MediportBD covers installation, calibration, and one free preventive maintenance visit within the warranty period.',
  },
  {
    title: 'What is covered',
    desc: 'Manufacturing defects, faulty components, and workmanship issues are repaired or replaced at no cost. Genuine spare parts are sourced from the manufacturer.',
  },
];

const EXCLUSIONS = [
  'Physical damage caused by misuse, drops, or improper handling',
  'Damage caused by power surges, incorrect voltage, or unapproved installations',
  'Unauthorized repairs, modifications, or tampering with serial numbers',
  'Consumables such as electrodes, cables, tubing, and batteries',
  'Damage caused by environmental conditions outside the device specifications',
  'Normal wear and tear or cosmetic damage that does not affect function',
];

const STEPS = [
  {
    icon: <FaFileAlt />,
    title: '1. Open a claim',
    desc: 'Email us at the address below with your order number, product serial number, and a short description of the issue. Include photos or video if possible.',
  },
  {
    icon: <FaTools />,
    title: '2. Diagnosis',
    desc: 'Our service team reviews the issue within one business day and arranges a remote diagnostic session or an on-site visit for Dhaka customers.',
  },
  {
    icon: <FaShieldAlt />,
    title: '3. Resolution',
    desc: 'In-warranty defects are repaired free of charge. If the device cannot be repaired, it is replaced or you receive a refund per the warranty terms.',
  },
];

export default function WarrantyPage() {
  return (
    <div className="min-h-screen bg-page">
      {/* Hero */}
      <section className="bg-brand-navy text-white py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1 rounded-full mb-4">
            <FaShieldAlt className="text-brand-teal-light" />
            Warranty &amp; Claims
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold mb-4">Every device, backed by a warranty</h1>
          <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
            Every product sold by MediportBD is covered by a manufacturer warranty plus our own service warranty — so you can buy with confidence.
          </p>
        </div>
      </section>

      {/* Coverage */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">What your warranty covers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COVERAGE.map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl border border-[var(--color-border-tertiary)] shadow-sm p-6 flex flex-col gap-3"
              >
                <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">{item.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exclusions */}
      <section className="py-4 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-2xl border border-[var(--color-border-tertiary)] shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 text-red-500">
                <FaExclamationTriangle />
              </div>
              <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">What is not covered</h3>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXCLUSIONS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  <span className="text-[var(--color-status-danger)] mt-0.5 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Claim Process */}
      <section className="py-12 px-4 pb-16">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">How to file a claim</h2>
          <div className="flex flex-col gap-4">
            {STEPS.map((step) => (
              <div
                key={step.title}
                className="bg-white rounded-2xl border border-[var(--color-border-tertiary)] shadow-sm p-6 flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-teal-tint text-brand-teal flex-shrink-0">
                  {step.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-primary)] text-sm mb-1">{step.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-8 bg-brand-navy rounded-2xl p-8 text-white text-center">
            <FaEnvelope className="text-3xl text-brand-teal-light mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">Need to start a warranty claim?</h3>
            <p className="text-white/70 text-sm mb-5">
              Email our support team with your order number and serial number — we respond within one business day.
            </p>
            <a
              href={`mailto:${CONTACT.supportEmail}?subject=Warranty%20Claim`}
              className="inline-block bg-white text-brand-navy font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[var(--color-background-tertiary)] transition-colors"
            >
              Open a Claim
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
