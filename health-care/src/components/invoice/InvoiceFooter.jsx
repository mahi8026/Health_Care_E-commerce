'use client';

import { FaPhone, FaEnvelope, FaGlobe } from 'react-icons/fa';

/**
 * InvoiceFooter Component
 * Compact invoice footer so long invoices don't waste a full page on waves.
 * Contact details are kept consistent with the backend PDF header.
 */
export default function InvoiceFooter() {
  return (
    <footer className="invoice-footer mt-6 overflow-hidden">
      <div className="bg-brand-navy px-6 py-4 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-base font-bold">
                Mediport<span className="text-brand-teal">BD</span>
              </h3>
              <p className="text-[10px] text-gray-300">
                Medical Equipment & Healthcare Solutions
              </p>
            </div>

            <div className="flex flex-col gap-1.5 text-[10px] text-gray-300 sm:flex-row sm:gap-4">
              <span className="flex items-center gap-1.5">
                <FaPhone className="h-2.5 w-2.5 text-brand-teal" />
                +880 1646-886795
              </span>
              <span className="flex items-center gap-1.5">
                <FaEnvelope className="h-2.5 w-2.5 text-brand-teal" />
                mediportbdofficial@gmail.com
              </span>
              <span className="flex items-center gap-1.5">
                <FaGlobe className="h-2.5 w-2.5 text-brand-teal" />
                www.mediportbd.com
              </span>
            </div>
          </div>

          <div className="mt-3 border-t border-gray-600 pt-2 text-center text-[9px] text-gray-400">
            <p>
              DGDA Reg. DA-2024-0891{process.env.NEXT_PUBLIC_COMPANY_BIN ? ` · BIN: ${process.env.NEXT_PUBLIC_COMPANY_BIN}` : ''} · This is a computer-generated invoice and
              does not require a signature.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
