'use client';
import { createContext, useContext, useState, useEffect } from 'react';

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

  // No useEffect needed - initialization happens in useState

  const switchLang = (l) => {
    setLang(l);
    localStorage.setItem('Mediport_lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, switchLang }}>
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
