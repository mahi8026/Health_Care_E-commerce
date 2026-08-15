import { useMemo } from 'react';
import { useLang } from '@/context/LanguageContext';
import { getT } from '@/config/translations';

/**
 * Returns a translation function for the current language.
 * 
 * @returns {Function} Translation function that accepts a key and returns the translated string
 * 
 * @example
 * const t = useT();
 * const productsLabel = t('nav.products'); // → 'Products' or 'পণ্যসমূহ'
 * const cartLabel = t('nav.cart'); // → 'Cart' or 'কার্ট'
 */
export function useT() {
  // Always call the hook unconditionally
  const { lang } = useLang();
  // getT returns a new closure each call — memoize so React.memo consumers
  // receiving `t` as a prop don't re-render on every parent render.
  return useMemo(() => getT(lang), [lang]);
}
