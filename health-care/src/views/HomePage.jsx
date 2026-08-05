'use client';

import { useState, useEffect, useRef, useCallback, memo, useMemo, lazy, Suspense } from 'react';
import { showToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useT } from '@/hooks/useT';
import Spinner, { ProductCardSkeleton, LoadingOverlay } from '@/components/ui/Spinner';
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
import { CATEGORY_NAME_TO_SLUG } from '@/constants/categories';
import EnhancedSearchBox from '@/components/search/EnhancedSearchBox';
import { getProductCardImage, getHeroImage } from '@/utils/cloudinary';
import RecentlyViewed from '@/components/product/RecentlyViewed';
import FlashDealsSection from '@/components/home/FlashDealsSection';
import CategoryProductSections from '@/components/home/CategoryProductSections';

// Lazy load heavy components for better performance
const SupportResources = lazy(() => import('@/components/home/SupportResources'));
const VideoSection = lazy(() => import('@/components/home/VideoSection'));
const NewArrivalSlider = lazy(() => import('@/components/home/NewArrivalSlider'));
const BestSellingSection = lazy(() => import('@/components/home/BestSellingSection'));
const ProductGridWithPromoBanners = lazy(() => import('@/components/home/ProductGridWithPromoBanners'));

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

const ANNOUNCEMENTS = [
  { icon: <FaTruck />, text: 'Free delivery on orders over ৳50,000 — Dhaka, Chittagong & Sylhet' },
  { icon: <FaSnowflake />, text: 'Cold chain delivery available for temperature-sensitive reagents' },
  { icon: <FaTag />, text: 'B2B institutions get up to 30% bulk discount — Register today' },
];

function buildAnnouncements(settings) {
  const threshold = settings?.freeDeliveryThreshold
    ? `৳${settings.freeDeliveryThreshold.toLocaleString()}`
    : '৳50,000';
  const maxDiscount = settings?.b2bMaxDiscount ?? 30;
  return [
    { icon: <FaTruck />, text: `Free delivery on orders over ${threshold} — Dhaka, Chittagong & Sylhet` },
    { icon: <FaSnowflake />, text: 'Cold chain delivery available for temperature-sensitive reagents' },
    { icon: <FaTag />, text: `B2B institutions get up to ${maxDiscount}% bulk discount — Register today` },
  ];
}

// WHY_US is built dynamically from settings — see buildWhyUs() below
const HOW_IT_WORKS = [
  { step: 1, icon: <FaSearch />, title: 'Browse & Search', desc: 'Find products from 50+ global brands' },
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

// Using ProductCardSkeleton from @/components/ui/Spinner for consistency

const ProductCard = memo(function ProductCard({ product, onClick }) {
  const { addToCart } = useCart();
  const t = useT();
  const imgRaw = product.images?.[0];
  const img = typeof imgRaw === 'string' ? imgRaw : imgRaw?.url;
  // Apply Cloudinary optimization — saves ~100-200KB per card image
  const optimizedImg = img ? getProductCardImage(img) : null;
  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const ratingVal = typeof product.rating === 'object' ? product.rating?.average : (product.rating || 0);
  const reviewCount = product.reviewCount || product.rating?.count || 0;
  const price = product.price || 0;
  const oldPrice = product.oldPrice || 0;
  const discount = product.discountPct || (oldPrice > price && oldPrice > 0
    ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0);
  const hasDiscount = discount > 0 && oldPrice > price;
  const inStock = product.stock === undefined || product.stock > 0;

  return (
    <div onClick={onClick} className="group"
      role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
      style={{ background: '#fff', borderRadius: 14, overflow: 'hidden',
        border: '1px solid var(--color-border-primary)', cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(11,37,69,0.12)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>

      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: 'var(--color-background-secondary)', overflow: 'hidden', flexShrink: 0 }}>
        {optimizedImg ? (
          <Image 
            src={optimizedImg} 
            alt={`${product.name}${brandName ? ` — ${brandName}` : ''} — Price ৳${price > 0 ? price.toLocaleString() : 'on request'} Bangladesh`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ objectFit: 'cover' }}
            className="group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 52, color: '#CBD5E1' }}>🏥</div>
        )}
        {/* Badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {hasDiscount && (
            <span style={{ background: 'var(--color-status-danger)', color: '#fff', fontSize: 10, fontWeight: 600,
              padding: '3px 8px', borderRadius: 6 }}>-{discount}%</span>
          )}
          {!inStock && (
            <span style={{ background: 'var(--color-text-secondary)', color: '#fff', fontSize: 10, fontWeight: 600,
              padding: '3px 8px', borderRadius: 6 }}>{t('common.outOfStock')}</span>
          )}
        </div>
        {/* Quick add button on hover */}
        <button
          onClick={e => { e.stopPropagation(); addToCart(product, 1); }}
          style={{ position: 'absolute', bottom: 10, right: 10, background: 'var(--color-brand-teal)',
            color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px',
            fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--color-brand-teal-hover)'; }}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--color-brand-teal)'}
          className="quick-add-btn">
          + {t('nav.cart')}
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {brandName && (
          <div style={{ fontSize: 10, color: 'var(--color-brand-teal)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            {brandName}
          </div>
        )}
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45, marginBottom: 6, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          color: '#1F2937' }}>
          {product.name}
        </div>
        {ratingVal > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            {[1,2,3,4,5].map(s => (
              <span key={s} style={{ color: s <= Math.round(ratingVal) ? 'var(--color-warning)' : '#E5E7EB', fontSize: 13 }}>★</span>
            ))}
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>({reviewCount})</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-brand-navy)' }}>
            {price > 0 ? `৳${price.toLocaleString()}` : t('common.contactForPrice')}
          </span>
          {hasDiscount && (
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', textDecoration: 'line-through' }}>
              ৳{oldPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// MAIN HOMEPAGE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const t = useT();

  // ── State ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [typewriterText, setTypewriterText] = useState('Diagnostic Equipment');
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [dealProducts, setDealProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [promo, setPromo] = useState(null);
  const [stats, setStats] = useState({ totalProducts: 0, totalBrands: 50, totalOrders: 0, totalB2BClients: 1200 });
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  const [testimonials, setTestimonials] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSliderHovered, setIsSliderHovered] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [heroSlides, setHeroSlides] = useState([]);
  const [promoBanner, setPromoBanner] = useState(null);
  const [bannersLoaded, setBannersLoaded] = useState(false);
  const [searchPlaceholder, setSearchPlaceholder] = useState('Search ECG machine...');
  const [labEquipmentProducts, setLabEquipmentProducts] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState({
    diagnostic: [],
    reagents: [],
    machines: [],
    ppe: [],
    labEquipment: [],
  });
  
  // Loading states for all sections
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dealLoading, setDealLoading] = useState(true);
  const [newArrivalsLoading, setNewArrivalsLoading] = useState(true);
  const [categoryProductsLoading, setCategoryProductsLoading] = useState(true);
  
  // ── Memoized Values ────────────────────────────────────────────────────────
  const whyUsItems = useMemo(() => buildWhyUs(siteSettings), [siteSettings]);
  const announcementItems = useMemo(() => buildAnnouncements(siteSettings), [siteSettings]);
  const navCategories = useMemo(() => {
    if (categories.length > 0) return categories.slice(0, 16);
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
  const topCategories = useMemo(() =>
    categories.filter(cat => cat.productCount && cat.productCount > 0)
      .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
      .slice(0, 5),
    [categories]
  );
  
  // ── Effects ────────────────────────────────────────────────────────────────

  // Sticky navbar - throttled for better performance
  useEffect(() => {
    let ticking = false;
    const handler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 60);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Typewriter effect - increased interval for better performance
  useEffect(() => {
    const words = ['Diagnostic Equipment', 'Surgical Instruments', 'Laboratory Reagents', 'Hospital Machines'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % words.length;
      setTypewriterText(words[i]);
    }, 5000); // Increased from 3000ms to 5000ms for performance
    return () => clearInterval(interval);
  }, []);

  // Hero slider auto-play - paused during hover or scroll for performance
  useEffect(() => {
    if (isSliderHovered || isScrolling) return;
    const count = heroSlides.filter(s => s.isActive).length || 1;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % count);
    }, 7000); // Increased from 5000ms to 7000ms for performance
    return () => clearInterval(interval);
  }, [isSliderHovered, isScrolling, heroSlides]);
  
  // Pause animations during scroll for better performance
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

  // Hero slider keyboard navigation (Left/Right arrow keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const total = heroSlides.length > 0 ? heroSlides.length : 1;
      if (e.key === 'ArrowLeft') {
        setCurrentSlide(prev => (prev - 1 + total) % total);
      } else if (e.key === 'ArrowRight') {
        setCurrentSlide(prev => (prev + 1) % total);
      }
    };
    
    const sliderEl = document.querySelector('.hero-right-panel');
    sliderEl?.addEventListener('keydown', handleKeyDown);
    return () => sliderEl?.removeEventListener('keydown', handleKeyDown);
  }, [heroSlides]);

  // Load banner settings
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const res = await fetch(`${API}/settings`);
        const data = await res.json();
        const s = data.data || {};
        if (s.heroSlides?.length) {
          setHeroSlides(s.heroSlides.filter(sl => sl.isActive).sort((a, b) => a.order - b.order));
        }
        if (s.promoBanner?.imageUrl) {
          setPromoBanner(s.promoBanner);
        }
        // Store full settings for WHY_US and dynamic announcements
        setSiteSettings(s);
      } catch {
        if (process.env.NODE_ENV !== 'production') console.warn('[HomePage] Failed to load banners');
      } finally {
        setBannersLoaded(true);
      }
    };
    loadBanners();
  }, []);

  // Search placeholder cycling - increased interval for performance
  useEffect(() => {
    const placeholders = ['Search ECG machine...', 'Search HbA1c reagent...', 'Search trocar set...', 'Search pulse oximeter...'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % placeholders.length;
      setSearchPlaceholder(placeholders[i]);
    }, 4000); // Increased from 2s to 4s
    return () => clearInterval(interval);
  }, []);

  // Countdown timer - counts to midnight (reduced frequency for performance)
  useEffect(() => {
    const getTimeUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);  // next midnight
      const diff = midnight - now;
      return {
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      };
    };
    
    // Use a function to initialize state instead of calling setState directly
    const updateTime = () => setTimeLeft(getTimeUntilMidnight());
    updateTime(); // set immediately on mount
    
    // Update every 5 seconds instead of every second to reduce re-renders
    const t = setInterval(updateTime, 5000);
    return () => clearInterval(t);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════════
  // OPTIMIZED DATA FETCHING - Single aggregated endpoint instead of 15+ calls
  // ══════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    let isMounted = true;

    const fetchHomeData = async () => {
      try {
        // SINGLE AGGREGATED REQUEST - Replaces 10+ separate API calls
        const response = await fetch(`${API}/home/data`, {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const { success, data } = await response.json();
        
        if (!isMounted) return;
        
        if (success && data) {
          // Unpack all data from single response
          setFeaturedProducts(Array.isArray(data.featuredProducts) ? data.featuredProducts : []);
          setCategories(Array.isArray(data.categories) && data.categories.length > 0 ? data.categories : FALLBACK_CATEGORIES);
          setCategoryCounts(data.categoryCounts || {});
          setDealProducts(Array.isArray(data.dealProducts) ? data.dealProducts : []);
          setNewArrivals(Array.isArray(data.newArrivals) ? data.newArrivals : []);
          setLabEquipmentProducts(Array.isArray(data.labEquipmentProducts) ? data.labEquipmentProducts : []);
          setTestimonials(Array.isArray(data.testimonials) ? data.testimonials : []);
          setPromo(data.activePromo || null);
          setStats(data.stats || { totalProducts: 0, totalBrands: 50, totalOrders: 0, totalB2BClients: 1200 });
          
          // Update all loading states
          setFeaturedLoading(false);
          setIsLoadingData(false);
          setDealLoading(false);
          setNewArrivalsLoading(false);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        if (!isMounted) return;
        
        console.error('[HomePage] Failed to load data:', error);
        
        // Set fallback data on error
        setCategories(FALLBACK_CATEGORIES);
        setFeaturedProducts([]);
        setDealProducts([]);
        setNewArrivals([]);
        setLabEquipmentProducts([]);
        
        // Update loading states
        setFeaturedLoading(false);
        setIsLoadingData(false);
        setDealLoading(false);
        setNewArrivalsLoading(false);
      }
    };

    // DEFERRED: Category products (only loaded when user scrolls to category tabs)
    const fetchCategoryProducts = async () => {
      try {
        const response = await fetch(
          `${API}/home/category-products?category=Diagnostic Equipment,Laboratory Reagents,Hospital Machines,PPE & Safety,Lab Equipment&limit=10`,
          { credentials: 'include' }
        );
        
        if (!isMounted) return;
        
        if (response.ok) {
          const { success, data } = await response.json();
          if (success && data) {
            setCategoryProducts({
              diagnostic: data['Diagnostic Equipment'] || [],
              reagents: data['Laboratory Reagents'] || [],
              machines: data['Hospital Machines'] || [],
              ppe: data['PPE & Safety'] || [],
              labEquipment: data['Lab Equipment'] || [],
            });
          }
        }
      } catch (error) {
        console.error('[HomePage] Failed to load category products:', error);
      } finally {
        if (isMounted) setCategoryProductsLoading(false);
      }
    };

    // Execute main data fetch immediately
    fetchHomeData();

    // Defer category products until idle
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => fetchCategoryProducts(), { timeout: 2000 });
      } else {
        setTimeout(fetchCategoryProducts, 500);
      }
    }

    // Check user auth (separate lightweight call)
    const token = localStorage.getItem('Mediport_token');
    if (token) {
      fetch(`${API}/auth/me`, { 
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      })
        .then(r => r.json())
        .then(data => {
          if (isMounted && data.user) setUser(data.user);
        })
        .catch(() => { if (process.env.NODE_ENV !== 'production') console.warn('[HomePage] Auth check failed'); });
    }

    // Get cart count from localStorage (instant, no API call)
    const cartData = localStorage.getItem('cart');
    if (cartData) {
      try {
        const cart = JSON.parse(cartData);
        const count = cart.items?.length || 0;
        Promise.resolve().then(() => setCartCount(count));
      } catch { if (process.env.NODE_ENV !== 'production') console.warn('[HomePage] Failed to parse cart from localStorage'); }
    }

    return () => { isMounted = false; };
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
  }, [searchQuery, router]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setFeaturedLoading(true);
    
    const fetchTabData = async () => {
      const featuredUrl = tab === 'all' 
        ? `${API}/products?isFeatured=true&limit=24`
        : `${API}/products?category=${encodeURIComponent(tab)}&isFeatured=true&limit=24`;
      const fallbackUrl = tab === 'all' 
        ? `${API}/products?limit=24`
        : `${API}/products?category=${encodeURIComponent(tab)}&limit=24`;
      
      try {
        // Try featured first, fallback to all products if not enough
        const [featuredData, fallbackData] = await Promise.all([
          fetch(featuredUrl).then(r => r.json()).catch(() => ({ products: [] })),
          fetch(fallbackUrl).then(r => r.json()).catch(() => ({ products: [] }))
        ]);
        
        const featured = Array.isArray(featuredData.data) ? featuredData.data : (featuredData.data?.products || featuredData.products || []);
        const fallback = Array.isArray(fallbackData.data) ? fallbackData.data : (fallbackData.data?.products || fallbackData.products || []);
        const products = featured.length >= 8 ? featured : fallback;
        // Ensure always an array
        setFeaturedProducts(Array.isArray(products) ? products : []);
      } catch (error) {
        setFeaturedProducts([]);
      } finally {
        setFeaturedLoading(false);
      }
    };
    
    fetchTabData();
  }, []);

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen home-page-root">
      {/* Global Styles */}
      <style>{`
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
        .stable-product-grid, .featured-products-panel { min-height: 340px; }
        @media (min-width: 768px) {
          .stable-product-grid { min-height: 700px; }
          .featured-products-panel { min-height: 700px; }
        }
        
        /* Marquee - CONVERTED to static scroll for better performance */
        .marquee-wrap { 
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .marquee-wrap::-webkit-scrollbar { display: none; }
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
        .cat-tile { transition: all 0.2s ease; }
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
          max-width: 1400px; 
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
          .prod-grid-4 { grid-template-columns: 1fr !important; }
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
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* HERO — left: text+search  |  right: image slider */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="home-hero home-hero--padded">
        <div className="hero-grid-container">

          {/* LEFT: Text + Search */}
          <div className="hero-left-content">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(77,219,184,0.15)', border: '1px solid rgba(77,219,184,0.3)', color: 'var(--color-brand-teal-light)', fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 999, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span style={{ width: 6, height: 6, background: 'var(--color-brand-teal-light)', borderRadius: '50%', animation: 'pulse-dot 2s infinite' }} />
              {t('home.tagline')}
            </div>
            <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 600, color: '#fff', lineHeight: 1.15, marginBottom: 12 }}>
              {t('home.heroTitle')}<br />
              <span style={{ color: 'var(--color-brand-teal-light)' }}>
                <span key={typewriterText} className="typewriter-text" style={{ display: 'inline-block' }}>{typewriterText}</span>
              </span>
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 20, maxWidth: 480, lineHeight: 1.6 }}>
              {t('home.heroSubtitle')}
            </p>
            <div style={{ maxWidth: 520, marginBottom: 16, width: '100%' }}>
              <EnhancedSearchBox placeholder={searchPlaceholder} variant="hero" />
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

          {/* RIGHT: Image Slider */}
          <div
            className="hero-right-panel"
            onMouseEnter={() => setIsSliderHovered(true)}
            onMouseLeave={() => setIsSliderHovered(false)}
          >
            {heroSlides.length > 0 ? (
              heroSlides.map((slide, i) => currentSlide === i && (
                <div key={slide._id || slide.imageUrl || i} className="slide-active" style={{ position: 'absolute', inset: 0 }}>
                  <Image 
                    src={slide.imageUrl} 
                    alt={slide.altText || `Medical equipment Bangladesh slide ${i + 1} — MediportBD`}
                    fill
                    sizes="(max-width: 768px) 100vw, 52vw"
                    style={{ objectFit: 'cover' }}
                    priority={i === 0}
                  />
                </div>
              ))
            ) : (
              <div className="slide-active" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 25% 15%, rgba(77,219,184,0.35), transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(14,138,110,0.5), transparent 60%), linear-gradient(140deg, #0b2545 0%, #12355f 60%, #0e8a6e 140%)' }} />
            )}
            {/* Bottom gradient */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)', zIndex: 5 }} />
            {/* Dots */}
            {(() => {
              const total = heroSlides.length > 0 ? heroSlides.length : 4;
              return (
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
                      style={{ display: 'block', width: currentSlide === i ? 20 : 7, height: 7, borderRadius: 999, cursor: 'pointer', background: currentSlide === i ? 'var(--color-brand-teal-light)' : 'rgba(255,255,255,0.5)', transition: 'all 0.3s' }} 
                    />
                  ))}
                </div>
              );
            })()}
            {/* Counter */}
            <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 10, color: '#fff', fontSize: 11, fontWeight: 600, background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: 20 }}>
              {String(currentSlide + 1).padStart(2, '0')} / {String(heroSlides.length > 0 ? heroSlides.length : 1).padStart(2, '0')}
            </div>
            {/* Arrows */}
            {(() => {
              const total = heroSlides.length > 0 ? heroSlides.length : 1;
              return (
                <>
                  <button 
                    onClick={() => setCurrentSlide(prev => (prev - 1 + total) % total)}
                    aria-label="Previous slide"
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 18, cursor: 'pointer', zIndex: 10, opacity: isSliderHovered ? 1 : 0, transition: 'opacity 0.2s' }}
                    className="hero-slider-arrows"
                  >
                    ‹
                  </button>
                  <button 
                    onClick={() => setCurrentSlide(prev => (prev + 1) % total)}
                    aria-label="Next slide"
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 18, cursor: 'pointer', zIndex: 10, opacity: isSliderHovered ? 1 : 0, transition: 'opacity 0.2s' }}
                    className="hero-slider-arrows"
                  >
                    ›
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: CATEGORY NAVIGATION (Othoba-style circular icons) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="home-section" style={{ padding: '32px 0', borderBottom: '1px solid var(--color-border-primary)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--color-brand-teal)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{t('home.ourCatalog')}</p>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 600, margin: 0 }}>
                {t('home.shopByCategory')}
              </h2>
            </div>
          </div>
          
          {/* Horizontal scrollable category circles - Dynamic from API */}
          <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 8,
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
              const colors = ['#FAF5FF', 'var(--color-status-warning-tint)', 'var(--color-status-success-tint)', '#FFF1F2', '#F8FAFC', '#EFF6FF', '#F0FDF4', '#FFFBEB'];
              const color = cat.color || colors[index % colors.length];
              
              return (
                <div key={categoryName} onClick={() => router.push(categoryPath)}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(categoryPath); } }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                    minWidth: 100, cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  {/* Circular icon */}
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, marginBottom: 10, border: '2px solid var(--color-border-primary)',
                    transition: 'all 0.2s' }}>
                    {emoji}
                  </div>
                  {/* Category name */}
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)',
                    textAlign: 'center', lineHeight: 1.3, maxWidth: 100, overflow: 'hidden',
                    textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' }}>
                    {categoryName}
                  </span>
                  {/* Product count */}
                  {productCount > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>
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
                minWidth: 100, cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-brand-teal), var(--color-brand-teal-light))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, marginBottom: 10, border: '2px solid var(--color-brand-teal)',
                color: '#fff', fontWeight: 600 }}>
                →
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-brand-teal)',
                textAlign: 'center' }}>
                {t('home.viewAll')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 6: PROMO BANNER (conditional) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {promo && (
        <div style={{
          background: 'linear-gradient(90deg, #085041, var(--color-brand-teal), #085041)',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          position: 'relative',
          textAlign: 'center',
        }}>
          {/* Top row: icon + text */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 18 }}>🏷️</span>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>
              Limited time: Use code{' '}
              <span style={{
                background: 'rgba(255,255,255,0.2)', padding: '2px 8px',
                borderRadius: 5, fontWeight: 600, fontSize: 14, letterSpacing: '0.05em',
                display: 'inline-block',
              }}>
                {promo.code}
              </span>
              {' '}for {promo.type === 'percentage' ? `${promo.value}% ${t('home.off')}` : `৳${promo.value} ${t('home.off')}`}
              {promo.description ? ` — ${promo.description}` : ''}
            </div>
          </div>
          {/* Bottom row: buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => { navigator.clipboard.writeText(promo.code); showToast.success('Code copied!'); }}
              style={{
                background: '#fff', color: 'var(--color-brand-teal)', border: 'none',
                padding: '7px 18px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
              {t('home.copyCode')}
            </button>
            <button
              onClick={() => router.push('/products')}
              style={{
                background: 'transparent', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.6)',
                padding: '7px 18px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
              {t('home.shopNow')}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 7: DEAL OF THE DAY - FLASH DEALS */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <FlashDealsSection />

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 7.5: BEST SELLING PRODUCTS - Rankings & Auto Slider */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Suspense fallback={
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Spinner />
        </div>
      }>
        <BestSellingSection />
      </Suspense>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 8: FEATURED PRODUCTS (tabbed) - GoWell BD Style with Promo Banners */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="home-section" style={{ padding: '48px 0' }}>
        <Suspense fallback={
          <div style={{ padding: '100px 0', textAlign: 'center' }}>
            <Spinner size="lg" />
          </div>
        }>
          <ProductGridWithPromoBanners>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--color-brand-teal)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{t('home.handPicked')}</p>
                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 600, margin: 0 }}>{t('home.featuredProducts')}</h2>
                </div>
                <button onClick={() => router.push('/products')}
                  style={{ fontSize: 13, color: 'var(--color-brand-teal)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {t('home.viewAll')}
                </button>
              </div>

          {/* Tabs - Dynamic based on top categories */}
          <div role="tablist" aria-label="Product categories" style={{ 
            display: 'flex', 
            gap: 8, 
            marginBottom: 24, 
            flexWrap: 'wrap',
            listStyle: 'none',
            padding: 0,
            margin: '0 0 24px 0'
          }}>
            {/* Always show "All Products" first */}
            <button
              onClick={() => handleTabChange('all')}
              role="tab"
              aria-selected={activeTab === 'all'}
              aria-controls="featured-products-panel"
              aria-label="View All Products"
              className={activeTab === 'all' ? 'tab-active' : ''}
              style={{ 
                padding: '10px 20px', 
                borderRadius: 8, 
                border: '1.5px solid var(--color-border-primary)',
                background: activeTab === 'all' ? 'var(--color-brand-navy)' : '#fff',
                color: activeTab === 'all' ? '#fff' : '#374151',
                fontSize: 14, 
                fontWeight: 600, 
                cursor: 'pointer', 
                transition: 'all 0.2s',
                boxShadow: activeTab === 'all' ? '0 2px 8px rgba(11, 37, 69, 0.15)' : 'none',
                transform: activeTab === 'all' ? 'translateY(-1px)' : 'none',
                listStyle: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
              All Products
            </button>

            {/* Dynamic category tabs - top 5 by product count */}
            {topCategories.map((cat, index) => {
                const categoryName = typeof cat === 'string' ? cat : cat.name;
                // Map category names to icons
                const iconMap = {
                  'Orthopedic Supports': '🦴',
                  'Diagnostic Equipment': '🩺',
                  'Surgical & Wound Care': '💉',
                  'Hospital Machines': '🏥',
                  'Consumables': '📦',
                  'Diabetes Care': '💉',
                  'Laboratory Reagents': '🧪',
                  'Surgical Instruments': '💉',
                };
                const icon = iconMap[categoryName] || '📦';
                
                return (
                  <button
                    key={categoryName}
                    onClick={() => handleTabChange(categoryName)}
                    role="tab"
                    aria-selected={activeTab === categoryName}
                    aria-controls="featured-products-panel"
                    aria-label={`View ${categoryName}`}
                    className={activeTab === categoryName ? 'tab-active' : ''}
                    style={{ 
                      padding: '10px 20px', 
                      borderRadius: 8, 
                      border: '1.5px solid var(--color-border-primary)',
                      background: activeTab === categoryName ? 'var(--color-brand-navy)' : '#fff',
                      color: activeTab === categoryName ? '#fff' : '#374151',
                      fontSize: 14, 
                      fontWeight: 600, 
                      cursor: 'pointer', 
                      transition: 'all 0.2s',
                      boxShadow: activeTab === categoryName ? '0 2px 8px rgba(11, 37, 69, 0.15)' : 'none',
                      transform: activeTab === categoryName ? 'translateY(-1px)' : 'none',
                      listStyle: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                    {icon} {categoryName.length > 20 ? categoryName.substring(0, 17) + '...' : categoryName}
                  </button>
                );
              })
            }
          </div>

          {/* Products - Horizontal scroll with arrow navigation */}
          <div id="featured-products-panel" role="tabpanel" aria-label="Featured products" className="featured-products-panel" style={{ position: 'relative' }}>
            {/* Left Arrow - Always visible on mobile when products exist */}
            {!featuredLoading && featuredProducts.length > 0 && (
              <button
                onClick={() => {
                  const container = document.getElementById('featured-scroll-container');
                  if (container) {
                    const cardWidth = 170; // Card width + gap
                    container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
                  }
                }}
                className="md:hidden"
                style={{
                  position: 'absolute',
                  left: 4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.98)',
                  border: '1.5px solid var(--color-border-primary)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: 'var(--color-brand-navy)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--color-brand-teal)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.98)';
                  e.currentTarget.style.color = 'var(--color-brand-navy)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                }}
                aria-label="Scroll left">
                ‹
              </button>
            )}

            {/* Right Arrow - Always visible on mobile when products exist */}
            {!featuredLoading && featuredProducts.length > 0 && (
              <button
                onClick={() => {
                  const container = document.getElementById('featured-scroll-container');
                  if (container) {
                    const cardWidth = 170; // Card width + gap
                    container.scrollBy({ left: cardWidth, behavior: 'smooth' });
                  }
                }}
                className="md:hidden"
                style={{
                  position: 'absolute',
                  right: 4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.98)',
                  border: '1.5px solid var(--color-border-primary)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: 'var(--color-brand-navy)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--color-brand-teal)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.98)';
                  e.currentTarget.style.color = 'var(--color-brand-navy)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                }}
                aria-label="Scroll right">
                ›
              </button>
            )}

          {featuredLoading ? (
            <div id="featured-scroll-container" className="md:grid md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] md:gap-5 flex md:block overflow-x-auto gap-3 pb-4 snap-x snap-mandatory scrollbar-hide scroll-smooth" style={{ padding: '0 4px', WebkitOverflowScrolling: 'touch' }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[160px] md:w-auto snap-start">
                  <ProductCardSkeleton />
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--color-text-secondary)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No products found</p>
              <p style={{ fontSize: 14 }}>Try selecting a different category or check back later</p>
            </div>
          ) : (
            <div 
              id="featured-scroll-container" 
              className="md:grid md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] md:gap-5 flex md:block overflow-x-auto gap-3 pb-4 snap-x snap-mandatory scrollbar-hide scroll-smooth" 
              style={{ 
                padding: '0 4px', 
                listStyle: 'none',
                WebkitOverflowScrolling: 'touch', // iOS smooth scrolling
                scrollPaddingLeft: '4px', // Proper snap alignment
                scrollBehavior: 'smooth'
              }}>
              {featuredProducts.map((p, index) => (
                <div key={p._id || index} className="flex-shrink-0 w-[160px] md:w-auto snap-start snap-always">
                  <ProductCard product={p} onClick={() => router.push(`/products/${p.slug || p._id}`)} />
                </div>
              ))}
            </div>
          )}
          </div>
            </div>
          </ProductGridWithPromoBanners>
        </Suspense>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 8.5: CATEGORY PRODUCT SECTIONS (horizontal scrolls per category) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <CategoryProductSections categories={categories} />

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 9: NEW ARRIVALS (horizontal scroll) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 9: NEW ARRIVALS - GoWell BD Style Auto Slider */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {!newArrivalsLoading && newArrivals.length > 0 && (
        <Suspense fallback={
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <Spinner />
          </div>
        }>
          <NewArrivalSlider products={newArrivals} />
        </Suspense>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* RECENTLY VIEWED PRODUCTS */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="home-section" style={{ padding: '56px 24px 32px', background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <RecentlyViewed limit={8} title="Continue Where You Left Off" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* WHY MediportBD */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="home-section" style={{ padding: '56px 24px', borderTop: '1px solid var(--color-border-primary)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: 11, color: 'var(--color-brand-teal)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{t('home.whyChooseUs')}</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 600, margin: 0, color: 'var(--color-brand-navy)' }}>
              {t('home.whyMediport')}
            </h2>
          </div>
          <div className="trust-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {whyUsItems.map(({ icon, title, desc }) => (
              <div key={title} className="trust-item"
                style={{ padding: '24px', borderRadius: 16, border: '1px solid var(--color-border-primary)', background: 'var(--color-background-secondary)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-brand-teal)'; e.currentTarget.style.background = '#F0FDF9'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(14,138,110,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-primary)'; e.currentTarget.style.background = 'var(--color-background-secondary)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, var(--color-brand-teal), var(--color-brand-teal-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, marginBottom: 16 }}>
                  {icon}
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-brand-navy)', marginBottom: 8 }}>{title}</h4>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* B2B PROGRAM BANNER */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="home-section" style={{ padding: '56px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="b2b-banner" style={{ background: 'linear-gradient(135deg, var(--color-brand-navy) 0%, #0d3162 100%)',
          borderRadius: 24, padding: '48px', overflow: 'hidden', position: 'relative' }}>
          {/* Background decoration */}
          <div style={{ position: 'absolute', top: '-20%', right: '10%', width: 'min(400px, 100%)', height: 'min(400px, 100%)',
            background: 'radial-gradient(circle, var(--color-brand-teal), transparent 70%)', opacity: 0.15 }} />
          <div className="b2b-cols" style={{ position: 'relative', display: 'grid',
            gridTemplateColumns: '1fr 220px', gap: 40, alignItems: 'center' }}>
            {/* Left */}
            <div>
              <span style={{ fontSize: 11, background: 'rgba(77,219,184,0.2)', color: 'var(--color-brand-teal-light)',
                padding: '4px 14px', borderRadius: 999, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('home.b2bProgram')}</span>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 600,
                color: '#fff', margin: '14px 0 12px' }}>
                {t('home.b2bTitle')}
              </h3>
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
                  ? (stats.totalB2BClients > 0 ? `${stats.totalB2BClients.toLocaleString()}+` : '500+')
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SUPPORT & RESOURCES */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Suspense fallback={
        <div style={{ padding: '56px 24px', background: 'var(--color-background-secondary)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
            <Spinner size="lg" variant="medical" />
          </div>
        </div>
      }>
        <SupportResources />
      </Suspense>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 15: HOW IT WORKS */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="home-section" style={{ padding: '56px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: 11, color: 'var(--color-brand-teal)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{t('home.simpleProcess')}</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 600, margin: 0 }}>
              {t('home.howItWorks')}
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}
            className="how-it-works-grid">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} style={{ textAlign: 'center', position: 'relative' }}>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="how-it-works-step-line" style={{ position: 'absolute', top: 40, left: '60%', width: '80%',
                    height: 2, background: 'var(--color-border-primary)', zIndex: 0 }} />
                )}
                <div style={{ position: 'relative', zIndex: 1, background: '#fff',
                  borderRadius: 16, padding: '28px 20px', border: '1px solid var(--color-border-primary)' }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-brand-teal), var(--color-brand-teal-light))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', fontSize: 28, color: '#fff' }}>
                    {step.icon}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-brand-teal)',
                    marginBottom: 8 }}>{step.step}</div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{step.title}</h4>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* VIDEO SECTION */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Suspense fallback={
        <section style={{ padding: '60px 24px', background: 'linear-gradient(135deg, var(--color-brand-navy) 0%, #134E7A 100%)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 32, alignItems: 'center', justifyContent: 'center' }}>
            <Spinner size="lg" variant="medical" />
          </div>
        </section>
      }>
        <VideoSection />
      </Suspense>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 16: CUSTOMER TESTIMONIALS */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-hero-gradient" style={{ padding: '56px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: 11, color: 'var(--color-brand-teal-light)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{t('home.testimonials')}</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 600, margin: 0, color: '#fff' }}>
              {t('home.testimonials')}
            </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}
          className="testimonials-grid">
          {testimonials.length === 0 ? (
            <p className="text-[var(--color-text-secondary)] text-sm text-center py-8">No testimonials available</p>
          ) : (testimonials.slice(0, 3).map((review) => {
            const userName = review.user?.name || review.userName || 'Anonymous';
            const companyName = review.user?.companyName || review.companyName || '';
            const rating = review.rating || 5;
            
            return (
              <div key={review._id} style={{ background: '#fff', borderRadius: 16,
                border: '1px solid var(--color-border-primary)', padding: '28px 24px', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-brand-teal)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(14,138,110,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-primary)'; e.currentTarget.style.boxShadow = 'none'; }}>
                {/* Stars */}
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} style={{ color: s <= rating ? 'var(--color-warning)' : '#E5E7EB', fontSize: 18 }}>★</span>
                  ))}
                </div>
                {/* Comment */}
                <p style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.7, marginBottom: 20,
                  fontStyle: 'italic' }}>
                  &ldquo;{review.comment}&rdquo;
                </p>
                {/* User info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-brand-teal), var(--color-brand-teal-light))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 18, fontWeight: 600 }}>
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-brand-navy)' }}>{userName}</div>
                    {companyName && (
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{companyName}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          }))}
        </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* FOOTER - Add your footer component here */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
    </div>
  );
}
