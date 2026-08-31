'use client';

import { FaPhone, FaEnvelope, FaGlobe, FaMapMarkerAlt } from 'react-icons/fa';

/**
 * InvoiceFooter Component
 * Displays invoice footer with curved waves and company information
 */
export default function InvoiceFooter() {
  return (
    <footer className="invoice-footer relative mt-8 overflow-hidden">
      {/* Curved Waves Background */}
      <div className="relative h-32">
        {/* Navy Wave */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M0 60C240 20 480 20 720 60C960 100 1200 100 1440 60V120H0V60Z"
            fill="#0B2D5C"
          />
        </svg>

        {/* Teal Wave */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{ bottom: '-10px' }}
        >
          <path
            d="M0 40C360 80 720 80 1080 40C1260 20 1350 20 1440 40V100H0V40Z"
            fill="#11B5AE"
            opacity="0.6"
          />
        </svg>

        {/* Orange Accent Wave */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{ bottom: '-5px' }}
        >
          <path
            d="M0 30C480 60 960 60 1440 30V80H0V30Z"
            fill="#FF7A00"
            opacity="0.4"
          />
        </svg>
      </div>

      {/* Footer Content */}
      <div className="relative bg-brand-navy px-8 pb-6 pt-8 text-white">
        <div className="mx-auto max-w-6xl">
          {/* Company Name */}
          <div className="mb-4 text-center">
            <h3 className="text-2xl font-bold">
              Mediport<span className="text-brand-teal">BD</span>
            </h3>
            <p className="text-sm text-gray-300">
              Medical Equipment & Healthcare Solutions
            </p>
          </div>

          {/* Contact Information Grid */}
          <div className="grid grid-cols-1 gap-4 text-center text-sm md:grid-cols-4">
            {/* Phone */}
            <div className="flex items-center justify-center gap-2">
              <FaPhone className="h-3 w-3 text-brand-teal" />
              <div>
                <span className="text-gray-300">Phone: </span>
                <span className="font-medium">+880 1624 688 679</span>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-center gap-2">
              <FaEnvelope className="h-3 w-3 text-brand-teal" />
              <div>
                <span className="text-gray-300">Email: </span>
                <span className="font-medium">info@mediportbd.com</span>
              </div>
            </div>

            {/* Website */}
            <div className="flex items-center justify-center gap-2">
              <FaGlobe className="h-3 w-3 text-brand-teal" />
              <div>
                <span className="text-gray-300">Website: </span>
                <span className="font-medium">www.mediportbd.com</span>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-center justify-center gap-2">
              <FaMapMarkerAlt className="h-3 w-3 text-brand-teal" />
              <div>
                <span className="text-gray-300">Address: </span>
                <span className="font-medium">Dhaka, Bangladesh</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-gray-600"></div>

          {/* Bottom Text */}
          <div className="text-center text-xs text-gray-400">
            <p>
              Thank you for your business · DGDA Registered · ISO 13485 Certified
            </p>
            <p className="mt-1">
              This is a computer-generated invoice and does not require a signature.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
