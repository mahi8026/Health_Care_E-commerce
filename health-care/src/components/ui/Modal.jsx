import { useEffect } from 'react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal - full screen on mobile, centered on desktop */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className={`relative bg-white rounded-t-2xl sm:rounded-lg shadow-xl ${sizes[size]} w-full max-h-[90vh] overflow-y-auto`}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b-[0.5px] border-[var(--color-border-tertiary)] sticky top-0 bg-white z-10">
              {title && (
                <h3 className="text-[15px] sm:text-[16px] font-semibold font-[family-name:var(--font-lora)]">
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-[var(--color-background-tertiary)] ml-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="px-4 sm:px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
