'use client';

import { useLang } from '@/context/LanguageContext';

/**
 * Language switcher button — toggles between English and Bengali.
 * Variants:
 *   'pill'   — compact pill for header (default)
 *   'menu'   — full row for mobile menu / dropdowns
 */
export default function LanguageSwitcher({ variant = 'pill', className = '' }) {
  const { lang, switchLang } = useLang();
  const isBn = lang === 'bn';

  if (variant === 'menu') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-[12px] text-[var(--color-text-secondary)]">Language:</span>
        <button
          onClick={() => switchLang('en')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
            !isBn
              ? 'bg-[#0B2545] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => switchLang('bn')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
            isBn
              ? 'bg-[#0B2545] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          বাং
        </button>
      </div>
    );
  }

  // Default: pill toggle
  return (
    <button
      onClick={() => switchLang(isBn ? 'en' : 'bn')}
      title={isBn ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
      aria-label={isBn ? 'Switch to English' : 'Switch to Bengali'}
      className={`nav-glass-control nav-glass-control--icon flex items-center gap-1 px-2.5 text-[11px] font-bold tracking-wide ${className}`}
      style={{ minWidth: 44 }}
    >
      <span className="text-[13px]">🌐</span>
      <span className="hidden sm:inline">{isBn ? 'EN' : 'বাং'}</span>
    </button>
  );
}

