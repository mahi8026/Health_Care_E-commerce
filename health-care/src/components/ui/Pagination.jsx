"use client";

import { useMemo } from 'react';

/**
 * Modern Pagination Component
 * 
 * Features:
 * - Circular numbered buttons with blue active state
 * - Ellipsis (...) for gaps between page ranges
 * - Prev/Next arrow buttons
 * - Fully responsive (visible on all screen sizes)
 * - Shows: [<] [1] [...] [4] [5] [**6**] [7] [8] [...] [40] [>]
 */
export default function Pagination({ currentPage, totalPages, onPageChange, className = '' }) {
  // Generate page numbers with ellipsis
  const pageNumbers = useMemo(() => {
    const pages = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1);

    // Add ellipsis after first page if needed
    if (rangeStart > 2) {
      pages.push('ellipsis-start');
    }

    // Add pages around current page
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    // Add ellipsis before last page if needed
    if (rangeEnd < totalPages - 1) {
      pages.push('ellipsis-end');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  // Don't render if only 1 page or no pages
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    if (typeof page === 'number' && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <nav 
      className={`flex items-center justify-center gap-1 sm:gap-2 flex-wrap ${className}`}
      aria-label="Pagination"
    >
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
          currentPage === 1
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
            : 'bg-white border border-gray-200 text-gray-600 hover:border-[#0E8A6E] hover:text-[#0E8A6E] hover:shadow-lg hover:scale-105 active:scale-95'
        }`}
        aria-label="Previous page"
      >
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5"
          className="sm:w-4 sm:h-4"
        >
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      {/* Page Numbers */}
      {pageNumbers.map((page, index) => {
        // Ellipsis
        if (typeof page === 'string') {
          return (
            <span 
              key={page}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-400 text-[12px] sm:text-[14px] font-medium"
              aria-hidden="true"
            >
              ...
            </span>
          );
        }

        // Page number button
        const isActive = page === currentPage;
        return (
          <button
            key={page}
            onClick={() => handlePageClick(page)}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[12px] sm:text-[14px] font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-[#3B82F6] text-white shadow-lg shadow-blue-500/30 scale-110'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-[#0E8A6E] hover:text-[#0E8A6E] hover:shadow-lg hover:scale-105 active:scale-95'
            }`}
            aria-label={`Page ${page}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {page}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
          currentPage === totalPages
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
            : 'bg-white border border-gray-200 text-gray-600 hover:border-[#0E8A6E] hover:text-[#0E8A6E] hover:shadow-lg hover:scale-105 active:scale-95'
        }`}
        aria-label="Next page"
      >
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5"
          className="sm:w-4 sm:h-4"
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </nav>
  );
}
