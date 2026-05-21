'use client';

import Link from 'next/link';
import {
  FaShieldAlt,
  FaFlask,
  FaStethoscope,
  FaFileAlt,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
} from 'react-icons/fa';

const DGDA_CATEGORIES = [
  {
    icon: <FaShieldAlt className="text-2xl" />,
    title: 'Medical Devices',
    description:
      'All medical devices sold on MedCore BD are registered with DGDA under the Medical Device and Cosmetics Act. We maintain up-to-date registration certificates for every product.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: <FaFlask className="text-2xl" />,
    title: 'Reagents & Diagnostics',
    description:
      'In-vitro diagnostic reagents are regulated under DGDA guidelines. Our reagent catalogue is fully compliant with import and distribution requirements.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: <FaStethoscope className="text-2xl" />,
    title: 'Surgical Instruments',
    description:
      'Surgical instruments are sourced from DGDA-approved manufacturers and importers. Each batch is verified before listing on our platform.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: <FaFileAlt className="text-2xl" />,
    title: 'Import Documentation',
    description:
      'We maintain complete import documentation including DGDA import permits, certificates of conformity, and manufacturer authorisation letters.',
    color: 'bg-orange-50 text-orange-600',
  },
];

const COMPLIANCE_POINTS = [
  'All products carry valid DGDA registration numbers',
  'Cold-chain products handled under WHO-GMP guidelines',
  'Batch traceability maintained for all regulated items',
  'Regular audits conducted by DGDA-certified inspectors',
  'Post-market surveillance reports filed as required',
  'Adverse event reporting system in place',
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-page">
      {/* Hero */}
      <section className="bg-[#0B2545] text-white py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1 rounded-full mb-4">
            <FaShieldAlt className="text-[#1DB954]" />
            Regulatory Compliance
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            DGDA Compliance &amp; Regulatory Information
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
            MedCore BD operates in full compliance with the Directorate General of Drug Administration (DGDA) of Bangladesh. Every product on our platform meets the regulatory standards required for medical equipment and supplies.
          </p>
        </div>
      </section>

      {/* About DGDA */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">What is DGDA?</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              The Directorate General of Drug Administration (DGDA) is the national regulatory authority of Bangladesh responsible for regulating drugs, medical devices, cosmetics, and related products. It operates under the Ministry of Health and Family Welfare.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              DGDA ensures that all medical products available in Bangladesh are safe, effective, and of acceptable quality. As a licensed distributor, MedCore BD is required to maintain DGDA registration for all regulated products we sell.
            </p>
            <a
              href="https://www.dgda.gov.bd"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#0B2545] font-semibold text-sm hover:underline"
            >
              Visit DGDA Official Website <FaExternalLinkAlt className="text-xs" />
            </a>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-4 px-4 pb-12">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Regulated Product Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DGDA_CATEGORIES.map((cat) => (
              <div
                key={cat.title}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex gap-4"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.color}`}>
                  {cat.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{cat.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{cat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Checklist */}
      <section className="py-4 px-4 pb-12">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-[#0B2545] rounded-2xl p-8 text-white">
            <h2 className="text-xl font-bold mb-6">Our Compliance Commitments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {COMPLIANCE_POINTS.map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <FaCheckCircle className="text-[#1DB954] mt-0.5 flex-shrink-0" />
                  <span className="text-white/80 text-sm">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact for Regulatory Queries */}
      <section className="py-4 px-4 pb-16">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Regulatory Enquiries</h2>
            <p className="text-gray-500 text-sm mb-6">
              For questions about product registration, import documentation, or compliance certificates, contact our regulatory affairs team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="tel:+8801800000000"
                className="flex items-center gap-3 bg-gray-50 rounded-xl px-5 py-4 hover:bg-gray-100 transition-colors"
              >
                <FaPhone className="text-[#0B2545]" />
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm font-semibold text-gray-800">+880 1800-MED</p>
                </div>
              </a>
              <a
                href="mailto:regulatory@medcorebd.com"
                className="flex items-center gap-3 bg-gray-50 rounded-xl px-5 py-4 hover:bg-gray-100 transition-colors"
              >
                <FaEnvelope className="text-[#0B2545]" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm font-semibold text-gray-800">regulatory@medcorebd.com</p>
                </div>
              </a>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-5 py-4">
                <FaMapMarkerAlt className="text-[#0B2545]" />
                <div>
                  <p className="text-xs text-gray-400">Office</p>
                  <p className="text-sm font-semibold text-gray-800">Dhaka, Bangladesh</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
