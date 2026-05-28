import { useLang } from '@/context/LanguageContext';
import { getT } from '@/config/translations';

/**
 * Returns a translation function for the current language.
 * Usage:
 *   const t = useT();
 *   t('nav.products') // → 'Products' or 'পণ্যসমূহ'
 */
export function useT() {
  try {
    const { lang } = useLang();
    return getT(lang);
  } catch (error) {
    // Fallback to English if context is not available
    console.warn('useT: LanguageContext not available, falling back to English');
    return getT('en');
  }
}
