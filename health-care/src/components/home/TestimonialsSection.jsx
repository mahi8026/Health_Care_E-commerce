'use client';

import { useEffect, useState } from 'react';
import getHomeDataOnce from '@/utils/homeDataClient';
import { useT } from '@/hooks/useT';

/**
 * Customer testimonials section. Self-fetching via the shared one-shot
 * /home/data promise: mounts inside a LazyMount below the fold, so neither
 * the request nor its re-render happens during the initial load window.
 */
export default function TestimonialsSection() {
  const t = useT();
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    let mounted = true;
    getHomeDataOnce().then((data) => {
      if (mounted && data && Array.isArray(data.testimonials)) setTestimonials(data.testimonials);
    });
    return () => { mounted = false; };
  }, []);

  if (!testimonials.length) return null;

  return (
    <section className="bg-hero-gradient home-testimonials-section" style={{ padding: '32px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: 'var(--color-brand-teal)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{t('home.testimonials')}</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 600, margin: 0, color: '#fff' }}>
            {t('home.testimonials')}
          </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}
        className="testimonials-grid">
        {testimonials.slice(0, 3).map((review) => {
          const userName = review.user?.name || review.userName || 'Anonymous';
          const companyName = review.user?.companyName || review.companyName || '';
          const rating = review.rating || 5;

          return (
            <div key={review._id} style={{ background: '#fff', borderRadius: 14,
              border: '1px solid var(--color-border-primary)', padding: '20px', transition: 'border-color 0.2s ease, box-shadow 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-brand-teal)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(24,175,169,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-primary)'; e.currentTarget.style.boxShadow = 'none'; }}>
              {/* Stars */}
              <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <span key={s} style={{ color: s <= rating ? 'var(--color-warning)' : '#E5E7EB', fontSize: 15 }}>★</span>
                ))}
              </div>
              {/* Comment */}
              <p style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.6, marginBottom: 14,
                fontStyle: 'italic' }}>
                &ldquo;{review.comment}&rdquo;
              </p>
              {/* User info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-brand-teal), var(--color-brand-teal-light))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 15, fontWeight: 600 }}>
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-brand-navy)' }}>{userName}</div>
                  {companyName && (
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{companyName}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </section>
  );
}
