import { useLang } from '@/context/LanguageContext';
import { getT } from '@/config/translations';

/**
 * Returns a translation function for the current language.
 * Usage:
 *   const t = useT();
 *   t('nav.products') // → 'Products' or 'পণ্যসমূহ'
 */
export function useT() {
  const { lang } = useLang();
  return getT(lang);
}

