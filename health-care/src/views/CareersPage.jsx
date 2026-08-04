'use client';

import { FaBriefcase, FaMapPin, FaClock, FaEnvelope, FaAward, FaChalkboardTeacher, FaTruck, FaHeartbeat } from 'react-icons/fa';
import { CONTACT } from '@/constants/api';

const PERKS = [
  {
    icon: <FaHeartbeat />,
    title: 'Purpose-driven work',
    desc: 'Every order we deliver helps a hospital, clinic, or patient. Your work has a real impact on healthcare in Bangladesh.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: <FaChalkboardTeacher />,
    title: 'Hands-on training',
    desc: 'Learn medical device technology, DGDA regulations, and product expertise through structured onboarding and continuous training.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: <FaAward />,
    title: 'Growth opportunities',
    desc: 'We promote from within â€” sales, service, and operations teams grow into leadership roles as the company expands.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: <FaTruck />,
    title: 'Modern operations',
    desc: 'Work with a DGDA-registered supplier operating a cold-chain warehouse and a nationwide delivery network.',
    color: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]',
  },
];

const OPENINGS = [
  {
    title: 'Medical Equipment Sales Executive',
    type: 'Full-time',
    location: 'Dhaka',
    desc: 'Sell diagnostic equipment, surgical instruments, and hospital machines to clinics and hospitals across Dhaka. Build and maintain a B2B client pipeline.',
  },
  {
    title: 'Biomedical Service Technician',
    type: 'Full-time',
    location: 'Dhaka',
    desc: 'Install, calibrate, and service medical devices at customer sites. Provide on-site and remote technical support with manufacturer documentation.',
  },
  {
    title: 'Warehouse & Cold-Chain Associate',
    type: 'Full-time',
    location: 'Dhaka',
    desc: 'Manage inbound and outbound stock, maintain cold-chain storage logs, and prepare validated shipments for temperature-sensitive reagents.',
  },
  {
    title: 'Digital Marketing Executive',
    type: 'Full-time',
    location: 'Dhaka',
    desc: 'Run campaigns, SEO, and content across MediportBD channels. Own the growth of our B2B lead pipeline from the website.',
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-page">
      {/* Hero */}
      <section className="bg-brand-navy text-white py-8 md:py-10 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1 rounded-full mb-4">
            <FaBriefcase className="text-brand-teal-light" />
            Careers
          </div>
          <h1 className="text-xl md:text-2xl font-semibold mb-2">Build a career that saves lives</h1>
          <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
            Join MediportBD and help supply Bangladesh&apos;s hospitals, clinics, and diagnostic centres with trusted medical equipment.
          </p>
        </div>
      </section>

      {/* Perks */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Why work with us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PERKS.map((perk) => (
              <div
                key={perk.title}
                className="bg-white rounded-2xl border border-[var(--color-border-tertiary)] shadow-sm p-6 flex flex-col gap-3"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${perk.color}`}>
                  {perk.icon}
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">{perk.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-4 px-4 pb-16">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Open Positions</h2>
          <div className="flex flex-col gap-4">
            {OPENINGS.map((job) => (
              <div
                key={job.title}
                className="bg-white rounded-2xl border border-[var(--color-border-tertiary)] shadow-sm p-6"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-semibold text-[var(--color-text-primary)] text-base">{job.title}</h3>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-teal bg-brand-teal-tint px-2.5 py-1 rounded-full">
                    {job.type}
                  </span>
                </div>
                <p className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] mb-3">
                  <FaMapPin /> {job.location}
                  <span className="inline-flex items-center gap-1 ml-2">
                    <FaClock /> Full-time
                  </span>
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{job.desc}</p>
              </div>
            ))}
          </div>

          {/* Apply CTA */}
          <div className="mt-6 bg-brand-navy rounded-2xl p-5 text-white text-center">
            <FaEnvelope className="text-2xl text-brand-teal-light mx-auto mb-2" />
            <h3 className="font-semibold text-lg mb-2">Didn&apos;t find your role?</h3>
            <p className="text-white/70 text-sm mb-5">
              Send your CV with the subject line &quot;Application â€” [Role Name]&quot; and we&apos;ll keep you in mind for upcoming openings.
            </p>
            <a
              href={`mailto:${CONTACT.supportEmail}?subject=Application%20%E2%80%94%20[Role%20Name]`}
              className="inline-block bg-white text-brand-navy font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[var(--color-background-tertiary)] transition-colors"
            >
              Send Your CV
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
