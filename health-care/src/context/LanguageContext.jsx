'use client';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // Initialize from localStorage if available
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('Mediport_lang');
      if (saved === 'bn' || saved === 'en') return saved;
    }
    return 'en';
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    if (lang === 'bn') {
      document.documentElement.classList.add('lang-bn');
    } else {
      document.documentElement.classList.remove('lang-bn');
    }
  }, [lang]);

  const switchLang = useCallback((l) => {
    setLang(l);
    try {
      localStorage.setItem('Mediport_lang', l);
    } catch {
      // localStorage may be unavailable (private mode)
    }
  }, []);

  const value = useMemo(() => ({ lang, switchLang }), [lang, switchLang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    if (process.env.NODE_ENV !== 'production') console.warn('useLang: LanguageContext not available, using default language');
    return { lang: 'en', switchLang: () => {} };
  }
  return ctx;
}
