'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
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
  FaBox,
  FaIndustry
} from 'react-icons/fa';
import { API } from '@/constants/api';

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

const WHY_US = [
  { icon: <FaCheckCircle />, title: 'DGDA Registered', desc: 'All products are DGDA-cleared and meet Bangladesh regulatory standards.' },
  { icon: <FaTruck />, title: 'Fast Delivery', desc: 'Same-day dispatch for orders before 12 PM. Free delivery in Dhaka metro.' },
  { icon: <FaTools />, title: 'Free Installation', desc: 'Professional installation and staff training included for all equipment.' },
  { icon: <FaPhoneAlt />, title: '24/7 Support', desc: 'Dedicated technical support team available round the clock.' },
  { icon: <FaCreditCard />, title: 'Flexible Payment', desc: 'Bank transfer, bKash, Nagad, and B2B credit terms available.' },
  { icon: <FaUndo />, title: '30-Day Returns', desc: 'Hassle-free returns and replacement policy on all products.' },
];

const HOW_IT_WORKS = [
  { step: 1, icon: <FaSearch />, title: 'Browse & Search', desc: 'Find products from 50+ global brands' },
  { step: 2, icon: <FaShoppingCart />, title: 'Add to Cart', desc: 'Get instant quotes and bulk pricing' },
  { step: 3, icon: <FaCreditCard />, title: 'Secure Checkout', desc: 'Multiple payment options available' },
  { step: 4, icon: <FaTruck />, title: 'Fast Delivery', desc: 'Free installation & training included' },
];

const PLACEHOLDER_TESTIMONIALS = [
  {
    comment: "MedCore BD has been our trusted supplier for lab reagents. Fast delivery, genuine products, and excellent after-sales support.",
    rating: 5,
    user: { name: "Dr. Rahman", companyName: "Dhaka Medical College Hospital" }
  },
  {
    comment: "The B2B credit terms and bulk pricing have significantly reduced our procurement costs. Highly recommend for any hospital.",
    rating: 5,
    user: { name: "Dr. Fatema", companyName: "Popular Diagnostic Centre" }
  },
  {
    comment: "Finecare reagents always arrive on time with complete documentation. Never had a quality issue.",
    rating: 5,
    user: { name: "Mr. Karim", companyName: "Lab Director, Medinova" }
  }
];

// ══════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function Skeleton({ w = '100%', h = 20, r = 8 }) {
  return (
    <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />
  );
}

const ProductCard = memo(function ProductCard({ product, onClick }) {
  const img = product.images?.[0]?.url || product.images?.[0];
  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const ratingVal = typeof product.rating === 'object' ? product.rating?.average : (product.rating || 0);
  const reviewCount = product.reviewCount || product.rating?.count || 0;
  const discount = product.discountPct || (product.oldPrice && product.price < product.oldPrice 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) 
    : 0);
  
  // Calculate savings amount
  const price = product.price || 0;
  const oldPrice = product.oldPrice || 0;
  const savings = oldPrice > price ? oldPrice - price : 0;
  const hasDiscount = savings > 0 && discount > 0;

  return (
    <div className="product-card-hover" onClick={onClick}
      style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #E5E7EB', cursor: 'pointer' }}>
      <div style={{ position: 'relative', height: 180, background: '#F9FAFB' }}>
        {img ? (
          <img src={img} alt={product.name} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 52 }}>🏥</div>
        )}
        {hasDiscount && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: '#7C3AED',
            color: '#fff', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            Save: {savings.toLocaleString()}৳ (-{discount}%)
          </div>
        )}
      </div>
      <div style={{ padding: 14 }}>
        {brandName && (
          <div style={{ fontSize: 10, color: '#0E8A6E', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
            {brandName}
          </div>
        )}
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 8,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.name}
        </div>
        {ratingVal > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 1 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <span key={s} style={{ color: s <= Math.round(ratingVal) ? '#F59E0B' : '#E5E7EB', fontSize: 14 }}>★</span>
              ))}
            </div>
            <span style={{ fontSize: 10, color: '#6B7280' }}>({reviewCount})</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0B2545' }}>
            ৳{product.price?.toLocaleString()}
          </span>
          {product.oldPrice > product.price && (
            <span style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'line-through' }}>
              ৳{product.oldPrice?.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

function useCountUp(target, duration = 1500, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started || !target) return;
    let start = 0;
    const steps = 60;
    const step = target / steps;
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(Math.floor(start));
      if (start >= target) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, started, duration]);
  return count;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN HOMEPAGE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  const router = useRouter();
  const { addToCart } = useCart();

  // ── State - Consolidated for better performance ──────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [typewriterText, setTypewriterText] = useState('Diagnostic Equipment');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSliderHovered, setIsSliderHovered] = useState(false);
  const [currentRightBanner, setCurrentRightBanner] = useState(0);
  const [searchPlaceholder, setSearchPlaceholder] = useState('Search ECG machine...');
  const [activeTab, setActiveTab] = useState('all');
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState('idle');
  const [statsStarted, setStatsStarted] = useState(false);
  
  // Consolidated data state
  const [data, setData] = useState({
    categories: [],
    categoryCounts: {},
    featuredProducts: [],
    dealProducts: [],
    newArrivals: [],
    brands: [],
    promo: null,
    stats: { totalProducts: 0, totalBrands: 50, totalOrders: 0, totalB2BClients: 1200 },
    timeLeft: { h: 0, m: 0, s: 0 },
    testimonials: [],
    user: null,
    cartCount: 0,
    labEquipmentProducts: [],
    topSellingProducts: [],
    categoryProducts: {
      diagnostic: [],
      reagents: [],
      machines: [],
      ppe: [],
      labEquipment: [],
    },
    featuredLoading: true,
  });
  
  const statsRef = useRef(null);

  // Animated counters
  const productsCount = useCountUp(data.stats.totalProducts, 1500, statsStarted);
  const brandsCount = useCountUp(data.stats.totalBrands, 1500, statsStarted);
  const ordersCount = useCountUp(data.stats.totalOrders, 1500, statsStarted);
  const clientsCount = useCountUp(data.stats.totalB2BClients, 1500, statsStarted);

  // ── Effects - Optimized with proper dependencies ────────────────────────────────────────────

  // Announcement rotation
  useEffect(() => {
    const t = setInterval(() => setAnnouncementIdx(i => (i + 1) % ANNOUNCEMENTS.length), 4000);
    return () => clearInterval(t);
  }, []);

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

  // Typewriter effect
  useEffect(() => {
    const words = ['Diagnostic Equipment', 'Surgical Instruments', 'Laboratory Reagents', 'Hospital Machines'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % words.length;
      setTypewriterText(words[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Hero slider auto-play
  useEffect(() => {
    if (isSliderHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(interval);
  }, [isSliderHovered]);

  // Right banner auto-rotate
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRightBanner(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Search placeholder cycling
  useEffect(() => {
    const placeholders = ['Search ECG machine...', 'Search HbA1c reagent...', 'Search trocar set...', 'Search pulse oximeter...'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % placeholders.length;
      setSearchPlaceholder(placeholders[i]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer - optimized to update every 10 seconds
  useEffect(() => {
    const getTimeUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;
      return {
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      };
    };
    
    const updateTime = () => {
      setData(prev => ({ ...prev, timeLeft: getTimeUntilMidnight() }));
    };
    updateTime();
    
    const t = setInterval(updateTime, 10000); // Update every 10 seconds
    return () => clearInterval(t);
  }, []);

  // Stats counter trigger
  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStatsStarted(true);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  // Fetch data - consolidated into single effect
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

    Promise.all([
      safe(fetch(`${API}/products?isFeatured=true&limit=24`)),
      safe(fetch(`${API}/products?limit=24`)),
      safe(fetch(`${API}/categories`)),
      safe(fetch(`${API}/products/category-counts`)),
      safe(fetch(`${API}/stats`)),
      safe(fetch(`${API}/coupons/active-promo`)),
      safe(fetch(`${API}/products?sortBy=newest&limit=10`)),
      safe(fetch(`${API}/manufacturers`)),
      safe(fetch(`${API}/products?hasDiscount=true&limit=4&sortBy=discountPct`)),
      safe(fetch(`${API}/reviews?isApproved=true&limit=3`)),
      safe(fetch(`${API}/products?category=Lab Equipment&limit=4`)),
      safe(fetch(`${API}/products?isFeatured=true&limit=4`)),
      safe(fetch(`${API}/products?category=Diagnostic+Equipment&limit=10`)),
      safe(fetch(`${API}/products?category=Laboratory+Reagents&limit=10`)),
      safe(fetch(`${API}/products?category=Hospital+Machines&limit=10`)),
      safe(fetch(`${API}/products?category=PPE&limit=10`)),
      safe(fetch(`${API}/products?category=Lab+Equipment&limit=10`)),
    ]).then(([featured, allProducts, cats, counts, statsData, promoData, newest, mfrs, deals, reviews, labEquip, topSelling, diagnostic, reagents, machines, ppe, labEquipCat]) => {
      const fp = featured.data?.products || featured.products || [];
      const ap = allProducts.data?.products || allProducts.products || [];
      const productsToShow = fp.length >= 12 ? fp : ap;
      
      const catList = cats.data?.categories || cats.categories || [];
      const mfrList = mfrs.data?.manufacturers || mfrs.manufacturers || [];
      const na = newest.data?.products || newest.products || [];
      const dealList = deals.data?.products || deals.products || [];
      const reviewList = reviews.data?.reviews || reviews.reviews || [];
      const labEquipList = labEquip.data?.products || labEquip.products || [];
      const topSellingList = topSelling.data?.products || topSelling.products || [];
      
      const diagnosticList = diagnostic.data?.products || diagnostic.products || [];
      const reagentsList = reagents.data?.products || reagents.products || [];
      const machinesList = machines.data?.products || machines.products || [];
      const ppeList = ppe.data?.products || ppe.products || [];
      const labEquipCatList = labEquipCat.data?.products || labEquipCat.products || [];
      
      setData(prev => ({
        ...prev,
        featuredProducts: productsToShow,
        categories: catList.length > 0 ? catList : FALLBACK_CATEGORIES,
        categoryCounts: counts.data || {},
        stats: statsData.data || prev.stats,
        promo: promoData.data?.coupon || null,
        newArrivals: na,
        brands: mfrList,
        dealProducts: dealList,
        testimonials: reviewList,
        labEquipmentProducts: labEquipList,
        topSellingProducts: topSellingList,
        categoryProducts: {
          diagnostic: diagnosticList,
          reagents: reagentsList,
          machines: machinesList,
          ppe: ppeList,
          labEquipment: labEquipCatList,
        },
        featuredLoading: false,
      }));
    }).catch(() => {
      setData(prev => ({
        ...prev,
        featuredLoading: false,
        categories: FALLBACK_CATEGORIES,
      }));
    });

    // Check user auth
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          if (data.user) setData(prev => ({ ...prev, user: data.user }));
        })
        .catch(() => {});
    }

    // Get cart count
    const cartData = localStorage.getItem('cart');
    if (cartData) {
      try {
        const cart = JSON.parse(cartData);
        const count = cart.items?.length || 0;
        setData(prev => ({ ...prev, cartCount: count }));
      } catch {}
    }
  }, []);

  // ── Handlers - Memoized for better performance ───────────────────────────────────────────

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  }, [searchQuery, router]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setData(prev => ({ ...prev, featuredLoading: true }));
    const featuredUrl = tab === 'all' 
      ? `${API}/products?isFeatured=true&limit=24`
      : `${API}/products?category=${encodeURIComponent(tab)}&isFeatured=true&limit=24`;
    const fallbackUrl = tab === 'all' 
      ? `${API}/products?limit=24`
      : `${API}/products?category=${encodeURIComponent(tab)}&limit=24`;
    
    // Try featured first, fallback to all products if not enough
    Promise.all([
      fetch(featuredUrl).then(r => r.json()),
      fetch(fallbackUrl).then(r => r.json())
    ]).then(([featuredData, fallbackData]) => {
      const featured = featuredData.data?.products || featuredData.products || [];
      const fallback = fallbackData.data?.products || fallbackData.products || [];
      const products = featured.length >= 12 ? featured : fallback;
      setFeaturedProducts(products);
      setFeaturedLoading(false);
    }).catch(() => setFeaturedLoading(false));
  }, []);

  const handleSubscribe = useCallback(async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setSubscribeStatus('error');
      return;
    }
    setSubscribeStatus('loading');
    try {
      const response = await fetch(`${API}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setSubscribeStatus('success');
        setEmail('');
      } else {
        setSubscribeStatus('error');
      }
    } catch {
      setSubscribeStatus('error');
    }
  }, [email]);

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      {/* Global Styles */}
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.3); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes drift { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(30px, -30px); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 6px; will-change: background-position; }
        .marquee-wrap { overflow: hidden; }
        .marquee-track { display: flex; animation: marquee 25s linear infinite; width: max-content; will-change: transform; }
        .marquee-track:hover { animation-play-state: paused; }
        .product-card-hover { transition: box-shadow 0.2s, transform 0.2s; will-change: transform; }
        .product-card-hover:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.12); transform: translateY(-3px); }
        .cat-tile { transition: all 0.2s; }
        .cat-tile:hover { border-color: #0E8A6E !important; }
        .cat-tile:hover .cat-tile-arrow { opacity: 1 !important; transform: translateX(3px) !important; }
        .section-in { animation: fadeInUp 0.5s ease both; }
        .tab-active { background: #0B2545 !important; color: #fff !important; }
        .pill-hover:hover { background: rgba(255,255,255,0.2) !important; }
        .btn-primary-hover:hover { background: #0a1f3d !important; }
        .btn-teal-hover:hover { background: #0c7a61 !important; transform: scale(1.02); }
        .trust-item { transition: transform 0.2s; }
        .trust-item:hover { transform: translateY(-2px); }
        .hero-content > * { animation: slideIn 0.6s ease forwards; opacity: 0; }
        .hero-content > *:nth-child(1) { animation-delay: 0.1s; }
        .hero-content > *:nth-child(2) { animation-delay: 0.2s; }
        .hero-content > *:nth-child(3) { animation-delay: 0.3s; }
        .hero-content > *:nth-child(4) { animation-delay: 0.4s; }
        .hero-content > *:nth-child(5) { animation-delay: 0.5s; }
        .hero-content > *:nth-child(6) { animation-delay: 0.6s; }
        .hero-content > *:nth-child(7) { animation-delay: 0.7s; }
        .floating-card { animation: float 3s ease-in-out infinite; will-change: transform; }
        .orb-drift { animation: drift 20s ease-in-out infinite; will-change: transform; }
        .slide-active { animation: scaleIn 0.6s ease forwards; will-change: transform, opacity; }
        .typewriter-text { animation: fadeSlide 0.5s ease forwards; will-change: transform, opacity; }
        .hero-grid-container { width: 100%; }
        /* Custom scrollbar for category navigation */
        *::-webkit-scrollbar { height: 6px; }
        *::-webkit-scrollbar-track { background: #F3F4F6; border-radius: 10px; }
        *::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 10px; }
        *::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
        /* Category section styles */
        .category-section { padding: 40px 0; border-bottom: 1px solid #F3F4F6; }
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
          .hero-grid-container { grid-template-columns: 1fr !important; gap: 40px !important; }
          .hero-right-panel { display: none !important; }
          .hero-left-slider { height: 400px !important; }
          .hero-content h1 { font-size: 36px !important; }
          .hero-content p { font-size: 16px !important; }
          .hero-content { padding: 0 40px !important; }
          .prod-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .cat-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .hero-left-slider { height: 320px !important; }
          .hero-content h1 { font-size: 28px !important; }
          .hero-content p { font-size: 14px !important; max-width: 100% !important; }
          .hero-content { padding: 0 24px !important; }
          .hero-content > div:first-child { font-size: 12px !important; }
          .hero-content button { padding: 12px 24px !important; font-size: 14px !important; }
          .prod-grid-4 { grid-template-columns: 1fr !important; }
          .stats-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .trust-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .b2b-cols { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION WITH SLIDER (LEFT) + 3 BANNERS (RIGHT) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: '#F8FAFC',
        position: 'relative', overflow: 'hidden', padding: '24px 0'
      }}>
        <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', padding: '0 24px',
          position: 'relative', display: 'grid', gridTemplateColumns: '70% 30%', gap: 20,
          alignItems: 'stretch', zIndex: 2 }}
          className="hero-grid-container">

          {/* ═══════════════════ LEFT SIDE: IMAGE SLIDER WITH OVERLAY (70%) ═══════════════════ */}
          <div className="hero-left-slider" style={{ position: 'relative', height: '480px', borderRadius: 12, overflow: 'hidden', zIndex: 3, background: '#E5E7EB' }}
            onMouseEnter={() => setIsSliderHovered(true)}
            onMouseLeave={() => setIsSliderHovered(false)}>
            
            {/* Slide counter */}
            <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10,
              color: '#fff', fontSize: 12, fontWeight: 600,
              background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: 20 }}>
              {String(currentSlide + 1).padStart(2, '0')} / 04
            </div>

            {/* SLIDE 1: Medical Equipment */}
            {currentSlide === 0 && (
              <div className="slide-active" style={{ position: 'absolute', inset: 0 }}>
                <img 
                  src="https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800&h=400&fit=crop" 
                  alt="Medical Equipment"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x380/0E8A6E/ffffff?text=Medical+Equipment';
                  }}
                />
                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(14,138,110,0.85) 0%, rgba(14,138,110,0.4) 100%)' }} />
                {/* Content overlay */}
                <div className="hero-content" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 60px', color: '#fff' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, opacity: 0.95 }}>
                    🩺 Premium Quality
                  </div>
                  <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1, marginBottom: 16, maxWidth: 600 }}>
                    Medical Equipment for Modern Healthcare
                  </h1>
                  <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 28, maxWidth: 520, opacity: 0.95 }}>
                    ECG machines, ultrasound systems, patient monitors, and diagnostic tools from trusted global brands
                  </p>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <button onClick={() => router.push('/products?category=Diagnostic+Equipment')}
                      style={{ background: '#fff', color: '#0E8A6E', border: 'none', padding: '14px 32px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                      className="btn-teal-hover">
                      Shop Now →
                    </button>
                    <button onClick={() => router.push('/products')}
                      style={{ background: 'transparent', color: '#fff', border: '2px solid #fff', padding: '14px 32px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      View Catalog
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 2: Laboratory Reagents */}
            {currentSlide === 1 && (
              <div className="slide-active" style={{ position: 'absolute', inset: 0 }}>
                <img 
                  src="https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&h=400&fit=crop" 
                  alt="Laboratory"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x380/8B5CF6/ffffff?text=Laboratory+Reagents';
                  }}
                />
                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(139,92,246,0.85) 0%, rgba(139,92,246,0.4) 100%)' }} />
                {/* Content overlay */}
                <div className="hero-content" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 60px', color: '#fff' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, opacity: 0.95 }}>
                    🧪 Laboratory Excellence
                  </div>
                  <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1, marginBottom: 16, maxWidth: 600 }}>
                    Clinical & Molecular Reagents
                  </h1>
                  <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 28, maxWidth: 520, opacity: 0.95 }}>
                    Finecare, Roche, Abbott reagents with cold chain delivery. DGDA approved and quality assured
                  </p>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <button onClick={() => router.push('/products?category=Laboratory+Reagents')}
                      style={{ background: '#fff', color: '#8B5CF6', border: 'none', padding: '14px 32px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                      className="btn-teal-hover">
                      Browse Reagents →
                    </button>
                    <button onClick={() => router.push('/quote')}
                      style={{ background: 'transparent', color: '#fff', border: '2px solid #fff', padding: '14px 32px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      Request Quote
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 3: Hospital Machines */}
            {currentSlide === 2 && (
              <div className="slide-active" style={{ position: 'absolute', inset: 0 }}>
                <img 
                  src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&h=400&fit=crop" 
                  alt="Hospital"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x380/EA580C/ffffff?text=Hospital+Machines';
                  }}
                />
                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(234,88,12,0.85) 0%, rgba(234,88,12,0.4) 100%)' }} />
                {/* Content overlay */}
                <div className="hero-content" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 60px', color: '#fff' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, opacity: 0.95 }}>
                    🏥 Critical Care
                  </div>
                  <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1, marginBottom: 16, maxWidth: 600 }}>
                    ICU & Hospital Equipment
                  </h1>
                  <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 28, maxWidth: 520, opacity: 0.95 }}>
                    Ventilators, dialysis machines, anesthesia systems. Free installation & staff training included
                  </p>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <button onClick={() => router.push('/products?category=Hospital+Machines')}
                      style={{ background: '#fff', color: '#EA580C', border: 'none', padding: '14px 32px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                      className="btn-teal-hover">
                      View Equipment →
                    </button>
                    <button onClick={() => router.push('/contact')}
                      style={{ background: 'transparent', color: '#fff', border: '2px solid #fff', padding: '14px 32px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      Contact Sales
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 4: Surgical Instruments */}
            {currentSlide === 3 && (
              <div className="slide-active" style={{ position: 'absolute', inset: 0 }}>
                <img 
                  src="https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=400&fit=crop" 
                  alt="Surgical Instruments"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x380/0B2545/ffffff?text=Surgical+Instruments';
                  }}
                />
                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(11,37,69,0.85) 0%, rgba(11,37,69,0.4) 100%)' }} />
                {/* Content overlay */}
                <div className="hero-content" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 60px', color: '#fff' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, opacity: 0.95 }}>
                    💉 Surgical Excellence
                  </div>
                  <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1, marginBottom: 16, maxWidth: 600 }}>
                    Precision Surgical Instruments
                  </h1>
                  <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 28, maxWidth: 520, opacity: 0.95 }}>
                    Trocars, laparoscopic sets, implants, and orthopedic instruments. Bulk discounts available
                  </p>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <button onClick={() => router.push('/products?category=Surgical+Instruments')}
                      style={{ background: '#fff', color: '#0B2545', border: 'none', padding: '14px 32px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                      className="btn-teal-hover">
                      Shop Surgical →
                    </button>
                    <button onClick={() => router.push('/b2b')}
                      style={{ background: 'transparent', color: '#fff', border: '2px solid #fff', padding: '14px 32px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      B2B Pricing
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dot indicators */}
            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 8, zIndex: 10 }}>
              {[0, 1, 2, 3].map(i => (
                <button key={i} onClick={() => setCurrentSlide(i)}
                  style={{ width: currentSlide === i ? 32 : 10, height: 10,
                    borderRadius: 999, border: 'none', cursor: 'pointer',
                    background: currentSlide === i ? '#4DDBB8' : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.3s' }} />
              ))}
            </div>

            {/* Navigation arrows */}
            <button onClick={() => setCurrentSlide(prev => (prev - 1 + 4) % 4)}
              style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
                width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 20,
                cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(10px)',
                opacity: isSliderHovered ? 1 : 0 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
              ‹
            </button>
            <button onClick={() => setCurrentSlide(prev => (prev + 1) % 4)}
              style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
                width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 20,
                cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(10px)',
                opacity: isSliderHovered ? 1 : 0 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
              ›
            </button>
          </div>

          {/* ═══════════════════ RIGHT SIDE: 2 STACKED VERTICAL BANNERS (30%) ═══════════════════ */}
          <div className="hero-right-panel" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '480px', zIndex: 3 }}>
            
            {/* TOP BANNER: B2B Registration */}
            <div style={{ position: 'relative', flex: 1, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.3s' }}
              onClick={() => router.push('/b2b')}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <img 
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=234&fit=crop" 
                alt="B2B Registration"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x234/0E8A6E/ffffff?text=B2B+Registration';
                }}
              />
              {/* Gradient overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(14,138,110,0.9) 0%, rgba(14,138,110,0.6) 100%)' }} />
              {/* Content */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 20, color: '#fff', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
                  B2B Registration
                </h3>
                <p style={{ fontSize: 13, opacity: 0.95, marginBottom: 12, lineHeight: 1.4 }}>
                  Get up to 30% bulk discount
                </p>
                <div style={{ background: '#fff', color: '#0E8A6E', padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 700 }}>
                  Register Now →
                </div>
              </div>
            </div>

            {/* BOTTOM BANNER: Rotating Special Offers */}
            <div style={{ position: 'relative', flex: 1, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.3s' }}
              onClick={() => router.push('/products?hasDiscount=true')}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              
              {/* Banner 1: Special Offers */}
              {currentRightBanner === 0 && (
                <div className="slide-active" style={{ position: 'absolute', inset: 0 }}>
                  <img 
                    src="https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&h=234&fit=crop" 
                    alt="Special Offers"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x234/F97316/ffffff?text=Special+Offers';
                    }}
                  />
                  {/* Gradient overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(249,115,22,0.9) 0%, rgba(249,115,22,0.6) 100%)' }} />
                  {/* Content */}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 20, color: '#fff', textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🎁</div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
                      Special Offers
                    </h3>
                    <p style={{ fontSize: 13, opacity: 0.95, marginBottom: 12, lineHeight: 1.4 }}>
                      Up to 25% off selected items
                    </p>
                    <div style={{ background: '#fff', color: '#F97316', padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 700 }}>
                      Shop Deals →
                    </div>
                  </div>
                </div>
              )}

              {/* Banner 2: New Arrivals */}
              {currentRightBanner === 1 && (
                <div className="slide-active" style={{ position: 'absolute', inset: 0 }}>
                  <img 
                    src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=234&fit=crop" 
                    alt="New Arrivals"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x234/8B5CF6/ffffff?text=New+Arrivals';
                    }}
                  />
                  {/* Gradient overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(139,92,246,0.9) 0%, rgba(139,92,246,0.6) 100%)' }} />
                  {/* Content */}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 20, color: '#fff', textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
                      New Arrivals
                    </h3>
                    <p style={{ fontSize: 13, opacity: 0.95, marginBottom: 12, lineHeight: 1.4 }}>
                      Latest medical equipment
                    </p>
                    <div style={{ background: '#fff', color: '#8B5CF6', padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 700 }}>
                      Explore New →
                    </div>
                  </div>
                </div>
              )}

              {/* Banner 3: Free Delivery */}
              {currentRightBanner === 2 && (
                <div className="slide-active" style={{ position: 'absolute', inset: 0 }}>
                  <img 
                    src="https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=400&h=234&fit=crop" 
                    alt="Free Delivery"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x234/10B981/ffffff?text=Free+Delivery';
                    }}
                  />
                  {/* Gradient overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(16,185,129,0.9) 0%, rgba(16,185,129,0.6) 100%)' }} />
                  {/* Content */}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 20, color: '#fff', textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🚚</div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
                      Free Delivery
                    </h3>
                    <p style={{ fontSize: 13, opacity: 0.95, marginBottom: 12, lineHeight: 1.4 }}>
                      On orders over ৳50,000
                    </p>
                    <div style={{ background: '#fff', color: '#10B981', padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 700 }}>
                      Learn More →
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: CATEGORY NAVIGATION (Othoba-style circular icons) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: '32px 0', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, color: '#0E8A6E', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Our Catalog</p>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, margin: 0 }}>
                Shop by Category
              </h2>
            </div>
          </div>
          
          {/* Horizontal scrollable category circles */}
          <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 8,
            scrollbarWidth: 'thin', scrollbarColor: '#E5E7EB transparent' }}>
            {[
              { name: 'Lab Reagents', emoji: '🧪', color: '#FAF5FF', path: '/products?category=Laboratory+Reagents' },
              { name: 'Hospital Machines', emoji: '🏥', color: '#FFF7ED', path: '/products?category=Hospital+Machines' },
              { name: 'Lab Equipment', emoji: '🔬', color: '#F0FDFA', path: '/products?category=Lab+Equipment' },
              { name: 'PPE & Safety', emoji: '🛡️', color: '#FFF1F2', path: '/products?category=PPE' },
              { name: 'Implants', emoji: '🦴', color: '#F8FAFC', path: '/products?category=Implants' },
              { name: 'Diagnostic', emoji: '🩺', color: '#EFF6FF', path: '/products?category=Diagnostic+Equipment' },
              { name: 'Surgical', emoji: '💉', color: '#F0FDF4', path: '/products?category=Surgical+Instruments' },
            ].map(cat => (
              <div key={cat.name} onClick={() => router.push(cat.path)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                  minWidth: 100, cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                {/* Circular icon */}
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: cat.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36, marginBottom: 10, border: '2px solid #E5E7EB',
                  transition: 'all 0.2s' }}>
                  {cat.emoji}
                </div>
                {/* Category name */}
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151',
                  textAlign: 'center', lineHeight: 1.3 }}>
                  {cat.name}
                </span>
              </div>
            ))}
            
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
                View All
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 6: PROMO BANNER (conditional) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {promo && (
        <div style={{ background: 'linear-gradient(90deg, #085041, #0E8A6E, #085041)',
          padding: '14px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 20, flexWrap: 'wrap', position: 'relative' }}>
          <span style={{ fontSize: 20 }}>🏷️</span>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>
            Limited time: Use code{' '}
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px',
              borderRadius: 5, fontWeight: 800, fontSize: 16, letterSpacing: '0.05em' }}>
              {promo.code}
            </span>
            {' '}for {promo.type === 'percentage' ? `${promo.value}% off` : `৳${promo.value} off`}
            {promo.description ? ` — ${promo.description}` : ''}
          </div>
          <button onClick={() => { navigator.clipboard.writeText(promo.code); alert('Code copied!'); }}
            style={{ background: '#fff', color: '#0E8A6E', border: 'none', padding: '6px 14px',
              borderRadius: 16, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Copy code
          </button>
          <button onClick={() => router.push('/products')}
            style={{ background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.6)',
              padding: '6px 14px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Shop now →
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 7: DEAL OF THE DAY */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {dealProducts.length > 0 && (
        <section style={{ background: '#0B2545', padding: '32px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: '#4DDBB8', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  🔥 Flash Deals
                </div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700,
                  color: '#fff', margin: 0 }}>Deal of the Day</h2>
              </div>
              {/* Countdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Ends in:</span>
                {[
                  { val: timeLeft.h, label: 'hrs' },
                  { val: timeLeft.m, label: 'min' },
                  { val: timeLeft.s, label: 'sec' },
                ].map((t, i) => (
                  <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: i > 0 ? 6 : 0 }}>
                    {i > 0 && <span style={{ color: '#4DDBB8', fontWeight: 700, fontSize: 18 }}>:</span>}
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8,
                      padding: '8px 12px', textAlign: 'center', minWidth: 52 }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#4DDBB8', lineHeight: 1 }}>
                        {String(t.val).padStart(2, '0')}
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{t.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push('/products?sortBy=discount')}
                style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: 8,
                  fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                See all deals →
              </button>
            </div>

            {/* 4 deal product cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {dealProducts.slice(0, 4).map(product => (
                <ProductCard key={product._id} product={product} onClick={() => router.push(`/products/${product._id}`)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 7.5: TOP SELLING PRODUCTS */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {topSellingProducts.length > 0 && (
        <section style={{ background: '#fff', padding: '48px 0', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, margin: 0 }}>
                  Top Selling Products
                </h2>
              </div>
              <button onClick={() => router.push('/products?sortBy=popular')}
                style={{ fontSize: 13, color: '#0E8A6E', fontWeight: 600, background: 'none',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                View All <span style={{ fontSize: 16 }}>→</span>
              </button>
            </div>

            {/* 2x2 Grid of horizontal cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}
              className="prod-grid-4">
              {topSellingProducts.slice(0, 4).map(product => {
                const img = product.images?.[0]?.url || product.images?.[0];
                const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
                const price = product.price || 0;
                const oldPrice = product.oldPrice || 0;
                const savings = oldPrice > price ? oldPrice - price : 0;
                const hasDiscount = savings > 0;

                return (
                  <div key={product._id} className="top-selling-card"
                    onClick={() => router.push(`/products/${product._id}`)}
                    style={{ display: 'flex', gap: 16, padding: 16, background: '#fff',
                      border: '1px solid #E5E7EB', borderRadius: 12, position: 'relative',
                      cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                    
                    {/* Best Selling Badge */}
                    <div className="best-selling-badge" style={{ position: 'absolute', top: -1, right: -1,
                      background: '#F97316', color: '#fff', fontSize: 10, fontWeight: 600,
                      padding: '3px 8px', borderRadius: '0 12px 0 8px' }}>
                      BEST SELLING
                    </div>

                    {/* Left: Image */}
                    <div style={{ width: 100, height: 100, flexShrink: 0, borderRadius: 8,
                      overflow: 'hidden', background: '#F9FAFB' }}>
                      {img ? (
                        <img src={img} alt={product.name} loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                          height: '100%', fontSize: 32 }}>🏥</div>
                      )}
                    </div>

                    {/* Right: Details */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        {brandName && (
                          <div style={{ fontSize: 10, color: '#0E8A6E', fontWeight: 600,
                            textTransform: 'uppercase', marginBottom: 4 }}>
                            {brandName}
                          </div>
                        )}
                        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, marginBottom: 8,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          overflow: 'hidden' }}>
                          {product.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: '#0B2545' }}>
                            ৳{price.toLocaleString()}
                          </span>
                          {oldPrice > price && (
                            <span style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'line-through' }}>
                              ৳{oldPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {hasDiscount && (
                          <div style={{ display: 'inline-block', background: '#10B981', color: '#fff',
                            fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4 }}>
                            Save ৳{savings.toLocaleString()}
                          </div>
                        )}
                      </div>
                      
                      {/* Buttons */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          addToCart(product, 1);
                        }}
                          style={{ flex: 1, padding: '8px 12px', background: '#fff', color: '#0E8A6E',
                            border: '1.5px solid #0E8A6E', borderRadius: 6, fontSize: 12,
                            fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#F0FDF4'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                          Add to Cart
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); router.push(`/products/${product._id}`); }}
                          style={{ flex: 1, padding: '8px 12px', background: '#0E8A6E', color: '#fff',
                            border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#0c7a61'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#0E8A6E'; }}>
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 8: FEATURED PRODUCTS (tabbed) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#F8FAFC', padding: '48px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, color: '#0E8A6E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Hand-picked</p>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, margin: 0 }}>Featured Products</h2>
            </div>
            <button onClick={() => router.push('/products')}
              style={{ fontSize: 13, color: '#0E8A6E', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
              View all →
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'All Products' },
              { key: 'Diagnostic Equipment', label: '🩺 Diagnostic' },
              { key: 'Surgical Instruments', label: '💉 Surgical' },
              { key: 'Laboratory Reagents', label: '🧪 Reagents' },
              { key: 'Hospital Machines', label: '🏥 Machines' },
            ].map(tab => (
              <button key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={activeTab === tab.key ? 'tab-active' : ''}
                style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid #E5E7EB',
                  background: activeTab === tab.key ? '#0B2545' : '#fff',
                  color: activeTab === tab.key ? '#fff' : '#374151',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Products grid */}
          {featuredLoading
            ? <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
                <div style={{ width: 36, height: 36, border: '3px solid #E5E7EB',
                  borderTopColor: '#0B2545', borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite' }} />
                <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
              </div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {featuredProducts.map(p => (
                  <ProductCard key={p._id} product={p} onClick={() => router.push(`/products/${p._id}`)} />
                ))}
              </div>
          }
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 9: NEW ARRIVALS (horizontal scroll) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {newArrivals.length > 0 && (
        <section style={{ padding: '40px 0', background: '#fff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 24px', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 11, color: '#0E8A6E', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Just Arrived</p>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, margin: 0 }}>
                  New Arrivals
                </h2>
              </div>
              <button onClick={() => router.push('/products?sortBy=newest')}
                style={{ fontSize: 13, color: '#0E8A6E', fontWeight: 500, background: 'none',
                  border: 'none', cursor: 'pointer' }}>View all →</button>
            </div>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '4px 24px 16px',
              scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {newArrivals.map(p => {
                const img = p.images?.[0]?.url || p.images?.[0];
                return (
                  <div key={p._id} className="product-card-hover"
                    onClick={() => router.push(`/products/${p._id}`)}
                    style={{ minWidth: 180, maxWidth: 180, background: '#fff', borderRadius: 12,
                      border: '1px solid #E5E7EB', overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ height: 160, background: '#F9FAFB', position: 'relative', overflow: 'hidden' }}>
                      {img
                        ? <img src={img} alt={p.name} loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                            height: '100%', fontSize: 40 }}>🏥</div>
                      }
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
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* CATEGORY SECTIONS: Diagnostic Equipment, Lab Reagents, Hospital Machines, PPE, Lab Equipment */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      
      {/* Category Section: Diagnostic Equipment */}
      {categoryProducts.diagnostic.length > 0 && (
        <section className="category-section" style={{ padding: '40px 0', borderBottom: '1px solid #F3F4F6', background: '#fff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="category-section-header" style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 20, padding: '0 24px' }}>
              <div className="category-title-accent" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 4, height: 24, background: '#0E8A6E', borderRadius: 2 }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Diagnostic Equipment</h2>
              </div>
              <button onClick={() => router.push('/products?category=Diagnostic+Equipment')}
                style={{ fontSize: 13, color: '#0E8A6E', fontWeight: 600, background: 'none',
                  border: 'none', cursor: 'pointer' }}>
                View All Items →
              </button>
            </div>
            <div className="category-product-row" style={{ display: 'flex', gap: 16, overflowX: 'auto',
              padding: '0 24px 8px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {categoryProducts.diagnostic.map(product => (
                <div key={product._id} style={{ minWidth: 200, maxWidth: 220, flexShrink: 0 }}>
                  <ProductCard product={product} onClick={() => router.push(`/products/${product._id}`)} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Section: Laboratory Reagents */}
      {categoryProducts.reagents.length > 0 && (
        <section className="category-section" style={{ padding: '40px 0', borderBottom: '1px solid #F3F4F6', background: '#fff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="category-section-header" style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 20, padding: '0 24px' }}>
              <div className="category-title-accent" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 4, height: 24, background: '#0E8A6E', borderRadius: 2 }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Laboratory Reagents</h2>
              </div>
              <button onClick={() => router.push('/products?category=Laboratory+Reagents')}
                style={{ fontSize: 13, color: '#0E8A6E', fontWeight: 600, background: 'none',
                  border: 'none', cursor: 'pointer' }}>
                View All Items →
              </button>
            </div>
            <div className="category-product-row" style={{ display: 'flex', gap: 16, overflowX: 'auto',
              padding: '0 24px 8px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {categoryProducts.reagents.map(product => (
                <div key={product._id} style={{ minWidth: 200, maxWidth: 220, flexShrink: 0 }}>
                  <ProductCard product={product} onClick={() => router.push(`/products/${product._id}`)} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Section: Hospital Machines */}
      {categoryProducts.machines.length > 0 && (
        <section className="category-section" style={{ padding: '40px 0', borderBottom: '1px solid #F3F4F6', background: '#fff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="category-section-header" style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 20, padding: '0 24px' }}>
              <div className="category-title-accent" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 4, height: 24, background: '#0E8A6E', borderRadius: 2 }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Hospital Machines</h2>
              </div>
              <button onClick={() => router.push('/products?category=Hospital+Machines')}
                style={{ fontSize: 13, color: '#0E8A6E', fontWeight: 600, background: 'none',
                  border: 'none', cursor: 'pointer' }}>
                View All Items →
              </button>
            </div>
            <div className="category-product-row" style={{ display: 'flex', gap: 16, overflowX: 'auto',
              padding: '0 24px 8px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {categoryProducts.machines.map(product => (
                <div key={product._id} style={{ minWidth: 200, maxWidth: 220, flexShrink: 0 }}>
                  <ProductCard product={product} onClick={() => router.push(`/products/${product._id}`)} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Section: PPE & Safety */}
      {categoryProducts.ppe.length > 0 && (
        <section className="category-section" style={{ padding: '40px 0', borderBottom: '1px solid #F3F4F6', background: '#fff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="category-section-header" style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 20, padding: '0 24px' }}>
              <div className="category-title-accent" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 4, height: 24, background: '#0E8A6E', borderRadius: 2 }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>PPE & Safety</h2>
              </div>
              <button onClick={() => router.push('/products?category=PPE')}
                style={{ fontSize: 13, color: '#0E8A6E', fontWeight: 600, background: 'none',
                  border: 'none', cursor: 'pointer' }}>
                View All Items →
              </button>
            </div>
            <div className="category-product-row" style={{ display: 'flex', gap: 16, overflowX: 'auto',
              padding: '0 24px 8px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {categoryProducts.ppe.map(product => (
                <div key={product._id} style={{ minWidth: 200, maxWidth: 220, flexShrink: 0 }}>
                  <ProductCard product={product} onClick={() => router.push(`/products/${product._id}`)} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Section: Lab Equipment */}
      {categoryProducts.labEquipment.length > 0 && (
        <section className="category-section" style={{ padding: '40px 0', borderBottom: '1px solid #F3F4F6', background: '#fff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="category-section-header" style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 20, padding: '0 24px' }}>
              <div className="category-title-accent" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 4, height: 24, background: '#0E8A6E', borderRadius: 2 }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Lab Equipment</h2>
              </div>
              <button onClick={() => router.push('/products?category=Lab+Equipment')}
                style={{ fontSize: 13, color: '#0E8A6E', fontWeight: 600, background: 'none',
                  border: 'none', cursor: 'pointer' }}>
                View All Items →
              </button>
            </div>
            <div className="category-product-row" style={{ display: 'flex', gap: 16, overflowX: 'auto',
              padding: '0 24px 8px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {categoryProducts.labEquipment.map(product => (
                <div key={product._id} style={{ minWidth: 200, maxWidth: 220, flexShrink: 0 }}>
                  <ProductCard product={product} onClick={() => router.push(`/products/${product._id}`)} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 11: OUR BRANDS (Grid + Marquee) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#F8FAFC', padding: '48px 0', borderTop: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {/* Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 8 }}>
                Our Brands
              </h2>
              <div style={{ width: 60, height: 3, background: '#F97316', borderRadius: 2 }} />
            </div>
            <button onClick={() => router.push('/products')}
              style={{ fontSize: 13, color: '#0E8A6E', fontWeight: 600, background: 'none',
                border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SEE ALL →
            </button>
          </div>

          {/* 4-column grid of brand cards */}
          <div className="cat-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
            {brands.slice(0, 8).map((brand, i) => {
              const brandName = typeof brand === 'object' ? brand.name : brand;
              const brandLogo = typeof brand === 'object' ? brand.logo?.url : null;
              
              return (
                <div key={i} onClick={() => router.push('/products')}
                  style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
                    padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minHeight: 100, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#0E8A6E'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}>
                  {brandLogo ? (
                    <img src={brandLogo} alt={brandName} style={{ maxWidth: '100%', maxHeight: 50, objectFit: 'contain' }} />
                  ) : (
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', textAlign: 'center' }}>
                      {brandName}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Secondary marquee below grid */}
          <p style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', fontWeight: 500,
            textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
            Authorised distributor of world-leading brands
          </p>
          <div className="marquee-wrap">
            <div className="marquee-track">
              {[...brands, ...brands].map((brand, i) => (
                <div key={i} style={{ padding: '0 40px', fontSize: 13, fontWeight: 500,
                  color: '#6B7280', whiteSpace: 'nowrap', borderRight: '1px solid #E5E7EB',
                  display: 'flex', alignItems: 'center', height: 32 }}>
                  {typeof brand === 'object' && brand.logo?.url
                    ? <img src={brand.logo.url} alt={brand.name} style={{ height: 20, objectFit: 'contain' }} />
                    : (typeof brand === 'string' ? brand : brand.name)
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 12: WHY MEDCORE BD - REMOVED */}
      {/* This section has been deleted as per requirements */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 13: ANIMATED STATS COUNTER */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section ref={statsRef} style={{ background: '#0B2545', padding: '56px 24px' }}>
        <div className="stats-grid-4" style={{ maxWidth: 1200, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            { count: productsCount, suffix: '+', label: 'Products Available', icon: <FaBox size={28} /> },
            { count: brandsCount, suffix: '+', label: 'Global Brands', icon: <FaIndustry size={28} /> },
            { count: clientsCount, suffix: '+', label: 'B2B Clients', icon: <FaHospital size={28} /> },
            { count: ordersCount, suffix: '+', label: 'Orders Fulfilled', icon: <FaTruck size={28} /> },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '28px 16px',
              background: 'rgba(255,255,255,0.05)', borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 32, marginBottom: 12, color: '#4DDBB8' }}>{s.icon}</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 44, fontWeight: 700,
                color: '#4DDBB8', lineHeight: 1 }}>
                {s.count > 0 ? `${s.count.toLocaleString()}${s.suffix}` : '—'}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 10 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 14: B2B PROGRAM BANNER */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px' }}>
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
                textTransform: 'uppercase', letterSpacing: '0.08em' }}>B2B Program</span>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700,
                color: '#fff', margin: '14px 0 12px' }}>
                Exclusive Benefits for<br />Hospitals & Clinics
              </h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 24, lineHeight: 1.8 }}>
                Join {stats.totalB2BClients > 0 ? `${stats.totalB2BClients.toLocaleString()}+` : '1,200+'} healthcare institutions saving with our B2B program.
                Get bulk discounts, flexible credit terms, and a dedicated account manager.
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
                  Register for B2B →
                </button>
                <button onClick={() => router.push('/b2b')}
                  style={{ padding: '13px 24px', background: 'rgba(255,255,255,0.1)',
                    border: '1.5px solid rgba(255,255,255,0.25)', color: '#fff',
                    borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                  Learn more
                </button>
              </div>
            </div>
            {/* Right stat boxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { val: stats.totalB2BClients > 0 ? `${stats.totalB2BClients.toLocaleString()}+` : '1,200+', label: 'Active B2B Clients' },
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
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 15: HOW IT WORKS */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#F8FAFC', padding: '56px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: 11, color: '#0E8A6E', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Simple Process</p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, margin: 0 }}>
              How It Works
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
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
      {/* SECTION 16: CUSTOMER TESTIMONIALS */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: 11, color: '#0E8A6E', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Testimonials</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, margin: 0 }}>
            What Our Clients Say
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {(testimonials.length > 0 ? testimonials : PLACEHOLDER_TESTIMONIALS).slice(0, 3).map((review, i) => {
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
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* FOOTER - Add your footer component here */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
    </div>
  );
}
