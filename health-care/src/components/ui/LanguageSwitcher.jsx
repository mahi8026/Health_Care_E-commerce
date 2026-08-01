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
        <span className="text-xs text-[var(--color-text-secondary)]">Language:</span>
        <button
          onClick={() => switchLang('en')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            !isBn
              ? 'bg-brand-navy text-white'
              : 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-muted)]'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => switchLang('bn')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            isBn
              ? 'bg-brand-navy text-white'
              : 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-muted)]'
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
      className={`nav-glass-control nav-glass-control--icon flex items-center gap-1 px-2.5 text-xs font-semibold tracking-wide ${className}`}
      style={{ minWidth: 44 }}
    >
      <span className="text-sm">🌐</span>
      <span className="hidden sm:inline">{isBn ? 'EN' : 'বাং'}</span>
    </button>
  );
}

