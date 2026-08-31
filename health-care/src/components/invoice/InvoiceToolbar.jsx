'use client';

import { FaArrowLeft, FaPrint, FaDownload, FaEdit } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

/**
 * InvoiceToolbar Component
 * Actions toolbar for invoice page (not printed)
 */
export default function InvoiceToolbar({ orderId, onDownloadPDF, onPrint }) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-md">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
      >
        <FaArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-deep"
        >
          <FaPrint className="h-4 w-4" />
          Print
        </button>

        {onDownloadPDF && (
          <button
            onClick={onDownloadPDF}
            className="flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-teal-dark"
          >
            <FaDownload className="h-4 w-4" />
            Download PDF
          </button>
        )}
      </div>
    </div>
  );
}
