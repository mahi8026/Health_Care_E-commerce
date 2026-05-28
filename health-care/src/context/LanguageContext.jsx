'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('medcore_lang');
    if (saved === 'bn' || saved === 'en') setLang(saved);
  }, []);

  const switchLang = (l) => {
    setLang(l);
    localStorage.setItem('medcore_lang', l);
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
    console.warn('useLang: LanguageContext not available, using default language');
    return { lang: 'en', switchLang: () => {} };
  }
  return ctx;
}
