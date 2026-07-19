'use client';

import { useState, useEffect, useRef, useCallback, memo, useMemo, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useT } from '@/hooks/useT';
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

// ══════════════════════════════════════════════════════════════════════════════
// FALLBACK DATA & CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const FALLBACK_CATEGORIES = [
  { name: 'Diagnostic Equipment', icon: <FaStethoscope />, desc: 'ECG · Ultrasound · Monitors', color: '#EFF6FF' },
  { name: 'Surgical Instruments', icon: <FaSyringe />, desc: 'Instruments · Implants', color: '#F0FDF4' },
  { name: 'Laboratory Reagents', icon: <FaFlask />, desc: 'Clinical · Molecular', color: '#FAF5FF' },
  { name: 'Hospital Machines', icon: <FaHospital />, desc: 'ICU · Ventilators · Dialysis', color: '#FFF7ED' },
  { name: 'Lab Equipment', icon: <FaMicroscope />, desc: 'Centrifuges · Microscopes', color: '#F0FDFA' },
  { name: 'PPE & Safety', icon: <FaShieldAlt />, desc: 'Masks · Gloves · Gowns', color: '#FFF1F2' },
  { name: 'Dental Equipment', icon: <FaTooth />, desc: 'Chairs · Drills', color: '#FFFBEB' },
  { name: 'Implants & Ortho', icon: <FaBone />, desc: 'Bone Plates · Screws', color: '#F8FAFC' },
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

function Skeleton({ w = '100%', h = 20, r = 8 }) {
  return (
    <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />
  );
}

// Product Card Skeleton for loading states
const ProductCardSkeleton = memo(function ProductCardSkeleton() {
  return (
    <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
      {/* Image skeleton */}
      <div style={{ height: 190, background: '#F8FAFC' }}>
        <Skeleton w="100%" h="100%" r={0} />
      </div>
      {/* Content skeleton */}
      <div style={{ padding: '12px 14px 14px' }}>
        <Skeleton w="60%" h={10} />
        <div style={{ marginTop: 8 }}><Skeleton w="100%" h={14} /></div>
        <div style={{ marginTop: 6 }}><Skeleton w="90%" h={14} /></div>
        <div style={{ marginTop: 12 }}><Skeleton w="70%" h={20} /></div>
      </div>
    </div>
  );
});

// Horizontal scroll product skeleton (smaller)
const ProductCardSkeletonSmall = memo(function ProductCardSkeletonSmall() {
  return (
    <div style={{ minWidth: 180, maxWidth: 180, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ height: 160, background: '#F9FAFB' }}>
        <Skeleton w="100%" h="100%" r={0} />
      </div>
      <div style={{ padding: '10px 12px' }}>
        <Skeleton w="100%" h={11} />
        <div style={{ marginTop: 6 }}><Skeleton w="60%" h={14} /></div>
      </div>
    </div>
  );
});

// Top selling card skeleton (horizontal layout)
const TopSellingCardSkeleton = memo(function TopSellingCardSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 16, padding: 16, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12 }}>
      <div style={{ width: 140, height: 140, flexShrink: 0, background: '#F1F5F9', borderRadius: 8 }}>
        <Skeleton w="100%" h="100%" r={8} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton w="40px" h={18} />
        <Skeleton w="100%" h={16} />
        <Skeleton w="80%" h={16} />
        <div style={{ marginTop: 'auto' }}>
          <Skeleton w="90px" h={24} />
        </div>
      </div>
    </div>
  );
});

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
      style={{ background: '#fff', borderRadius: 14, overflow: 'hidden',
        border: '1px solid #E5E7EB', cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(11,37,69,0.12)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>

      {/* Image */}
      <div style={{ position: 'relative', height: 190, background: '#F8FAFC', overflow: 'hidden', flexShrink: 0 }}>
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
            <span style={{ background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700,
              padding: '3px 8px', borderRadius: 6 }}>-{discount}%</span>
          )}
          {!inStock && (
            <span style={{ background: '#6B7280', color: '#fff', fontSize: 10, fontWeight: 700,
              padding: '3px 8px', borderRadius: 6 }}>{t('common.outOfStock')}</span>
          )}
        </div>
        {/* Quick add button on hover */}
        <button
          onClick={e => { e.stopPropagation(); addToCart(product, 1); }}
          style={{ position: 'absolute', bottom: 10, right: 10, background: '#0E8A6E',
            color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px',
            fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = '#0B7558'; }}
          onMouseLeave={e => e.currentTarget.style.background = '#0E8A6E'}
          className="quick-add-btn">
          + {t('nav.cart')}
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {brandName && (
          <div style={{ fontSize: 10, color: '#0E8A6E', fontWeight: 700,
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
              <span key={s} style={{ color: s <= Math.round(ratingVal) ? '#F59E0B' : '#E5E7EB', fontSize: 13 }}>★</span>
            ))}
            <span style={{ fontSize: 10, color: '#9CA3AF' }}>({reviewCount})</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#0B2545' }}>
            {price > 0 ? `৳${price.toLocaleString()}` : t('common.contactForPrice')}
          </span>
          {hasDiscount && (
            <span style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'line-through' }}>
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
  const [topSellingProducts, setTopSellingProducts] = useState([]);
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
  const [topSellingLoading, setTopSellingLoading] = useState(true);
  const [categoryProductsLoading, setCategoryProductsLoading] = useState(true);
  
  // ── Memoized Values ────────────────────────────────────────────────────────
  const whyUsItems = useMemo(() => buildWhyUs(siteSettings), [siteSettings]);
  const announcementItems = useMemo(() => buildAnnouncements(siteSettings), [siteSettings]);
  
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
    const count = heroSlides.filter(s => s.isActive).length || 4;
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
      const total = heroSlides.length > 0 ? heroSlides.length : 4;
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
        // silently fall back to default images
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

  // Fetch data — STAGED LOADING for better TBT/TTI
  // Stage 1 (critical, above-fold): featured products, categories, settings
  // Stage 2 (deferred, below-fold): deals, new arrivals, category products, reviews
  useEffect(() => {
    const safe = async (p) => {
      try {
        const response = await p;
        const data = await response.json();
        return data;
      } catch {
        return { success: false, data: null };
      }
    };

    const extractProducts = (d) => {
      if (Array.isArray(d?.data)) return d.data;
      if (Array.isArray(d?.data?.products)) return d.data.products;
      if (Array.isArray(d?.products)) return d.products;
      return [];
    };

    // ── STAGE 1: Critical above-fold data (4 requests vs previous 16) ─────
    Promise.all([
      safe(fetch(`${API}/products?isFeatured=true&limit=25`)),
      safe(fetch(`${API}/categories`)),
      safe(fetch(`${API}/products/category-counts`)),
      safe(fetch(`${API}/stats`)),
    ]).then(([featured, cats, counts, statsData]) => {
      const fp = extractProducts(featured);
      // If no featured products, fetch general products as fallback
      if (fp.length >= 4) {
        setFeaturedProducts(fp);
        setFeaturedLoading(false);
        setIsLoadingData(false);
      } else {
        safe(fetch(`${API}/products?limit=25`)).then((allProducts) => {
          const ap = extractProducts(allProducts);
          setFeaturedProducts(ap.length > 0 ? ap : []);
          setFeaturedLoading(false);
          setIsLoadingData(false);
        });
      }

      const catList = cats.data?.categories || cats.categories || [];
      setCategories(catList.length > 0 ? catList : FALLBACK_CATEGORIES);
      setCategoryCounts(counts.data || {});
      if (statsData.data) setStats(statsData.data);
    }).catch(() => {
      setFeaturedLoading(false);
      setIsLoadingData(false);
      setCategories(FALLBACK_CATEGORIES);
    });

    // ── STAGE 2: Below-fold data — deferred until browser is idle ─────────
    const loadDeferredData = () => {
      Promise.all([
        safe(fetch(`${API}/products?hasDiscount=true&limit=4&sortBy=discountPct`)),
        safe(fetch(`${API}/products?sortBy=newest&limit=10`)),
        safe(fetch(`${API}/reviews?isApproved=true&limit=3`)),
        safe(fetch(`${API}/coupons/active-promo`)),
        safe(fetch(`${API}/products?sortBy=popular&limit=4`)),
        safe(fetch(`${API}/products?category=Lab+Equipment&limit=4`)),
      ]).then(([deals, newest, reviews, promoData, topSelling, labEquip]) => {
        const dealList = extractProducts(deals);
        setDealProducts(dealList);
        setDealLoading(false);

        const na = extractProducts(newest);
        setNewArrivals(na);
        setNewArrivalsLoading(false);

        const reviewList = reviews.data?.reviews || reviews.reviews || [];
        setTestimonials(Array.isArray(reviewList) ? reviewList : []);

        setPromo(promoData.data?.coupon || null);

        const topSellingList = extractProducts(topSelling);
        setTopSellingProducts(topSellingList);
        setTopSellingLoading(false);

        const labEquipList = extractProducts(labEquip);
        setLabEquipmentProducts(labEquipList);
      }).catch(() => {
        setDealLoading(false);
        setNewArrivalsLoading(false);
        setTopSellingLoading(false);
      });

      // ── STAGE 3: Category product tabs — lowest priority ───────────────
      Promise.all([
        safe(fetch(`${API}/products?category=Diagnostic+Equipment&limit=10`)),
        safe(fetch(`${API}/products?category=Laboratory+Reagents&limit=10`)),
        safe(fetch(`${API}/products?category=Hospital+Machines&limit=10`)),
        safe(fetch(`${API}/products?category=PPE&limit=10`)),
        safe(fetch(`${API}/products?category=Lab+Equipment&limit=10`)),
      ]).then(([diagnostic, reagents, machines, ppe, labEquipCat]) => {
        setCategoryProducts({
          diagnostic: extractProducts(diagnostic),
          reagents: extractProducts(reagents),
          machines: extractProducts(machines),
          ppe: extractProducts(ppe),
          labEquipment: extractProducts(labEquipCat),
        });
        setCategoryProductsLoading(false);
      }).catch(() => setCategoryProductsLoading(false));
    };

    // Use requestIdleCallback if available, otherwise setTimeout with 300ms delay
    // This ensures Stage 1 data is rendered before we start Stage 2 fetching
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(loadDeferredData, { timeout: 2000 });
      } else {
        setTimeout(loadDeferredData, 300);
      }
    }

    // Check user auth
    const token = localStorage.getItem('medcore_token');
    if (token) {
      fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          if (data.user) setUser(data.user);
        })
        .catch(() => {});
    }

    // Get cart count
    const cartData = localStorage.getItem('cart');
    if (cartData) {
      try {
        const cart = JSON.parse(cartData);
        const count = cart.items?.length || 0;
        setTimeout(() => setCartCount(count), 0);
      } catch {}
    }
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
  }, [searchQuery, router]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setFeaturedLoading(true);
    const featuredUrl = tab === 'all' 
      ? `${API}/products?isFeatured=true&limit=24`
      : `${API}/products?category=${encodeURIComponent(tab)}&isFeatured=true&limit=24`;
    const fallbackUrl = tab === 'all' 
      ? `${API}/products?limit=24`
      : `${API}/products?category=${encodeURIComponent(tab)}&limit=24`;
    
    // Try featured first, fallback to all products if not enough
    Promise.all([
      fetch(featuredUrl).then(r => r.json()).catch(() => ({ products: [] })),
      fetch(fallbackUrl).then(r => r.json()).catch(() => ({ products: [] }))
    ]).then(([featuredData, fallbackData]) => {
      const featured = Array.isArray(featuredData.data) ? featuredData.data : (featuredData.data?.products || featuredData.products || []);
      const fallback = Array.isArray(fallbackData.data) ? fallbackData.data : (fallbackData.data?.products || fallbackData.products || []);
      const products = featured.length >= 8 ? featured : fallback;
      // Ensure always an array
      setFeaturedProducts(Array.isArray(products) ? products : []);
      setFeaturedLoading(false);
    }).catch(() => {
      setFeaturedProducts([]);
      setFeaturedLoading(false);
    });
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
        .cat-tile:hover { border-color: #0E8A6E !important; }
        .cat-tile:hover .cat-tile-arrow { opacity: 1 !important; transform: translateX(3px) !important; }
        
        /* Section entrance - SIMPLIFIED (removed fadeInUp animation) */
        .section-in { opacity: 1; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Button states - Kept (essential UX) */
        .tab-active { background: #0B2545 !important; color: #fff !important; }
        .pill-hover:hover { background: rgba(255,255,255,0.2) !important; }
        .btn-primary-hover:hover { background: #0a1f3d !important; }
        .btn-teal-hover:hover { background: #0c7a61 !important; transform: scale(1.02); }
        
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
          gap: 32px; 
          align-items: center; 
        }
        .hero-left-content { order: 1; }
        .hero-right-panel { 
          order: 2; 
          position: relative; 
          height: 460px; 
          border-radius: 16px; 
          overflow: hidden; 
          background: #1a3a5c; 
          box-shadow: 0 20px 60px rgba(0,0,0,0.4); 
        }
        @media (min-width: 1280px) {
          .hero-grid-container { grid-template-columns: minmax(0, 1fr) minmax(560px, 58%); gap: 36px; }
          .hero-right-panel { height: 500px; }
        }
        @media (min-width: 1536px) {
          .hero-grid-container { grid-template-columns: minmax(0, 1fr) 640px; }
          .hero-right-panel { height: 520px; }
        }
        /* Custom scrollbar for category navigation */
        *::-webkit-scrollbar { height: 6px; }
        *::-webkit-scrollbar-track { background: var(--color-background-muted); border-radius: 10px; }
        *::-webkit-scrollbar-thumb { background: var(--color-border-secondary); border-radius: 10px; }
        *::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        /* Category section styles */
        .category-section { padding: 40px 0; border-bottom: 1px solid var(--color-border-primary); }
        .category-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 0 24px; }
        .category-title-accent { display: flex; align-items: center; gap: 12px; }
        .category-title-accent::before { content: ''; width: 4px; height: 24px; background: #0E8A6E; border-radius: 2px; }
        .category-product-row { display: flex; gap: 16px; overflow-x: auto; padding: 0 24px 8px; scrollbar-width: none; -ms-overflow-style: none; }
        .category-product-row::-webkit-scrollbar { display: none; }
        /* Top selling card styles */
        .top-selling-card { display: flex; gap: 16px; padding: 16px; background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; position: relative; cursor: pointer; transition: box-shadow 0.2s; }
        .top-selling-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .best-selling-badge { position: absolute; top: -1px; right: -1px; background: #F97316; color: #fff; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 0 12px 0 8px; }
        @media (max-width: 1024px) {
          .hero-grid-container { grid-template-columns: 1fr !important; gap: 24px !important; }
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
          .how-it-works-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 1024px) {
          .how-it-works-grid { grid-template-columns: repeat(2, 1fr) !important; }
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
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(77,219,184,0.15)', border: '1px solid rgba(77,219,184,0.3)', color: '#4DDBB8', fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 999, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span style={{ width: 7, height: 7, background: '#4DDBB8', borderRadius: '50%', animation: 'pulse-dot 2s infinite' }} />
              {t('home.tagline')}
            </div>
            <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 48px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 16 }}>
              {t('home.heroTitle')}<br />
              <span style={{ color: '#4DDBB8' }}>
                <span key={typewriterText} className="typewriter-text" style={{ display: 'inline-block' }}>{typewriterText}</span>
              </span>
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 28, maxWidth: 480, lineHeight: 1.7 }}>
              {t('home.heroSubtitle')}
            </p>
            <div style={{ maxWidth: 520, marginBottom: 24, width: '100%' }}>
              <EnhancedSearchBox placeholder={searchPlaceholder} variant="hero" />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['ECG Machine', 'HbA1c Kit', 'Ventilator', 'Surgical Set', 'Reagents'].map(q => (
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
                <div key={i} className="slide-active" style={{ position: 'absolute', inset: 0 }}>
                  <Image 
                    src={slide.imageUrl} 
                    alt={slide.altText || `Medical equipment Bangladesh slide ${i + 1} — MedCore BD`}
                    fill
                    sizes="(max-width: 768px) 100vw, 52vw"
                    style={{ objectFit: 'cover' }}
                    priority={i === 0}
                  />
                </div>
              ))
            ) : (
              <>
                {currentSlide === 0 && <div className="slide-active" style={{ position: 'absolute', inset: 0 }}>
                  <Image 
                    src="https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800&h=500&fit=crop" 
                    alt="Diagnostic medical equipment Bangladesh — ECG machines and patient monitors — MedCore BD"
                    fill
                    sizes="(max-width: 768px) 100vw, 52vw"
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </div>}
                {currentSlide === 1 && <div className="slide-active" style={{ position: 'absolute', inset: 0 }}>
                  <Image 
                    src="https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&h=500&fit=crop" 
                    alt="Laboratory reagents Bangladesh — HbA1c CBC diagnostic kits — MedCore BD"
                    fill
                    sizes="(max-width: 768px) 100vw, 52vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>}
                {currentSlide === 2 && <div className="slide-active" style={{ position: 'absolute', inset: 0 }}>
                  <Image 
                    src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&h=500&fit=crop" 
                    alt="Hospital equipment Bangladesh — ICU ventilators and infusion pumps — MedCore BD"
                    fill
                    sizes="(max-width: 768px) 100vw, 52vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>}
                {currentSlide === 3 && <div className="slide-active" style={{ position: 'absolute', inset: 0 }}>
                  <Image 
                    src="https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=500&fit=crop" 
                    alt="Surgical instruments Bangladesh — scissors forceps trocar sets — MedCore BD"
                    fill
                    sizes="(max-width: 768px) 100vw, 52vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>}
              </>
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
                      key={i} 
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
                      style={{ display: 'block', width: currentSlide === i ? 20 : 7, height: 7, borderRadius: 999, cursor: 'pointer', background: currentSlide === i ? '#4DDBB8' : 'rgba(255,255,255,0.5)', transition: 'all 0.3s' }} 
                    />
                  ))}
                </div>
              );
            })()}
            {/* Counter */}
            <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 10, color: '#fff', fontSize: 11, fontWeight: 700, background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: 20 }}>
              {String(currentSlide + 1).padStart(2, '0')} / {String(heroSlides.length > 0 ? heroSlides.length : 4).padStart(2, '0')}
            </div>
            {/* Arrows */}
            {(() => {
              const total = heroSlides.length > 0 ? heroSlides.length : 4;
              return (
                <>
                  <button 
                    onClick={() => setCurrentSlide(prev => (prev - 1 + total) % total)}
                    aria-label="Previous slide"
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 18, cursor: 'pointer', zIndex: 10, opacity: isSliderHovered ? 1 : 0, transition: 'opacity 0.2s' }}
                    className="hero-slider-arrows"
                  >
                    ‹
                  </button>
                  <button 
                    onClick={() => setCurrentSlide(prev => (prev + 1) % total)}
                    aria-label="Next slide"
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 18, cursor: 'pointer', zIndex: 10, opacity: isSliderHovered ? 1 : 0, transition: 'opacity 0.2s' }}
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
              <p style={{ fontSize: 11, color: '#0E8A6E', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{t('home.ourCatalog')}</p>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, margin: 0 }}>
                {t('home.shopByCategory')}
              </h2>
            </div>
          </div>
          
          {/* Horizontal scrollable category circles - Dynamic from API */}
          <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 8,
            scrollbarWidth: 'thin', scrollbarColor: '#E5E7EB transparent' }}>
            {/* Show first 16 categories from API, or fallback to hardcoded if loading */}
            {(categories.length > 0 ? categories.slice(0, 16) : [
              { name: 'Lab Reagents', emoji: '🧪', color: '#FAF5FF', slug: 'laboratory-reagents' },
              { name: 'Hospital Machines', emoji: '🏥', color: '#FFF7ED', slug: 'hospital-machines' },
              { name: 'Lab Equipment', emoji: '🔬', color: '#F0FDFA', slug: 'lab-equipment' },
              { name: 'PPE & Safety', emoji: '🛡️', color: '#FFF1F2', slug: 'ppe-safety' },
              { name: 'Implants', emoji: '🦴', color: '#F8FAFC', slug: 'implants-ortho' },
              { name: 'Diagnostic', emoji: '🩺', color: '#EFF6FF', slug: 'diagnostic-equipment' },
              { name: 'Surgical', emoji: '💉', color: '#F0FDF4', slug: 'surgical-instruments' },
            ]).map((cat, index) => {
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
              const colors = ['#FAF5FF', '#FFF7ED', '#F0FDFA', '#FFF1F2', '#F8FAFC', '#EFF6FF', '#F0FDF4', '#FFFBEB'];
              const color = cat.color || colors[index % colors.length];
              
              return (
                <div key={categoryName} onClick={() => router.push(categoryPath)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                    minWidth: 100, cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  {/* Circular icon */}
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, marginBottom: 10, border: '2px solid #E5E7EB',
                    transition: 'all 0.2s' }}>
                    {emoji}
                  </div>
                  {/* Category name */}
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151',
                    textAlign: 'center', lineHeight: 1.3, maxWidth: 100, overflow: 'hidden',
                    textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' }}>
                    {categoryName}
                  </span>
                  {/* Product count */}
                  {productCount > 0 && (
                    <span style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
                      {productCount} items
                    </span>
                  )}
                </div>
              );
            })}
            
            {/* View All button */}
            <div onClick={() => router.push('/products')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                minWidth: 100, cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0E8A6E, #4DDBB8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, marginBottom: 10, border: '2px solid #0E8A6E',
                color: '#fff', fontWeight: 700 }}>
                →
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0E8A6E',
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
          background: 'linear-gradient(90deg, #085041, #0E8A6E, #085041)',
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
                borderRadius: 5, fontWeight: 800, fontSize: 14, letterSpacing: '0.05em',
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
              onClick={() => { navigator.clipboard.writeText(promo.code); alert('Code copied!'); }}
              style={{
                background: '#fff', color: '#0E8A6E', border: 'none',
                padding: '7px 18px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
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
      {/* SECTION 7.5: TOP SELLING PRODUCTS */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {(topSellingLoading || topSellingProducts.length > 0) && (
        <section className="home-section" style={{ padding: '56px 0', borderBottom: '1px solid var(--color-border-primary)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0E8A6E', textTransform: 'uppercase',
                  letterSpacing: '0.08em', marginBottom: 6 }}>{t('home.mostPopular')}</div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, margin: 0,
                  color: '#0B2545', lineHeight: 1.2 }}>{t('home.topSelling')}</h2>
              </div>
              <button onClick={() => router.push('/products?sortBy=popular')}
                style={{ fontSize: 13, color: '#0E8A6E', fontWeight: 600, background: 'none',
                  border: '1.5px solid #0E8A6E', borderRadius: 8, cursor: 'pointer',
                  padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#0E8A6E'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#0E8A6E'; }}>
                {t('home.viewAll')} <span>→</span>
              </button>
            </div>

            {/* 2×2 Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}
              className="prod-grid-4">
              {topSellingLoading ? (
                // Show 4 skeleton loaders
                [...Array(4)].map((_, i) => <TopSellingCardSkeleton key={i} />)
              ) : (
                topSellingProducts.slice(0, 4).map((product, idx) => {
                const imageData = product.images?.find(img => typeof img === 'object' && img.isPrimary) || product.images?.[0];
                const imgUrl = typeof imageData === 'string' ? imageData : imageData?.url;
                const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
                const catName = typeof product.category === 'object' ? product.category?.name : product.category;
                const price = product.price || 0;
                const oldPrice = product.oldPrice || 0;
                const hasDiscount = oldPrice > price && oldPrice > 0;
                const discountPct = hasDiscount ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
                const rank = idx + 1;

                return (
                  <div key={product._id}
                    onClick={() => router.push(`/products/${product.slug || product._id}`)}
                    style={{
                      display: 'flex', gap: 0, background: '#fff',
                      border: '1px solid #E5E7EB', borderRadius: 16,
                      overflow: 'hidden', cursor: 'pointer',
                      transition: 'box-shadow 0.25s, transform 0.25s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(11,37,69,0.12)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}>

                    {/* Left: Image with rank badge */}
                    <div style={{ width: 140, minHeight: 160, flexShrink: 0, position: 'relative',
                      background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {imgUrl ? (
                        <Image 
                          src={imgUrl} 
                          alt={`${product.name}${brandName ? ` — ${brandName}` : ''} — Top selling product #${rank} — MedCore BD Bangladesh`}
                          fill
                          sizes="140px"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ fontSize: 40, display: 'flex',
                          alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>🏥</div>
                      )}

                      {/* Rank badge */}
                      <div style={{
                        position: 'absolute', top: 10, left: 10,
                        width: 28, height: 28, borderRadius: '50%',
                        background: rank === 1 ? '#F59E0B' : rank === 2 ? '#94A3B8' : rank === 3 ? '#CD7C2F' : '#0E8A6E',
                        color: '#fff', fontSize: 12, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}>#{rank}</div>

                      {/* Discount badge */}
                      {hasDiscount && (
                        <div style={{
                          position: 'absolute', top: 10, right: 10,
                          background: '#EF4444', color: '#fff', fontSize: 10,
                          fontWeight: 700, padding: '3px 7px', borderRadius: 6
                        }}>-{discountPct}%</div>
                      )}
                    </div>

                    {/* Right: Content */}
                    <div style={{ flex: 1, padding: '16px 18px', display: 'flex',
                      flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                      <div>
                        {/* Category + Brand */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                          {catName && (
                            <span style={{ fontSize: 10, color: '#0E8A6E', fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {catName}
                            </span>
                          )}
                          {catName && brandName && <span style={{ color: '#D1D5DB', fontSize: 10 }}>•</span>}
                          {brandName && (
                            <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>{brandName}</span>
                          )}
                        </div>

                        {/* Product name */}
                        <div style={{
                          fontSize: 14, fontWeight: 700, color: '#0B2545', lineHeight: 1.45,
                          marginBottom: 10, display: '-webkit-box',
                          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {product.name}
                        </div>

                        {/* Price row */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 20, fontWeight: 800, color: '#0B2545', letterSpacing: '-0.02em' }}>
                            {price > 0 ? `৳${price.toLocaleString()}` : 'Contact for Price'}
                          </span>
                          {hasDiscount && (
                            <span style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'line-through' }}>
                              ৳{oldPrice.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Stock indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: product.stock > 0 ? '#10B981' : '#EF4444'
                          }} />
                          <span style={{ fontSize: 11, color: product.stock > 0 ? '#059669' : '#DC2626', fontWeight: 500 }}>
                            {product.stock > 0 ? t('products.inStock') : t('products.outOfStock')}
                          </span>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={e => { e.stopPropagation(); addToCart(product, 1); }}
                          style={{
                            flex: 1, padding: '9px 10px', background: '#fff', color: '#0E8A6E',
                            border: '1.5px solid #0E8A6E', borderRadius: 8, fontSize: 12,
                            fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#F0FDF4'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                          {t('products.addToCart')}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); router.push(`/products/${product.slug || product._id}`); }}
                          style={{
                            flex: 1, padding: '9px 10px', background: '#0E8A6E', color: '#fff',
                            border: 'none', borderRadius: 8, fontSize: 12,
                            fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#0c7a61'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#0E8A6E'; }}>
                          {t('products.viewDetails')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 8: FEATURED PRODUCTS (tabbed) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="home-section" style={{ padding: '48px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, color: '#0E8A6E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{t('home.handPicked')}</p>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, margin: 0 }}>{t('home.featuredProducts')}</h2>
            </div>
            <button onClick={() => router.push('/products')}
              style={{ fontSize: 13, color: '#0E8A6E', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
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
                border: '1.5px solid #E5E7EB',
                background: activeTab === 'all' ? '#0B2545' : '#fff',
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
            {categories
              .filter(cat => cat.productCount && cat.productCount > 0)
              .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
              .slice(0, 5)
              .map((cat, index) => {
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
                      border: '1.5px solid #E5E7EB',
                      background: activeTab === categoryName ? '#0B2545' : '#fff',
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

          {/* Products grid */}
          <div id="featured-products-panel" role="tabpanel" aria-label="Featured products">
          {featuredLoading ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: 20,
              padding: '0 4px'
            }}>
              {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: '#6B7280' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No products found</p>
              <p style={{ fontSize: 14 }}>Try selecting a different category or check back later</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: 20,
              padding: '0 4px',
              listStyle: 'none'
            }}>
              {featuredProducts.map((p, index) => (
                <ProductCard key={p._id || index} product={p} onClick={() => router.push(`/products/${p.slug || p._id}`)} />
              ))}
            </div>
          )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 8.5: CATEGORY PRODUCT SECTIONS (horizontal scrolls per category) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <CategoryProductSections categories={categories} />

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 9: NEW ARRIVALS (horizontal scroll) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {(newArrivalsLoading || newArrivals.length > 0) && (
        <section className="home-section" style={{ padding: '40px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 24px', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 11, color: '#0E8A6E', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{t('home.justArrived')}</p>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, margin: 0 }}>
                  {t('home.newArrivals')}
                </h2>
              </div>
              {!newArrivalsLoading && (
                <button onClick={() => router.push('/products?sortBy=newest')}
                  style={{ fontSize: 13, color: '#0E8A6E', fontWeight: 500, background: 'none',
                    border: 'none', cursor: 'pointer' }}>{t('home.viewAll')}</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '4px 24px 16px',
              scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {newArrivalsLoading ? (
                // Show 6 skeleton loaders
                [...Array(6)].map((_, i) => <ProductCardSkeletonSmall key={i} />)
              ) : (
                newArrivals.map(p => {
                const img = p.images?.[0]?.url || p.images?.[0];
                return (
                  <div key={p._id} className="product-card-hover"
                    onClick={() => router.push(`/products/${p.slug || p._id}`)}
                    style={{ minWidth: 180, maxWidth: 180, background: '#fff', borderRadius: 12,
                      border: '1px solid #E5E7EB', overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ height: 160, background: '#F9FAFB', position: 'relative', overflow: 'hidden' }}>
                      {img ? (
                        <Image 
                          src={img} 
                          alt={`${p.name}${typeof p.brand === 'object' ? ` — ${p.brand?.name}` : p.brand ? ` — ${p.brand}` : ''} — new arrival Bangladesh — MedCore BD`}
                          fill
                          sizes="180px"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                          height: '100%', fontSize: 40 }}>🏥</div>
                      )}
                      <span style={{ position: 'absolute', top: 8, left: 8, background: '#0E8A6E',
                        color: '#fff', fontSize: 9, padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>
                        ✨ NEW
                      </span>
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0B2545' }}>
                        ৳{p.price?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>
        </section>
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
      {/* WHY MEDCORE BD */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="home-section" style={{ padding: '56px 24px', borderTop: '1px solid var(--color-border-primary)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: 11, color: '#0E8A6E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{t('home.whyChooseUs')}</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, margin: 0, color: '#0B2545' }}>
              {t('home.whyMedcore')}
            </h2>
          </div>
          <div className="trust-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {whyUsItems.map(({ icon, title, desc }) => (
              <div key={title} className="trust-item"
                style={{ padding: '24px', borderRadius: 16, border: '1px solid #E5E7EB', background: '#F9FAFB', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0E8A6E'; e.currentTarget.style.background = '#F0FDF9'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(14,138,110,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #0E8A6E, #4DDBB8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, marginBottom: 16 }}>
                  {icon}
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0B2545', marginBottom: 8 }}>{title}</h4>
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>{desc}</p>
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
        <div style={{ background: 'linear-gradient(135deg, #0B2545 0%, #0d3162 100%)',
          borderRadius: 24, padding: '48px', overflow: 'hidden', position: 'relative' }}>
          {/* Background decoration */}
          <div style={{ position: 'absolute', top: '-20%', right: '10%', width: 400, height: 400,
            background: 'radial-gradient(circle, #0E8A6E, transparent 70%)', opacity: 0.15 }} />
          <div className="b2b-cols" style={{ position: 'relative', display: 'grid',
            gridTemplateColumns: '1fr 220px', gap: 40, alignItems: 'center' }}>
            {/* Left */}
            <div>
              <span style={{ fontSize: 11, background: 'rgba(77,219,184,0.2)', color: '#4DDBB8',
                padding: '4px 14px', borderRadius: 999, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('home.b2bProgram')}</span>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700,
                color: '#fff', margin: '14px 0 12px' }}>
                {t('home.b2bTitle')}
              </h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 24, lineHeight: 1.8 }}>
                {t('home.b2bDesc')}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 460, marginBottom: 28 }}>
                {['8–22% bulk discounts', '30–90 day credit terms',
                  'Dedicated account manager', 'Priority order processing',
                  'Free installation & training', 'Custom quotations'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                    <span style={{ color: '#4DDBB8', fontWeight: 700 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn-teal-hover"
                  onClick={() => router.push('/register?type=b2b')}
                  style={{ padding: '13px 28px', background: '#0E8A6E', color: '#fff',
                    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
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
              {[
                { val: stats.totalB2BClients > 0 ? `${stats.totalB2BClients.toLocaleString()}+` : '500+', label: 'Active B2B Clients' },
                { val: '30%', label: 'Max Bulk Discount' },
                { val: '90 days', label: 'Credit Terms' },
                { val: '24/7', label: 'Dedicated Support' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                  padding: '14px 18px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{s.label}</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#4DDBB8' }}>{s.val}</span>
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
        <div style={{ padding: '56px 24px', background: '#F8FAFC' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <Skeleton w="180px" h={14} />
              <div style={{ marginTop: 10 }}><Skeleton w="300px" h={28} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #E5E7EB' }}>
                  <Skeleton w={48} h={48} r={12} />
                  <div style={{ marginTop: 12 }}><Skeleton w="100%" h={16} /></div>
                  <div style={{ marginTop: 8 }}><Skeleton w="80%" h={12} /></div>
                </div>
              ))}
            </div>
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
            <p style={{ fontSize: 11, color: '#0E8A6E', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{t('home.simpleProcess')}</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, margin: 0 }}>
              {t('home.howItWorks')}
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}
            className="how-it-works-grid">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} style={{ textAlign: 'center', position: 'relative' }}>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div style={{ position: 'absolute', top: 40, left: '60%', width: '80%',
                    height: 2, background: '#E5E7EB', zIndex: 0 }} />
                )}
                <div style={{ position: 'relative', zIndex: 1, background: '#fff',
                  borderRadius: 16, padding: '28px 20px', border: '1px solid #E5E7EB' }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0E8A6E, #4DDBB8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', fontSize: 28, color: '#fff' }}>
                    {step.icon}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#0E8A6E',
                    marginBottom: 8 }}>{step.step}</div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{step.title}</h4>
                  <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{step.desc}</p>
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
        <section style={{ padding: '60px 24px', background: 'linear-gradient(135deg, #0B2545 0%, #134E7A 100%)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 32, alignItems: 'center' }}>
            <div style={{ flex: '0 0 640px', maxWidth: '640px' }}>
              <Skeleton w="100%" h={360} r={12} />
            </div>
            <div style={{ flex: 1 }}>
              <Skeleton w="250px" h={28} />
              <div style={{ marginTop: 16 }}><Skeleton w="100%" h={16} /></div>
              <div style={{ marginTop: 8 }}><Skeleton w="90%" h={16} /></div>
              <div style={{ marginTop: 24 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ marginTop: 12 }}>
                    <Skeleton w="80%" h={14} />
                  </div>
                ))}
              </div>
            </div>
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
          <p style={{ fontSize: 11, color: '#4DDBB8', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{t('home.testimonials')}</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, margin: 0, color: '#fff' }}>
            {t('home.testimonials')}
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}
          className="testimonials-grid">
          {(testimonials.length > 0 ? testimonials.slice(0, 3) : [
            {
              _id: 'fallback-1',
              rating: 5,
              comment: 'Excellent service and genuine products. We have been purchasing diagnostic equipment from MedCore BD for our hospital for over 2 years. Their technical support team is very responsive.',
              userName: 'Dr. Kamal Hossain',
              companyName: 'Dhaka Medical Center',
              user: { name: 'Dr. Kamal Hossain', companyName: 'Dhaka Medical Center' }
            },
            {
              _id: 'fallback-2',
              rating: 5,
              comment: 'Best prices for laboratory reagents in Bangladesh. Fast delivery and cold chain maintained properly. Highly recommend for diagnostic centers.',
              userName: 'Customer',
              companyName: 'Diagnostic Centre',
              user: { name: 'Customer', companyName: 'Diagnostic Centre' }
            },
            {
              _id: 'fallback-3',
              rating: 5,
              comment: 'Professional team with deep knowledge of medical equipment. They helped us set up our entire ICU with quality machines. Free installation and training was very helpful.',
              userName: 'Customer',
              companyName: 'Hospital',
              user: { name: 'Customer', companyName: 'Hospital' }
            }
          ]).map((review, i) => {
            const userName = review.user?.name || review.userName || 'Anonymous';
            const companyName = review.user?.companyName || review.companyName || '';
            const rating = review.rating || 5;
            
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 16,
                border: '1px solid #E5E7EB', padding: '28px 24px', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0E8A6E'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(14,138,110,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}>
                {/* Stars */}
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} style={{ color: s <= rating ? '#F59E0B' : '#E5E7EB', fontSize: 18 }}>★</span>
                  ))}
                </div>
                {/* Comment */}
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 20,
                  fontStyle: 'italic' }}>
                  &ldquo;{review.comment}&rdquo;
                </p>
                {/* User info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0E8A6E, #4DDBB8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 18, fontWeight: 700 }}>
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0B2545' }}>{userName}</div>
                    {companyName && (
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{companyName}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* FOOTER - Add your footer component here */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
    </div>
  );
}
