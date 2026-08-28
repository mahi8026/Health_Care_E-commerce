"use client";

import { useState, useEffect } from 'react';
import { fetchCached } from '@/utils/api';

/**
 * Fetches site settings including hero slides, promo banners, and configuration.
 * 
 * @returns {{ 
 *   settings: Object|null,
 *   heroSlides: Object[],
 *   promoBanner: Object|null,
 *   loading: boolean, 
 *   error: string|null 
 * }}
 * 
 * @example
 * const { settings, heroSlides, promoBanner, loading } = useSiteSettings();
 * if (loading) return <Spinner />;
 * return <HeroSlider slides={heroSlides} />;
 */
export function useSiteSettings() {
  const [settings, setSettings] = useState(null);
  const [heroSlides, setHeroSlides] = useState([]);
  const [promoBanner, setPromoBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // fetchCached dedupes + caches this endpoint so the many components
        // that read site settings hit the network once per TTL window
        // (previously every mount fired its own raw fetch).
        const data = await fetchCached(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
          signal: controller.signal,
        });
        
        const settingsData = data.data || data;
        
        setSettings(settingsData);

        // Extract hero slides
        if (settingsData.heroSlides?.length) {
          const activeSlides = settingsData.heroSlides
            .filter(slide => slide.isActive)
            .sort((a, b) => a.order - b.order);
          setHeroSlides(activeSlides);
        }

        // Extract promo banner
        if (settingsData.promoBanner?.imageUrl) {
          setPromoBanner(settingsData.promoBanner);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load site settings');
        // Silently fail - components can use fallback data
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    return () => controller.abort();
  }, []);

  return { settings, heroSlides, promoBanner, loading, error };
}
