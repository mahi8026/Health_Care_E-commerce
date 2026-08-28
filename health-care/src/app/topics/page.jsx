import Link from 'next/link';
import { SITE_CONFIG } from '@/config/seo';
import { TOPICAL_CLUSTERS } from '@/config/topicalClusters';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';

export const revalidate = 3600;

export const metadata = {
  title: 'Medical Equipment Topics & Buying Guides in Bangladesh | MediportBD',
  description:
    'Explore MediportBD topic hubs — ECG machines, blood pressure monitors, ultrasound, surgical instruments, laboratory equipment, hospital ICU equipment and diabetes care with prices, brands and buying guidance in Bangladesh.',
  keywords:
    'medical equipment topics Bangladesh, ECG machines BD, BP monitors Bangladesh, ultrasound machines Bangladesh, surgical instruments BD, ICU equipment Bangladesh, diabetes care BD',
  alternates: { canonical: `${SITE_CONFIG.url}/topics` },
  openGraph: {
    title: 'Medical Equipment Topics & Buying Guides in Bangladesh | MediportBD',
    description: 'Topic hubs with prices, brands and buying guidance for medical equipment in Bangladesh.',
    url: `${SITE_CONFIG.url}/topics`,
    images: [{ url: `https://www.mediportbd.com/og-default.png`, width: 1200, height: 630 }],
  },
};

const ACCENT_COLORS = [
  { bg: 'from-blue-500/10 to-cyan-500/5', border: 'border-blue-200', icon: 'bg-blue-50 text-blue-600', badge: 'bg-blue-50 text-blue-700' },
  { bg: 'from-rose-500/10 to-pink-500/5', border: 'border-rose-200', icon: 'bg-rose-50 text-rose-600', badge: 'bg-rose-50 text-rose-700' },
  { bg: 'from-violet-500/10 to-purple-500/5', border: 'border-violet-200', icon: 'bg-violet-50 text-violet-600', badge: 'bg-violet-50 text-violet-700' },
  { bg: 'from-amber-500/10 to-orange-500/5', border: 'border-amber-200', icon: 'bg-amber-50 text-amber-700', badge: 'bg-amber-50 text-amber-700' },
  { bg: 'from-emerald-500/10 to-teal-500/5', border: 'border-emerald-200', icon: 'bg-emerald-50 text-emerald-600', badge: 'bg-emerald-50 text-emerald-700' },
  { bg: 'from-sky-500/10 to-indigo-500/5', border: 'border-sky-200', icon: 'bg-sky-50 text-sky-600', badge: 'bg-sky-50 text-sky-700' },
  { bg: 'from-fuchsia-500/10 to-pink-500/5', border: 'border-fuchsia-200', icon: 'bg-fuchsia-50 text-fuchsia-600', badge: 'bg-fuchsia-50 text-fuchsia-700' },
];

const totalGuides = TOPICAL_CLUSTERS.reduce((acc, c) => acc + (c.guideSlugs?.length || 0), 0);
const totalLanding = TOPICAL_CLUSTERS.reduce((acc, c) => acc + (c.landingSlugs?.length || 0), 0);

export default function TopicsHub() {
  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Topics', url: `${SITE_CONFIG.url}/topics` },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-[#0b2545] text-white"
        style={{ background: 'linear-gradient(135deg, #0b2545 0%, #0d3162 60%, #0b7a60 100%)' }}
      >
        {/* Decorative glows */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/10 blur-3xl" />
        </div>

        <div className="relative container mx-auto max-w-5xl px-4 py-14 md:py-20 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-1.5 mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-teal-300">
              MediportBD Knowledge Hub
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            Medical Equipment
            <span className="block text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(90deg, #4ddbb8, #7ee8cc)' }}>
              Topic Guides
            </span>
          </h1>
          <p className="text-white/65 text-sm md:text-base leading-relaxed max-w-2xl mx-auto mb-8">
            Deep-dive topic hubs combining real prices, trusted brands, buying guides and
            curated product collections — built for healthcare professionals in Bangladesh.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            {[
              { value: TOPICAL_CLUSTERS.length, label: 'Topic Hubs' },
              { value: totalLanding, label: 'Price Guides' },
              { value: totalGuides, label: 'Buying Guides' },
              { value: '10,000+', label: 'Products' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white">{value}</div>
                <div className="text-xs text-white/50 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Breadcrumb ───────────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-[#cfe0ec]">
        <div className="container mx-auto max-w-6xl px-4 py-2.5 flex items-center gap-1.5 text-xs text-tertiary">
          <Link href="/" className="hover:text-[#0b7a60] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-[#0f172a] font-medium">Topics</span>
        </div>
      </nav>

      {/* ── Topic Cards ──────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0b2545]">Browse All Topics</h2>
            <p className="text-xs text-tertiary mt-0.5">{TOPICAL_CLUSTERS.length} categories · Updated regularly</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOPICAL_CLUSTERS.map((cluster, i) => {
            const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
            return (
              <Link
                key={cluster.slug}
                href={`/topics/${cluster.slug}`}
                className={`group relative flex flex-col rounded-2xl border bg-gradient-to-br ${accent.bg} ${accent.border} bg-white p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden`}
              >
                {/* Subtle corner glow on hover */}
                <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/0 group-hover:bg-white/10 transition-all duration-300 blur-xl" />

                {/* Icon + badge row */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm ${accent.icon}`}>
                    {cluster.icon}
                  </div>
                  <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${accent.badge}`}>
                    {cluster.landingSlugs.length + cluster.guideSlugs.length} resources
                  </div>
                </div>

                {/* Title & description */}
                <h2 className="text-sm font-bold text-[#0b2545] mb-1.5 leading-snug group-hover:text-[#0b7a60] transition-colors">
                  {cluster.title}
                </h2>
                <p className="text-xs text-[#475569] leading-relaxed line-clamp-3 flex-1">
                  {cluster.metaDescription}
                </p>

                {/* Footer meta */}
                <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-tertiary">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      {cluster.landingSlugs.length} price guides
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {cluster.guideSlugs.length} guides
                    </span>
                  </div>
                  <span className="text-[#0b7a60] font-semibold text-xs flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                    Explore
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Bottom CTA row ──────────────────────────────────────────── */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              href: '/equipment',
              icon: '💰',
              label: 'Equipment Price Directory',
              sub: `${totalLanding} price guides`,
              color: 'from-[#0b2545] to-[#0d3162]',
            },
            {
              href: '/guides',
              icon: '📖',
              label: 'All Buying Guides',
              sub: `${totalGuides} expert guides`,
              color: 'from-[#0b7a60] to-[#096450]',
            },
            {
              href: '/brands',
              icon: '🏷️',
              label: 'Brand Directory',
              sub: '35+ global brands',
              color: 'from-[#1e3a5f] to-[#0b2545]',
            },
          ].map(({ href, icon, label, sub, color }) => (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-4 rounded-2xl bg-gradient-to-br ${color} text-white p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all`}
            >
              <span className="text-3xl">{icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-snug">{label}</p>
                <p className="text-xs text-white/55 mt-0.5">{sub}</p>
              </div>
              <svg className="ml-auto w-5 h-5 text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        {/* ── Quick links ─────────────────────────────────────────────── */}
        <section className="mt-8 rounded-2xl bg-white border border-[#cfe0ec] p-6">
          <h2 className="text-sm font-bold text-[#0b2545] mb-3">Quick Links</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { href: '/products', label: 'All Products' },
              { href: '/reagent-store', label: 'Laboratory Reagents' },
              { href: '/compare', label: 'Compare Equipment' },
              { href: '/b2b', label: 'B2B Portal' },
              { href: '/contact', label: 'Get a Quote' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-xs font-medium text-[#0b7a60] border border-[#0b7a60]/30 rounded-lg px-3 py-1.5 hover:bg-[#0b7a60] hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
