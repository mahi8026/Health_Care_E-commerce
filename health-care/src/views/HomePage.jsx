'use client';

import { useState, useEffect, useCallback, memo, useMemo, useRef, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useT } from '@/hooks/useT';
import Spinner from '@/components/ui/Spinner';
import {
  FaStethoscope,
  FaSyringe,
  FaFlask,
  FaHospital,
  FaMicroscope,
  FaShieldAlt,
  FaTooth,
  FaBone,
  FaTruck,
  FaSnowflake,
  FaTag,
  FaCheckCircle,
  FaTools,
  FaPhoneAlt,
  FaCreditCard,
  FaUndo,
  FaSearch,
  FaShoppingCart,
} from 'react-icons/fa';
import { API } from '@/constants/api';
import { fetchWithRetry } from '@/utils/api';
import { CATEGORY_NAME_TO_SLUG } from '@/constants/categories';
import EnhancedSearchBox from '@/components/search/EnhancedSearchBox';
import { getHeroImage } from '@/utils/cloudinary';

// Lazy load heavy components for better performance
const SupportResources = lazy(() => import('@/components/home/SupportResources'));
const VideoSection = lazy(() => import('@/components/home/VideoSection'));
const NewArrivalSlider = lazy(() => import('@/components/home/NewArrivalSlider'));
const BestSellingSection = lazy(() => import('@/components/home/BestSellingSection'));
const PromoBannerSection = lazy(() => import('@/components/home/PromoBannerSection'));
const FlashDealsSection = lazy(() => import('@/components/home/FlashDealsSection'));
const CategoryProductSections = lazy(() => import('@/components/home/CategoryProductSections'));
const RecentlyViewed = lazy(() => import('@/components/product/RecentlyViewed'));
const FeaturedProductsSection = lazy(() => import('@/components/home/FeaturedProductsSection'));
const TestimonialsSection = lazy(() => import('@/components/home/TestimonialsSection'));

// ══════════════════════════════════════════════════════════════════════════════
// FALLBACK DATA & CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

// All 18 categories - matches database (fallback only if API fails)
const FALLBACK_CATEGORIES = [
  { name: 'Diagnostic Equipment', icon: <FaStethoscope />, desc: 'ECG · Ultrasound · Monitors', color: 'var(--color-status-info-tint)' },
  { name: 'Surgical Instruments', icon: <FaSyringe />, desc: 'Instruments · Implants', color: 'var(--color-status-success-tint)' },
  { name: 'Laboratory Reagents', icon: <FaFlask />, desc: 'Clinical · Molecular', color: '#FAF5FF' },
  { name: 'Hospital Machines', icon: <FaHospital />, desc: 'ICU · Ventilators · Dialysis', color: 'var(--color-status-warning-tint)' },
  { name: 'Lab Equipment', icon: <FaMicroscope />, desc: 'Centrifuges · Microscopes', color: 'var(--color-status-success-tint)' },
  { name: 'PPE & Safety', icon: <FaShieldAlt />, desc: 'Masks · Gloves · Gowns', color: 'var(--color-status-danger-tint)' },
  { name: 'Dental Equipment', icon: <FaTooth />, desc: 'Chairs · Drills', color: 'var(--color-status-warning-tint)' },
  { name: 'Implants & Ortho', icon: <FaBone />, desc: 'Bone Plates · Screws', color: 'var(--color-background-secondary)' },
  { name: 'Surgical & Wound Care', icon: <FaSyringe />, desc: 'Dressings · Tapes · Ostomy', color: 'var(--color-status-success-tint)' },
  { name: 'Diabetes Care', icon: <FaFlask />, desc: 'Glucose Meters · Test Strips', color: '#FAF5FF' },
  { name: 'Physiotherapy & Rehabilitation', icon: <FaTools />, desc: 'TENS · Heating Pads', color: 'var(--color-status-warning-tint)' },
  { name: 'Ophthalmology & ENT Equipment', icon: <FaStethoscope />, desc: 'Ophthalmoscopes · Otoscopes', color: 'var(--color-status-info-tint)' },
  { name: 'IV & Infusion Therapy', icon: <FaSyringe />, desc: 'IV Cannulas · Infusion Sets', color: 'var(--color-status-success-tint)' },
  { name: 'Blood Bank Supplies', icon: <FaFlask />, desc: 'Blood Bags · Collection Sets', color: 'var(--color-status-danger-tint)' },
  { name: 'Respiratory Equipment', icon: <FaHospital />, desc: 'Nebulizers · Oxygen Therapy', color: 'var(--color-status-info-tint)' },
  { name: 'Medical Supplies', icon: <FaShoppingCart />, desc: 'General Medical Supplies', color: 'var(--color-background-secondary)' },
  { name: 'Compression Garments', icon: <FaShieldAlt />, desc: 'Compression Stockings', color: 'var(--color-status-danger-tint)' },
  { name: 'Consumables', icon: <FaShoppingCart />, desc: 'Medical Consumables', color: 'var(--color-status-warning-tint)' },
];

const SEARCH_SUGGESTIONS = ['ECG Machine', 'HbA1c Kit', 'Ventilator', 'Surgical Set', 'Reagents'];

const B2B_FEATURES = [
  '8–22% bulk discounts', '30–90 day credit terms',
  'Dedicated account manager', 'Priority order processing',
  'Free installation & training', 'Custom quotations',
];

const B2B_STATS = [
  { val: '500+', label: 'Active B2B Clients' },
  { val: '30%', label: 'Max Bulk Discount' },
  { val: '90 days', label: 'Credit Terms' },
  { val: '24/7', label: 'Dedicated Support' },
];

// WHY_US is built dynamically from settings — see buildWhyUs() below
const HOW_IT_WORKS = [
  { step: 1, icon: <FaSearch />, title: 'Browse & Search', desc: 'Find products from 40+ global brands' },
  { step: 2, icon: <FaShoppingCart />, title: 'Add to Cart', desc: 'Get instant quotes and bulk pricing' },
  { step: 3, icon: <FaCreditCard />, title: 'Secure Checkout', desc: 'Multiple payment options available' },
  { step: 4, icon: <FaTruck />, title: 'Fast Delivery', desc: 'Free installation & training included' },
];

function buildWhyUs(settings) {
  const threshold = settings?.freeDeliveryThreshold
    ? `৳${(settings.freeDeliveryThreshold / 1000).toFixed(0)}K`
    : '৳50K';
  const returnDays = settings?.returnPolicyDays ?? 30;
  const supportHours = settings?.supportHours ?? '24/7';
  const certifications = settings?.certifications?.join(', ') || 'DGDA Registered';
  return [
    { icon: <FaCheckCircle />, title: certifications.split(',')[0]?.trim() || 'DGDA Registered', desc: 'All products are DGDA-cleared and meet Bangladesh regulatory standards.' },
    { icon: <FaTruck />, title: 'Fast Delivery', desc: `Same-day dispatch for orders before 12 PM. Free delivery in Dhaka metro over ${threshold}.` },
    { icon: <FaTools />, title: 'Free Installation', desc: 'Professional installation and staff training included for all equipment.' },
    { icon: <FaPhoneAlt />, title: `${supportHours} Support`, desc: 'Dedicated technical support team available round the clock.' },
    { icon: <FaCreditCard />, title: 'Flexible Payment', desc: 'Bank transfer, bKash, Nagad, and B2B credit terms available.' },
    { icon: <FaUndo />, title: `${returnDays}-Day Returns`, desc: `Hassle-free returns and replacement policy on all products within ${returnDays} days.` },
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// ISOLATED ANIMATION COMPONENTS
// Each owns its own timer/scroll state so ticking never re-renders the whole
// homepage (previously 4 intervals + 2 scroll listeners re-rendered the full
// 1600-line tree every few seconds).
// ══════════════════════════════════════════════════════════════════════════════

// Mount-on-scroll: heavy sections are kept out of the initial hydration and
// script-eval path entirely, then rendered when the user scrolls near them.
// Reserved heights (cv-slot--* / best-selling-slot / featured-products-panel)
// prevent CLS while they are unmounted.
function useInViewOnce(rootMargin) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (typeof IntersectionObserver === 'undefined') {
      const t = setTimeout(() => setInView(true), 1000);
      return () => clearTimeout(t);
    }
    // Defer observation until the main thread has settled so that below-fold
    // sections never mount, fetch, or re-render during the initial load window.
    let io = null;
    const startTimer = setTimeout(() => {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setInView(true);
            io.disconnect();
          }
        },
        { rootMargin }
      );
      io.observe(el);
    }, 2000);
    return () => { clearTimeout(startTimer); if (io) io.disconnect(); };
  }, [inView, rootMargin]);

  return [ref, inView];
}

function LazyMount({ rootMargin = '300px', fallback = null, className, style, children }) {
  const [ref, inView] = useInViewOnce(rootMargin);
  return (
    <div ref={ref} className={className} style={style}>
      {inView ? children : fallback}
    </div>
  );
}

// Static below-fold sections are memoized so that state updates elsewhere in
// HomePage (e.g. featured products arriving) skip re-rendering them entirely.
const WhyChooseUsSection = memo(function WhyChooseUsSection({ t, items }) {
  return (
    <section className="home-section" style={{ padding: '32px 24px', borderTop: '1px solid var(--color-border-primary)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: 'var(--color-brand-teal)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{t('home.whyChooseUs')}</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 600, margin: 0, color: 'var(--color-brand-navy)' }}>
            {t('home.whyMediport')}
          </h2>
        </div>
        <div className="trust-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {items.map(({ icon, title, desc }) => (
            <div key={title} className="trust-item"
              style={{ padding: '18px', borderRadius: 14, border: '1px solid var(--color-border-primary)', background: 'var(--color-background-secondary)', transition: 'border-color 0.2s ease, box-shadow 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-brand-teal)'; e.currentTarget.style.background = 'var(--color-brand-teal-tint)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(24,175,169,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-primary)'; e.currentTarget.style.background = 'var(--color-background-secondary)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--color-brand-teal), var(--color-brand-teal-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, marginBottom: 12 }}>
                {icon}
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-brand-navy)', marginBottom: 6 }}>{title}</h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

const HowItWorksSection = memo(function HowItWorksSection({ t }) {
  return (
    <section className="home-section" style={{ padding: '32px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: 'var(--color-brand-teal)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{t('home.simpleProcess')}</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 600, margin: 0 }}>
            {t('home.howItWorks')}
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}
          className="how-it-works-grid">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.step} style={{ textAlign: 'center', position: 'relative' }}>
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="how-it-works-step-line" style={{ position: 'absolute', top: 32, left: '60%', width: '80%',
                  height: 2, background: 'var(--color-border-primary)', zIndex: 0 }} />
              )}
              <div style={{ position: 'relative', zIndex: 1, background: '#fff',
                borderRadius: 14, padding: '20px 16px', border: '1px solid var(--color-border-primary)' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-brand-teal), var(--color-brand-teal-light))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px', fontSize: 22, color: '#fff' }}>
                  {step.icon}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-brand-teal)',
                  marginBottom: 6 }}>{step.step}</div>
                <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{step.title}</h3>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

const B2BSection = memo(function B2BSection({ t, stats }) {
  const router = useRouter();
  return (
    <section className="home-section" style={{ padding: '28px 24px', background: 'var(--section-b2b)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <div className="b2b-banner" style={{ background: 'linear-gradient(135deg, var(--color-brand-navy) 0%, #002B78 100%)',
        borderRadius: 20, padding: '32px 36px', overflow: 'hidden', position: 'relative' }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: '-20%', right: '10%', width: 'min(400px, 100%)', height: 'min(400px, 100%)',
          background: 'radial-gradient(circle, var(--color-brand-teal), transparent 70%)', opacity: 0.15 }} />
        <div className="b2b-cols" style={{ position: 'relative', display: 'grid',
          gridTemplateColumns: '1fr 220px', gap: 40, alignItems: 'center' }}>
          {/* Left */}
          <div>
            <span style={{ fontSize: 11, background: 'rgba(0,208,202,0.2)', color: 'var(--color-brand-teal-light)',
              padding: '4px 14px', borderRadius: 999, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('home.b2bProgram')}</span>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 600,
              color: '#fff', margin: '14px 0 12px' }}>
              {t('home.b2bTitle')}
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 24, lineHeight: 1.8 }}>
              {t('home.b2bDesc')}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 460, marginBottom: 28 }}>
              {B2B_FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  <span style={{ color: 'var(--color-brand-teal-light)', fontWeight: 600 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn-teal-hover"
                onClick={() => router.push('/register?type=b2b')}
                style={{ padding: '13px 28px', background: 'var(--color-brand-teal)', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {t('home.registerB2B')}
              </button>
              <button onClick={() => router.push('/b2b')}
                style={{ padding: '13px 24px', background: 'rgba(255,255,255,0.1)',
                  border: '1.5px solid rgba(255,255,255,0.25)', color: '#fff',
                  borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                {t('home.learnMore')}
              </button>
            </div>
          </div>
          {/* Right stat boxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {B2B_STATS.map((s, i) => ({
              ...s,
              val: i === 0
                ? (stats.totalB2BClients > 0 ? `${stats.totalB2BClients.toLocaleString()}+` : '0+')
                : s.val,
            })).map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                padding: '14px 18px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{s.label}</span>
                <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-brand-teal-light)' }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </section>
  );
});

const TYPEWRITER_WORDS = ['Diagnostic Equipment', 'Surgical Instruments', 'Laboratory Reagents', 'Hospital Machines'];
const SEARCH_PLACEHOLDERS = ['Search ECG machine...', 'Search HbA1c reagent...', 'Search trocar set...', 'Search pulse oximeter...'];

const TypewriterText = memo(function TypewriterText() {
  const [text, setText] = useState('Diagnostic Equipment');

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % TYPEWRITER_WORDS.length;
      setText(TYPEWRITER_WORDS[i]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return <span key={text} className="typewriter-text" style={{ display: 'inline-block' }}>{text}</span>;
});

// Hero left column — owns the cycling search placeholder; the search box
// manages its own query state.
const HeroSearch = memo(function HeroSearch() {
  const router = useRouter();
  const t = useT();
  const [placeholder, setPlaceholder] = useState(SEARCH_PLACEHOLDERS[0]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % SEARCH_PLACEHOLDERS.length;
      setPlaceholder(SEARCH_PLACEHOLDERS[i]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero-left-content hidden lg:block">
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,208,202,0.15)', border: '1px solid rgba(0,208,202,0.3)', color: 'var(--color-brand-teal-light)', fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 999, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        <span style={{ width: 6, height: 6, background: 'var(--color-brand-teal-light)', borderRadius: '50%', animation: 'pulse-dot 2s infinite' }} />
        {t('home.tagline')}
      </div>
      <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 600, color: '#fff', lineHeight: 1.15, marginBottom: 12 }}>
        {t('home.heroTitle')}<br />
        <span style={{ color: 'var(--color-brand-teal-light)' }}>
          <TypewriterText />
        </span>
      </h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 20, maxWidth: 480, lineHeight: 1.6 }}>
        {t('home.heroSubtitle')}
      </p>
      <div style={{ maxWidth: 520, marginBottom: 16, width: '100%' }}>
        <EnhancedSearchBox placeholder={placeholder} variant="hero" />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {SEARCH_SUGGESTIONS.map(q => (
          <button key={q} onClick={() => router.push(`/products?q=${encodeURIComponent(q)}`)}
            style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.85)', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
});

// Hero right panel — owns slide index, hover state, scroll-pause and autoplay
// so scroll/hover/timer churn never touches the rest of the page.
const HeroSlider = memo(function HeroSlider({ slides }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const activeSlides = slides.filter(s => s.isActive).length || 1;

  // Pause autoplay while the user is scrolling — state lives here, not the page
  useEffect(() => {
    let scrollTimeout;
    let ticking = false;

    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setIsScrolling(false), 200);
      ticking = false;
    };

    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  useEffect(() => {
    if (isHovered || isScrolling) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % activeSlides);
    }, 7000);
    return () => clearInterval(interval);
  }, [isHovered, isScrolling, activeSlides]);

  // Keyboard navigation
  useEffect(() => {
const handleKeyDown = (e) => {
      const total = slides.length > 0 ? slides.length : 1;
      if (e.key === 'ArrowLeft') {
        setCurrentSlide(prev => (prev - 1 + total) % total);
      } else if (e.key === 'ArrowRight') {
        setCurrentSlide(prev => (prev + 1) % total);
      }
    };

    const sliderEl = document.querySelector('.hero-right-panel');
    sliderEl?.addEventListener('keydown', handleKeyDown);
    return () => sliderEl?.removeEventListener('keydown', handleKeyDown);
  }, [slides]);

  const total = slides.length > 0 ? slides.length : 1;
  const [failedSlide, setFailedSlide] = useState(null);

  return (
    <div
      className="hero-right-panel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {slides.length > 0 ? (
        slides.map((slide, i) => currentSlide === i && (
          <div key={slide._id || slide.imageUrl || i} className="slide-active" style={{ position: 'absolute', inset: 0 }}>
            {failedSlide === i ? (
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 25% 15%, rgba(0,208,202,0.35), transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(24,175,169,0.5), transparent 60%), linear-gradient(140deg, #001D5D 0%, #12355f 60%, #18AFA9 140%)' }} />
            ) : (
              <Image
                src={slide.imageUrl}
                alt={slide.altText || `Medical equipment Bangladesh slide ${i + 1} — MediportBD`}
                fill
                sizes="(max-width: 768px) 100vw, 52vw"
                style={{ objectFit: 'cover' }}
                priority={i === 0}
                onError={() => setFailedSlide(i)}
              />
            )}
          </div>
        ))
      ) : (
        <div className="slide-active" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 25% 15%, rgba(0,208,202,0.35), transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(24,175,169,0.5), transparent 60%), linear-gradient(140deg, #001D5D 0%, #12355f 60%, #18AFA9 140%)' }} />
      )}
      {/* Bottom gradient */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)', zIndex: 5 }} />
      {/* Dots */}
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 10 }}>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={`dot-${i}`}
            onClick={() => setCurrentSlide(i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setCurrentSlide(i);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={currentSlide === i ? 'true' : 'false'}
            style={{ display: 'flex', width: 24, height: 24, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <span style={{ display: 'block', width: currentSlide === i ? 20 : 7, height: 7, borderRadius: 999, background: currentSlide === i ? 'var(--color-brand-teal-light)' : 'rgba(255,255,255,0.5)', transition: 'width 0.3s ease, background 0.3s ease' }} />
          </span>
        ))}
      </div>
      {/* Counter */}
      <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 10, color: '#fff', fontSize: 11, fontWeight: 600, background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: 20 }}>
        {String(currentSlide + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
      {/* Arrows */}
      <button
        onClick={() => setCurrentSlide(prev => (prev - 1 + total) % total)}
        aria-label="Previous slide"
        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 18, cursor: 'pointer', zIndex: 10, opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s' }}
        className="hero-slider-arrows"
      >
        ‹
      </button>
      <button
        onClick={() => setCurrentSlide(prev => (prev + 1) % total)}
        aria-label="Next slide"
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 18, cursor: 'pointer', zIndex: 10, opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s' }}
        className="hero-slider-arrows"
      >
        ›
      </button>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// MAIN HOMEPAGE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

// Homepage-scoped styles — hoisted to module scope so the 200-line style string
// is created ONCE instead of on every HomePage render.
const HOME_STYLES = `
        /* OPTIMIZED ANIMATIONS - Phase 3 */
        /* Kept only essential animations, removed expensive continuous animations */

        /* Skeleton shimmer - DISABLED in production for performance */
        .skeleton {
          background: ${process.env.NODE_ENV === 'production' ? '#f0f0f0' : 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)'};
          background-size: 200% 100%;
          ${process.env.NODE_ENV !== 'production' ? 'animation: shimmer 1.4s infinite;' : ''}
          border-radius: 6px;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* Stable product grid heights - reserve space so skeleton/empty-state
           swaps never collapse the section (prevents CLS) */
        .stable-product-grid, .featured-products-panel { min-height: 420px; }
        @media (min-width: 768px) {
          .stable-product-grid { min-height: 780px; }
          .featured-products-panel { min-height: 780px; }
        }

        /* Marquee - CONVERTED to static scroll for better performance */
        .marquee-wrap {
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .marquee-wrap::-webkit-scrollbar { display: none; }

        /* Hide scrollbar on tab row */
        [role="tablist"]::-webkit-scrollbar { display: none; }
        .marquee-track {
          display: flex;
          width: max-content;
          /* animation: marquee 25s linear infinite; - REMOVED for performance */
        }

        /* Product cards - Simplified transitions */
        .product-card-hover {
          transition: box-shadow 0.2s ease, transform 0.15s ease;
          contain: layout style paint;
        }
        .product-card-hover:hover {
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          transform: translateY(-3px);
        }

        /* Category tiles - Kept (lightweight) */
        .cat-tile { transition: box-shadow 0.2s ease, border-color 0.2s ease; }
        .cat-tile:hover { border-color: var(--color-brand-teal) !important; }
        .cat-tile:hover .cat-tile-arrow { opacity: 1 !important; transform: translateX(3px) !important; }

        /* Section entrance - SIMPLIFIED (removed fadeInUp animation) */
        .section-in { opacity: 1; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        /* Button states - Kept (essential UX) */
        .tab-active { background: var(--color-brand-navy) !important; color: #fff !important; }
        .pill-hover:hover { background: rgba(255,255,255,0.2) !important; }
        .btn-primary-hover:hover { background: #0a1f3d !important; }
        .btn-teal-hover:hover { background: var(--color-brand-teal-hover) !important; transform: scale(1.02); }

        /* Trust badges - Kept (lightweight) */
        .trust-item { transition: transform 0.2s ease; }
        .trust-item:hover { transform: translateY(-2px); }

        /* Hero content - SIMPLIFIED stagger animation */
        .hero-content > * { opacity: 1; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

        /* REMOVED expensive continuous animations */
        /* .floating-card - REMOVED (constant GPU work) */
        /* .orb-drift - REMOVED (expensive transform animation) */
        .floating-card { /* animation removed for performance */ }
        .orb-drift { /* animation removed for performance */ }

        /* Slider transitions - Kept but simplified */
        .slide-active { opacity: 1; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

        /* Typewriter - Kept (essential feature) */
        .typewriter-text { opacity: 1; }
        @keyframes fadeSlide { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }

        /* Quick add button - Kept (essential UX) */
        div:hover .quick-add-btn { opacity: 1 !important; }

        /* Hero layout - Optimized grid */
        .hero-grid-container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(480px, 52%);
          gap: 24px;
          align-items: center;
        }
        .hero-left-content { order: 1; }
        .hero-right-panel {
          order: 2;
          position: relative;
          height: 400px;
          border-radius: 16px;
          overflow: hidden;
          background: #1a3a5c;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        }
        /* Tablet breakpoint: prevent horizontal overflow */
        @media (max-width: 1279px) and (min-width: 769px) {
          .hero-grid-container {
            grid-template-columns: minmax(0, 1fr) minmax(0, 48%);
            gap: 16px;
            padding: 0 16px;
          }
          .hero-right-panel { height: 330px; }
        }
        @media (min-width: 1280px) {
          .hero-grid-container { grid-template-columns: minmax(0, 1fr) minmax(560px, 58%); gap: 28px; }
          .hero-right-panel { height: 440px; }
        }
        @media (min-width: 1536px) {
          .hero-grid-container { grid-template-columns: minmax(0, 1fr) 640px; }
          .hero-right-panel { height: 460px; }
        }
        /* Custom scrollbar for category navigation */
        *::-webkit-scrollbar { height: 6px; }
        *::-webkit-scrollbar-track { background: var(--color-background-muted); border-radius: 10px; }
        *::-webkit-scrollbar-thumb { background: var(--color-border-secondary); border-radius: 10px; }
        *::-webkit-scrollbar-thumb:hover { background: var(--color-text-tertiary); }

        /* Hide scrollbars for horizontal scroll sections (mobile) */
        .scrollbar-hide {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none; /* Chrome/Safari/Opera */
        }

        /* Scroll fade indicators for horizontal scrolling sections */
        @media (max-width: 768px) {
          .featured-products-panel::before,
          .featured-products-panel::after {
            content: '';
            position: absolute;
            top: 0;
            bottom: 20px; /* Above the padding */
            width: 30px;
            pointer-events: none;
            z-index: 5;
            transition: opacity 0.3s;
          }
          .featured-products-panel::before {
            left: 0;
            background: linear-gradient(to right, rgba(255,255,255,0.9), transparent);
          }
          .featured-products-panel::after {
            right: 0;
            background: linear-gradient(to left, rgba(255,255,255,0.9), transparent);
          }
        }

        /* Smooth momentum scrolling on iOS */
        #featured-scroll-container {
          -webkit-overflow-scrolling: touch;
        }

        /* Smooth scrolling for horizontal sections */
        .scroll-smooth {
          scroll-behavior: smooth;
        }
        /* Category section styles */
        .category-section { padding: 28px 0; border-bottom: 1px solid var(--color-border-primary); }
        .category-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; padding: 0 24px; }
        .category-title-accent { display: flex; align-items: center; gap: 10px; }
        .category-title-accent::before { content: ''; width: 4px; height: 20px; background: var(--color-brand-teal); border-radius: 2px; }
        .category-product-row { display: flex; gap: 12px; overflow-x: auto; padding: 0 24px 6px; scrollbar-width: none; -ms-overflow-style: none; }
        .category-product-row::-webkit-scrollbar { display: none; }
        @media (max-width: 768px) {
          /* Remove extra spacing on mobile */
          .coupon-banner-section { padding: 0 !important; margin: 0 !important; }
          .category-section { padding: 16px 0 !important; }

          .hero-grid-container { grid-template-columns: 1fr !important; gap: 24px !important; padding: 0 16px; }
          .hero-left-content { order: 2; }
          .hero-right-panel { order: 1; display: block !important; height: 260px !important; border-radius: 14px !important; }
          .prod-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .cat-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .trust-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .how-it-works-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .hero-right-panel { height: 220px !important; border-radius: 12px !important; }
          .hero-slider-arrows { display: none !important; }
          .prod-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .stats-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .trust-grid { grid-template-columns: 1fr !important; }
          .b2b-cols { grid-template-columns: 1fr !important; }
          .b2b-banner { padding: 28px 20px !important; }
          .how-it-works-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 1024px) {
          .how-it-works-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .how-it-works-step-line { display: none; }
          .b2b-cols { grid-template-columns: 1fr !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
        }
      `;

export default function HomePage({ initialData = null, initialSettings = null }) {
  const router = useRouter();
  const t = useT();

  // ── State ──────────────────────────────────────────────────────────────────
  // Seeded from server-rendered (ISR) data when available — SSR HTML contains
  // the full home content instead of an empty skeleton.
  const [categories, setCategories] = useState(() => initialData?.categories?.length ? initialData.categories : []);
  const [categoryCounts, setCategoryCounts] = useState(() => initialData?.categoryCounts || {});
  const [promo, setPromo] = useState(() => initialData?.activePromo || null);
  // Zeroes, not fabricated defaults: a medical-supplier site must never
  // display invented trust numbers ("40 brands", "1200+ B2B clients") when
  // the stats API fails — the previous fallback rendered fiction as fact.
  const [stats, setStats] = useState(() => initialData?.stats || { totalProducts: 0, totalBrands: 0, totalOrders: 0, totalB2BClients: 0 });
  const [siteSettings, setSiteSettings] = useState(() => initialSettings);
  const [heroSlides, setHeroSlides] = useState(() => initialSettings?.heroSlides?.length
    ? initialSettings.heroSlides.filter(sl => sl.isActive).sort((a, b) => a.order - b.order)
    : []);

  // ── Memoized Values ────────────────────────────────────────────────────────
  const whyUsItems = useMemo(() => buildWhyUs(siteSettings), [siteSettings]);
  const navCategories = useMemo(() => {
    if (categories.length > 0) {
      // Hide empty categories (productCount 0) so visitors never land on
      // an empty grid; fall back treats missing productCount as populated.
      return categories
        .filter(cat => (cat.productCount ?? 1) > 0)
        .slice(0, 16);
    }
    return [
      { name: 'Lab Reagents', emoji: '🧪', color: '#FAF5FF', slug: 'laboratory-reagents' },
      { name: 'Hospital Machines', emoji: '🏥', color: 'var(--color-status-warning-tint)', slug: 'hospital-machines' },
      { name: 'Lab Equipment', emoji: '🔬', color: 'var(--color-status-success-tint)', slug: 'lab-equipment' },
      { name: 'PPE & Safety', emoji: '🛡️', color: 'var(--color-status-danger-tint)', slug: 'ppe-and-safety' },
      { name: 'Implants', emoji: '🦴', color: 'var(--color-background-secondary)', slug: 'implants-ortho' },
      { name: 'Diagnostic', emoji: '🩺', color: 'var(--color-status-info-tint)', slug: 'diagnostic-equipment' },
      { name: 'Surgical', emoji: '💉', color: 'var(--color-status-success-tint)', slug: 'surgical-instruments' },
    ];
  }, [categories]);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Load banner settings (deduped/cached via fetchWithRetry)
  useEffect(() => {
    if (initialSettings) return;

    const loadBanners = async () => {
      try {
        const res = await fetchWithRetry(`${API}/settings`);
        const data = await res.json();
        const s = data.data || {};
        if (s.heroSlides?.length) {
          setHeroSlides(s.heroSlides.filter(sl => sl.isActive).sort((a, b) => a.order - b.order));
        }
        // Store full settings for WHY_US
        setSiteSettings(s);
      } catch {
        if (process.env.NODE_ENV !== 'production') console.warn('[HomePage] Failed to load banners');
      }
    };
    loadBanners();
  }, [initialSettings]);

  // Note: featured products, new arrivals and testimonials are fetched by
  // their own below-fold sections when they mount (see LazyMount slots in
  // the render + src/utils/homeDataClient.js). Nothing here fetches during
  // the initial load window.

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen home-page-root">
      {/* Global Styles — static string, not recreated per render */}
      <style>{HOME_STYLES}</style>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: HERO — left: text+search  |  right: image slider */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="home-hero home-hero--padded">
        <div className="hero-grid-container">
          <HeroSearch />
          <HeroSlider slides={heroSlides} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: CATEGORY NAVIGATION (Othoba-style circular icons) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="home-section" style={{ padding: '20px 0', borderBottom: '1px solid var(--color-border-primary)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--color-brand-teal)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{t('home.ourCatalog')}</p>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 600, margin: 0 }}>
                {t('home.shopByCategory')}
              </h2>
            </div>
          </div>

          {/* Horizontal scrollable category circles - Dynamic from API */}
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8,
            scrollbarWidth: 'thin', scrollbarColor: '#E5E7EB transparent' }}>
            {/* Show first 16 categories from API, or fallback to hardcoded if loading */}
            {navCategories.map((cat, index) => {
              const categoryName = cat.name || cat;
              const categorySlug = cat.slug || CATEGORY_NAME_TO_SLUG[categoryName] || categoryName.toLowerCase().replace(/\s+/g, '-');
              const categoryPath = `/products/category/${categorySlug}`;
              const productCount = cat.productCount || categoryCounts[categoryName] || 0;

              // Category icons mapping
              const iconMap = {
                'Lab Reagents': '🧪', 'Laboratory Reagents': '🧪',
                'Hospital Machines': '🏥',
                'Lab Equipment': '🔬', 'Laboratory Equipment': '🔬',
                'PPE & Safety': '🛡️',
                'Implants': '🦴', 'Implants & Ortho': '🦴',
                'Diagnostic': '🩺', 'Diagnostic Equipment': '🩺', 'Diagnostic Devices': '🩺',
                'Surgical': '💉', 'Surgical Instruments': '💉', 'Surgical & Wound Care': '🩹',
                'Medical Devices': '🏥',
                'Medical Supplies': '🏥',
                'Consumables': '📦',
                'Orthopedic Supports': '🦴',
                'Diabetes Care': '💊',
                'Blood Bank Supplies': '🩸',
                'IV & Infusion Therapy': '💧',
                'Ophthalmology & ENT Equipment': '👁️',
                'Physiotherapy & Rehabilitation': '🏃',
                'Respiratory Equipment': '😷',
                'Compression Garments': '👕',
              };

              const emoji = cat.emoji || iconMap[categoryName] || '🏥';
              const colors = ['#FAF5FF', 'var(--color-status-warning-tint)', 'var(--color-status-success-tint)', '#FFF1F2', '#F5F8FB', '#EFF6FF', '#F0FDF4', '#FFFBEB'];
              const color = cat.color || colors[index % colors.length];

              return (
                <div key={categoryName} onClick={() => router.push(categoryPath)}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(categoryPath); } }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                    minWidth: 88, cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  {/* Circular icon */}
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, marginBottom: 6, border: '2px solid var(--color-border-primary)',
                    transition: 'transform 0.2s ease' }}>
                    {emoji}
                  </div>
                  {/* Category name */}
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)',
                    textAlign: 'center', lineHeight: 1.3, maxWidth: 88, overflow: 'hidden',
                    textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' }}>
                    {categoryName}
                  </span>
                  {/* Product count */}
                  {productCount > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 1 }}>
                      {productCount} items
                    </span>
                  )}
                </div>
              );
            })}

            {/* View All button */}
            <div onClick={() => router.push('/products')}
              role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/products'); } }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                minWidth: 88, cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-brand-teal), var(--color-brand-teal-light))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, marginBottom: 6, border: '2px solid var(--color-brand-teal)',
                color: '#fff', fontWeight: 600 }}>
                →
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-brand-teal)',
                textAlign: 'center' }}>
                {t('home.viewAll')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Below-fold content is skipped until scrolled near — see .cv-lazy-stack in globals.css */}
      <div className="cv-lazy-stack">
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: FLASH DEALS (Time-sensitive, creates urgency) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="cv-slot--flash">
        <LazyMount fallback={null}>
          <Suspense fallback={null}>
            <FlashDealsSection />
          </Suspense>
        </LazyMount>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: BEST SELLING PRODUCTS (Social proof, rankings) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <LazyMount fallback={
        <div className="best-selling-slot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </div>
      }>
        <BestSellingSection />
      </LazyMount>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: FEATURED PRODUCTS (Curated selection with tabs) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="cv-slot--featured">
        <LazyMount fallback={null}>
          <Suspense fallback={null}>
            <FeaturedProductsSection categories={categories} />
          </Suspense>
        </LazyMount>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* COUPON BANNER: Show active promo code when available */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {promo && (
        <section className="coupon-banner-section" style={{ padding: '14px 16px', background: 'var(--section-coupon)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{
            background: 'var(--color-background-primary)',
            border: '1px solid rgba(255,107,0,0.25)',
            borderRadius: 12,
            padding: '18px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 28 }}>🎟️</span>
              <div>
                <div style={{ color: 'var(--color-brand-navy)', fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
                  {promo.type === 'percentage'
                    ? `${promo.value}% OFF your order`
                    : `৳${promo.value?.toLocaleString()} OFF your order`}
                  {promo.minPurchase > 0 && (
                    <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                      {' '}on orders over ৳{promo.minPurchase?.toLocaleString()}
                    </span>
                  )}
                </div>
                {promo.description && (
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{promo.description}</div>
                )}
                {promo.endDate && (
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: 11, marginTop: 2 }}>
                    Expires: {new Date(promo.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                background: 'var(--section-coupon)',
                border: '2px dashed var(--section-coupon-accent)',
                borderRadius: 8,
                padding: '8px 18px',
              }}>
                <span style={{ color: 'var(--section-coupon-accent)', fontWeight: 800, fontSize: 18, letterSpacing: '0.1em' }}>
                  {promo.code}
                </span>
              </div>
              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined') {
                    navigator.clipboard.writeText(promo.code).then(() => {
                      // Show brief feedback
                      const el = document.getElementById('coupon-copy-btn');
                      if (el) { el.textContent = 'Copied!'; setTimeout(() => { el.textContent = 'Copy'; }, 2000); }
                    }).catch(() => {});
                  }
                }}
                id="coupon-copy-btn"
                style={{
                  background: 'var(--color-brand-teal)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 18px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.2s',
                }}
              >
                Copy
              </button>
            </div>
          </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 6: PROMOTIONAL BANNER 1 (Visual break after featured products) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="cv-slot--promo">
        <LazyMount fallback={null}>
          <Suspense fallback={null}>
            <PromoBannerSection bannerId={0} />
          </Suspense>
        </LazyMount>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 7: CATEGORY PRODUCT SECTIONS (Deep product discovery) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="cv-slot--category">
        <LazyMount fallback={null}>
          <Suspense fallback={null}>
            <CategoryProductSections categories={categories} />
          </Suspense>
        </LazyMount>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 8: NEW ARRIVALS (Fresh inventory, auto slider) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="cv-slot--new-arrivals">
        <LazyMount fallback={null}>
          <Suspense fallback={
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <Spinner />
            </div>
          }>
            <NewArrivalSlider />
          </Suspense>
        </LazyMount>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 9: PROMOTIONAL BANNER 2 (Second marketing push) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="cv-slot--promo">
        <LazyMount fallback={null}>
          <Suspense fallback={null}>
            <PromoBannerSection bannerId={1} />
          </Suspense>
        </LazyMount>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 10: RECENTLY VIEWED (Personalized recommendations) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="home-section" style={{ padding: '28px 24px 20px', background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <LazyMount fallback={null}>
            <Suspense fallback={null}>
              <RecentlyViewed limit={8} title="Continue Where You Left Off" />
            </Suspense>
          </LazyMount>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 11: WHY CHOOSE US (Trust building, credibility) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <WhyChooseUsSection t={t} items={whyUsItems} />

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 12: HOW IT WORKS (Process clarity, user guidance) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <HowItWorksSection t={t} />

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 13: B2B PROGRAM (Business customer acquisition) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <B2BSection t={t} stats={stats} />

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 14: SUPPORT & RESOURCES (Additional value, help center) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="cv-slot--support">
        <LazyMount fallback={null}>
          <Suspense fallback={
            <div style={{ padding: '56px 24px', background: 'var(--color-background-secondary)' }}>
              <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
                <Spinner size="lg" variant="medical" />
              </div>
            </div>
          }>
            <SupportResources />
          </Suspense>
        </LazyMount>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 15: VIDEO SECTION (Engagement, brand storytelling) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="cv-slot--video">
        <LazyMount fallback={null}>
          <Suspense fallback={
            <section style={{ padding: '60px 24px', background: 'linear-gradient(135deg, var(--color-brand-navy) 0%, #002B78 100%)' }}>
              <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 32, alignItems: 'center', justifyContent: 'center' }}>
                <Spinner size="lg" variant="medical" />
              </div>
            </section>
          }>
            <VideoSection />
          </Suspense>
        </LazyMount>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 16: CUSTOMER TESTIMONIALS (Final social proof) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="cv-slot--testimonials">
        <LazyMount fallback={null}>
          <Suspense fallback={null}>
            <TestimonialsSection />
          </Suspense>
        </LazyMount>
      </div>
      </div>
    </div>
  );
}
