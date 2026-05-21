'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const TOPBAR_HIDE_AFTER = 48;
const TOPBAR_SHOW_AT_TOP = 24;

export default function NavScrollEffect() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    const isHome = pathname === '/';
    let lastY = window.scrollY;

    const update = () => {
      const y = window.scrollY;
      const scrollingDown = y > lastY;

      html.classList.toggle('nav-scrolled', y > 16);
      html.classList.toggle('nav-over-hero', isHome && y < 180);
      html.classList.toggle('home-page', isHome);

      if (y <= TOPBAR_SHOW_AT_TOP) {
        html.classList.remove('topbar-hidden');
      } else if (scrollingDown && y > TOPBAR_HIDE_AFTER) {
        html.classList.add('topbar-hidden');
      } else if (!scrollingDown) {
        html.classList.remove('topbar-hidden');
      }

      lastY = y;
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      html.classList.remove('nav-scrolled', 'nav-over-hero', 'home-page', 'topbar-hidden');
    };
  }, [pathname]);

  return null;
}
