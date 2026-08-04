"use client";

import { showToast } from '@/components/ui/Toast';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { API } from '@/constants/api';
import Spinner from '@/components/ui/Spinner';

// â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatCard({ icon, label, value, sub, color = 'var(--color-brand-teal)' }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[var(--color-border-primary)] flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
        style={{ background: color + '18' }}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-[var(--color-text-secondary)] mb-0.5">{label}</div>
        <div className="text-xl font-semibold text-brand-navy">{value}</div>
        {sub && <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    delivered:   { bg: 'var(--color-status-success-tint)', text: 'var(--color-status-success)', label: 'Delivered' },
    shipped:     { bg: 'var(--color-status-info-tint)', text: 'var(--color-status-info)', label: 'Shipped' },
    processing:  { bg: 'var(--color-status-warning-tint)', text: 'var(--color-status-warning)', label: 'Processing' },
    pending:     { bg: 'var(--color-status-warning-tint)', text: 'var(--color-status-warning)', label: 'Pending' },
    cancelled:   { bg: 'var(--color-status-danger-tint)', text: 'var(--color-status-danger)', label: 'Cancelled' },
    approved:    { bg: 'var(--color-status-success-tint)', text: 'var(--color-status-success)', label: 'Approved' },
    converted:   { bg: '#EDE9FE', text: '#5B21B6', label: 'Converted' },
    'in transit':{ bg: 'var(--color-status-info-tint)', text: 'var(--color-status-info)', label: 'In Transit' },
  };
  const s = map[status?.toLowerCase()] || { bg: 'var(--color-background-tertiary)', text: 'var(--color-text-primary)', label: status || 'â€”' };
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

// â”€â”€ Marketing landing page (unauthenticated) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Default tiers used as fallback if settings don't override
const DEFAULT_TIERS = [
  { name: 'Standard', min: 'à§³0',     discount: 8,  credit: 0,  color: 'var(--color-text-secondary)', bg: 'var(--color-background-secondary)' },
  { name: 'Silver',   min: 'à§³5L/yr', discount: 15, credit: 30, color: 'var(--color-text-secondary)', bg: 'var(--color-background-tertiary)' },
  { name: 'Gold',     min: 'à§³15L/yr',discount: 22, credit: 60, color: 'var(--color-status-warning)', bg: 'var(--color-status-warning-tint)' },
  { name: 'Platinum', min: 'à§³30L/yr',discount: 30, credit: 90, color: '#7C3AED', bg: '#F5F3FF' },
];

function B2BLanding() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Real data from API
  const [settings, setSettings] = useState(null);
  const [siteStats, setSiteStats] = useState(null);
  const [b2bClients, setB2bClients] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const safe = async (url) => {
      try {
        const r = await fetch(url);
        return r.ok ? r.json() : null;
      } catch { return null; }
    };

    Promise.all([
      safe(`${API}/settings`),
      safe(`${API}/stats`),
      // Fetch approved B2B reviews to use as "trusted by" client names
      safe(`${API}/reviews?isApproved=true&limit=12`),
    ]).then(([settingsData, statsData, reviewsData]) => {
      if (settingsData?.data) setSettings(settingsData.data);
      if (statsData?.data) setSiteStats(statsData.data);

      // Extract unique company names from B2B reviews
      const reviews = reviewsData?.data?.reviews || reviewsData?.reviews || [];
      const companies = [...new Set(
        reviews
          .map((r) => r.user?.companyName || r.companyName)
          .filter(Boolean)
      )].slice(0, 8);
      setB2bClients(companies);
    }).finally(() => setLoadingData(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.company || !form.email) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, name: form.name, type: 'b2b_inquiry', ...form }),
      });
      const data = await res.json();
      if (res.ok || data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || 'Submission failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Derive real values from settings, fall back to sensible defaults
  const maxDiscount = settings?.b2bMaxDiscount ?? 30;
  const creditDays  = settings?.b2bCreditDays  ?? 90;
  const deliveryThreshold = settings?.freeDeliveryThreshold
    ? `à§³${(settings.freeDeliveryThreshold / 1000).toFixed(0)}K`
    : 'à§³50K';
  const supportHours = settings?.supportHours ?? '24/7';
  const contactPhone = settings?.contactPhone ?? '+880 1800-Mediport';
  const contactEmail = settings?.contactEmail ?? 'b2b@MediportBD.com';
  const totalProducts = siteStats?.totalProducts
    ? `${(siteStats.totalProducts / 1000).toFixed(0)}K+`
    : '10,000+';
  const totalB2BClients = siteStats?.totalB2BClients
    ? `${siteStats.totalB2BClients}+`
    : '500+';

  const benefits = [
    { icon: 'ðŸ’°', title: `Up to ${maxDiscount}% Bulk Discounts`, desc: 'Tiered pricing based on order volume. The more you buy, the more you save.' },
    { icon: 'ðŸ¦', title: `Credit Terms up to ${creditDays} Days`, desc: `Net-30, Net-60, or Net-${creditDays} payment terms for approved accounts.` },
    { icon: 'ðŸ‘¤', title: 'Dedicated Account Manager', desc: `${supportHours} support from a dedicated B2B executive who knows your needs.` },
    { icon: 'ðŸšš', title: 'Free Priority Delivery', desc: `Free delivery on all B2B orders over ${deliveryThreshold} within Dhaka metro area.` },
    { icon: 'ðŸ”§', title: 'Free Installation & Training', desc: 'Professional installation and staff training for all diagnostic equipment.' },
    { icon: 'ðŸ“‹', title: 'Custom Quotations', desc: 'Get tailored quotes for large orders with special pricing.' },
  ];

  // Build tiers from settings â€” scale discounts proportionally from maxDiscount
  const tiers = DEFAULT_TIERS.map((t) => ({
    ...t,
    discount: t.name === 'Platinum' ? maxDiscount
      : t.name === 'Gold' ? Math.round(maxDiscount * 0.73)
      : t.name === 'Silver' ? Math.round(maxDiscount * 0.5)
      : Math.round(maxDiscount * 0.27),
    credit: t.name === 'Platinum' ? creditDays
      : t.name === 'Gold' ? Math.round(creditDays * 0.67)
      : t.name === 'Silver' ? Math.round(creditDays * 0.33)
      : 0,
  }));

  // Fallback client list if no reviews yet
  const clients = b2bClients.length > 0
    ? b2bClients
    : ['Hospital A', 'Diagnostic Center B', 'Clinic C', 'Medical College D', 'Healthcare Group E', 'Laboratory F'];

  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-teal/20 text-[#4ADE80] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 bg-[#4ADE80] rounded-full animate-pulse"/>
                B2B Portal â€” Bangladesh&apos;s #1 Medical Supplier
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold leading-tight mb-3">
                Medical Equipment<br/>
                <span className="text-brand-teal">for Healthcare Professionals</span>
              </h1>
              <p className="text-sm text-[var(--color-text-tertiary)] leading-relaxed mb-5">
                Join {totalB2BClients} hospitals, clinics, and diagnostic centers across Bangladesh. Get exclusive B2B pricing, credit terms, and a dedicated account manager.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => document.getElementById('b2b-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 bg-brand-teal hover:bg-[var(--color-brand-teal-hover)] text-white rounded-xl text-sm font-semibold transition-colors">
                  Apply for B2B Account
                </button>
                <button onClick={() => router.push('/products')}
                  className="px-6 py-3 border border-[#334155] hover:border-[var(--color-border-secondary)] text-[var(--color-text-tertiary)] rounded-xl text-sm font-semibold transition-colors">
                  Browse Catalog
                </button>
              </div>
              <div className="mt-5 flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
                <span>âœ“ DGDA Registered</span>
                <span>âœ“ ISO 13485 Certified</span>
                <span>âœ“ 10,000+ Products</span>
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { n: totalB2BClients, l: 'B2B Clients' },
                { n: totalProducts,   l: 'Products' },
                { n: `${maxDiscount}%`, l: 'Max Discount' },
                { n: supportHours,    l: 'Support' },
              ].map(({ n, l }) => (
                <div key={l} className="bg-[#0E1E35] rounded-2xl p-6 text-center border border-[#1E3A5F]">
                  <div className="text-2xl font-semibold text-brand-teal mb-1">{n}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trusted by */}
      <div className="bg-page border-y border-[var(--color-border-primary)] py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <p className="text-xs text-[var(--color-text-tertiary)] text-center uppercase tracking-widest mb-4">Trusted by leading healthcare institutions</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            {clients.map(c => (
              <span key={c} className="text-sm font-semibold text-[var(--color-text-primary)]">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="text-center mb-12">
          <h2 className="text-xl md:text-2xl font-semibold text-brand-navy mb-2">Why Choose Mediport B2B?</h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-xl mx-auto">Everything your healthcare facility needs, with the pricing and support you deserve.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map(({ icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl border border-[var(--color-border-primary)] hover:shadow-md hover:border-brand-teal/30 transition-all">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="text-base font-semibold text-brand-navy mb-2">{title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing tiers */}
      <div className="bg-page py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-semibold text-brand-navy mb-2">B2B Pricing Tiers</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">Unlock better pricing as your business grows with us.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {tiers.map(({ name, min, discount, credit, color, bg }) => (
              <div key={name} className="rounded-2xl p-5 border-2 text-center"
                style={{ background: bg, borderColor: color + '40' }}>
                <div className="text-sm font-semibold mb-1" style={{ color }}>{name}</div>
                <div className="text-xs text-[var(--color-text-tertiary)] mb-3">From {min}/yr</div>
                <div className="text-3xl font-semibold text-brand-navy mb-1">{discount}%</div>
                <div className="text-xs text-[var(--color-text-secondary)] mb-2">discount</div>
                <div className="text-xs font-medium" style={{ color }}>
                  {credit === 0 ? 'No credit' : `${credit} days credit`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Application form */}
      <div id="b2b-form" className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-brand-navy mb-3">Apply for a B2B Account</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
              Fill in the form and our B2B team will contact you within 24 hours to set up your account and discuss pricing.
            </p>
            <div className="space-y-4 text-sm text-[var(--color-text-primary)]">
              {['Application reviewed within 24 hours', 'Dedicated account manager assigned', 'Custom pricing based on your volume', 'Credit terms set up after approval'].map(s => (
                <div key={s} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-[var(--color-status-success-tint)] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-teal)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  {s}
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-brand-navy rounded-2xl text-white">
              <div className="text-sm font-semibold mb-1">Need immediate assistance?</div>
              <div className="text-xs text-[var(--color-text-tertiary)] mb-3">Our B2B team is available Monâ€“Sat, 9amâ€“6pm</div>
              <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="text-brand-teal font-semibold text-sm">{contactPhone}</a>
              <div className="mt-1">
                <a href={`mailto:${contactEmail}`} className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-tertiary)]">{contactEmail}</a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[var(--color-border-primary)] p-6 shadow-sm">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-[var(--color-status-success-tint)] rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-teal)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="text-lg font-semibold text-brand-navy mb-2">Application Submitted!</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Our B2B team will contact you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-base font-semibold text-brand-navy mb-4">B2B Inquiry Form</h3>
                {error && (
                  <div className="p-3 bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] rounded-lg text-xs">{error}</div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">Full Name <span className="text-[var(--color-status-danger)]">*</span></label>
                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Your Full Name"
                      className="w-full px-3 py-2.5 border border-[var(--color-border-primary)] rounded-xl text-base focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10"/>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">Company / Hospital <span className="text-[var(--color-status-danger)]">*</span></label>
                    <input type="text" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                      placeholder="Dhaka Medical Center"
                      className="w-full px-3 py-2.5 border border-[var(--color-border-primary)] rounded-xl text-base focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">Email Address <span className="text-[var(--color-status-danger)]">*</span></label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="ahmed@hospital.com"
                    className="w-full px-3 py-2.5 border border-[var(--color-border-primary)] rounded-xl text-base focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">Phone Number</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+880 1700-000000"
                    className="w-full px-3 py-2.5 border border-[var(--color-border-primary)] rounded-xl text-base focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">What are you looking for?</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={3} placeholder="e.g. ECG machines, lab reagents, surgical instruments..."
                    className="w-full px-3 py-2.5 border border-[var(--color-border-primary)] rounded-xl text-base focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10 resize-none"/>
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full h-12 bg-brand-navy hover:bg-[var(--color-brand-navy-hover)] disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
                  {submitting ? 'Submittingâ€¦' : 'Submit Application'}
                </button>
                <p className="text-xs text-[var(--color-text-tertiary)] text-center">
                  By submitting, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Authenticated B2B Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function B2BDashboard({ data, onRefresh }) {
  const router = useRouter();
  const orders = data.recentOrders || [];
  const quotes = data.recentQuotes || [];

  const handleDownloadInvoice = async (orderId) => {
    try {
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch {
      showToast.error('Invoice download failed. Please try again.');
    }
  };

  const creditPct = data.creditLimit > 0
    ? Math.min(100, Math.round((data.creditUsed / data.creditLimit) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-page">
      {/* Top bar */}
      <div className="bg-brand-navy text-white px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-0.5">B2B Portal</div>
            <h1 className="text-lg font-semibold">
              Welcome back, {data.name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs bg-brand-teal/20 text-[#4ADE80] px-3 py-1.5 rounded-full font-semibold">
              <span className="w-1.5 h-1.5 bg-[#4ADE80] rounded-full"/>
              {data.tier} Tier Â· {data.discount}% off
            </span>
            <button onClick={() => router.push('/products')}
              className="px-4 py-2 bg-brand-teal hover:bg-[var(--color-brand-teal-hover)] text-white rounded-xl text-xs font-semibold transition-colors">
              Shop Now
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 space-y-4">

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="ðŸ’°" label="Total Spend" value={`à§³${(data.totalSpend || 0).toLocaleString()}`} color="var(--color-brand-teal)"/>
          <StatCard icon="ðŸ“¦" label="Active Orders" value={data.activeOrders || 0} sub="in progress" color="var(--color-status-info)"/>
          <StatCard icon="ðŸšš" label="In Delivery" value={data.ordersInDelivery || 0} sub="on the way" color="var(--color-status-warning)"/>
          <StatCard icon="ðŸ·ï¸" label="Your Discount" value={`${data.discount || 0}%`} sub={`${data.tier} tier`} color="#8B5CF6"/>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

          {/* Left column */}
          <div className="space-y-4">

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-[var(--color-border-primary)] p-5">
              <h2 className="text-base font-semibold text-brand-navy mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: 'ðŸ›’', label: 'New Order', onClick: () => router.push('/products') },
                  { icon: 'ðŸ“‹', label: 'Request Quote', onClick: () => router.push('/products') },
                  { icon: 'ðŸ“¦', label: 'Track Orders', onClick: () => router.push('/orders') },
                  { icon: 'â†©', label: 'Returns', onClick: () => router.push('/returns/my-returns') },
                ].map(({ icon, label, onClick }) => (
                  <button key={label} onClick={onClick}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[var(--color-border-primary)] hover:border-brand-teal/40 hover:bg-[var(--color-status-success-tint)] transition-all">
                    <span className="text-3xl">{icon}</span>
                    <span className="text-xs font-semibold text-[var(--color-text-primary)]">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent orders */}
            <div className="bg-white rounded-2xl border border-[var(--color-border-primary)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-brand-navy">Recent Orders</h2>
                <button onClick={() => router.push('/orders')}
                  className="text-xs text-brand-teal font-semibold hover:underline">
                  View all â†’
                </button>
              </div>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-sm text-[var(--color-text-tertiary)]">
                  No orders yet. <button onClick={() => router.push('/products')} className="text-brand-teal font-semibold hover:underline">Start shopping</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 5).map((order) => {
                    const id = order._id || order.id;
                    const displayId = order.orderNumber || `ORD-${String(id).slice(-5).toUpperCase()}`;
                    const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : order.date || 'â€”';
                    const itemCount = order.items?.length || order.itemCount || 0;
                    const total = order.totalAmount || order.total || 0;
                    return (
                      <div key={id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border-primary)] hover:bg-surface-subtle transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[var(--color-status-info-tint)] rounded-lg flex items-center justify-center text-base">ðŸ“¦</div>
                          <div>
                            <div className="text-sm font-semibold text-brand-navy">{displayId}</div>
                            <div className="text-xs text-[var(--color-text-tertiary)]">{date} Â· {itemCount} item{itemCount !== 1 ? 's' : ''}</div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <div className="text-sm font-semibold text-brand-navy">à§³{total.toLocaleString()}</div>
                            <StatusBadge status={order.status}/>
                          </div>
                          <button onClick={() => handleDownloadInvoice(id)}
                            className="text-xs text-brand-teal hover:underline font-medium hidden md:block">
                            Invoice
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent quotations */}
            <div className="bg-white rounded-2xl border border-[var(--color-border-primary)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-brand-navy">Recent Quotations</h2>
                <button onClick={() => router.push('/products')}
                  className="text-xs text-brand-teal font-semibold hover:underline">
                  Request quote â†’
                </button>
              </div>
              {quotes.length === 0 ? (
                <div className="text-center py-8 text-sm text-[var(--color-text-tertiary)]">
                  No quotations yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {quotes.slice(0, 4).map((q) => {
                    const id = q._id || q.id;
                    const displayId = q.quoteNumber || `QUO-${String(id).slice(-5).toUpperCase()}`;
                    const date = q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short' }) : q.date || 'â€”';
                    const total = q.totalAmount || q.total || 0;
                    return (
                      <div key={id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border-primary)]">
                        <div>
                          <div className="text-sm font-semibold text-brand-navy">{displayId}</div>
                          <div className="text-xs text-[var(--color-text-tertiary)]">{date}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-brand-navy">à§³{total.toLocaleString()}</div>
                          <StatusBadge status={q.status}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">

            {/* Account manager */}
            <div className="bg-white rounded-2xl border border-[var(--color-border-primary)] p-5">
              <h2 className="text-sm font-semibold text-brand-navy mb-4">Your Account Manager</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand-teal flex items-center justify-center text-white text-lg font-semibold flex-shrink-0">
                  B
                </div>
                <div>
                  <div className="text-sm font-semibold text-brand-navy">B2B Support Team</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">Senior B2B Executive</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 bg-[#22C55E] rounded-full"/>
                    <span className="text-xs text-[#22C55E] font-medium">Available</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-xs mb-4">
                <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  +880 1800-Mediport
                </div>
                <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  b2b@MediportBD.com
                </div>
              </div>
              <a href="mailto:b2b@MediportBD.com"
                className="block w-full py-2.5 bg-brand-teal hover:bg-[var(--color-brand-teal-hover)] text-white rounded-xl text-xs font-semibold text-center transition-colors">
                Contact Manager
              </a>
            </div>

            {/* Credit status */}
            <div className="bg-white rounded-2xl border border-[var(--color-border-primary)] p-5">
              <h2 className="text-sm font-semibold text-brand-navy mb-4">Credit Status</h2>
              {data.creditLimit > 0 ? (
                <>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-[var(--color-text-secondary)]">Used</span>
                    <span className="font-semibold text-brand-navy">à§³{(data.creditUsed || 0).toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 bg-[var(--color-background-muted)] rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${creditPct}%`, background: creditPct > 80 ? 'var(--color-status-danger)' : 'var(--color-brand-teal)' }}/>
                  </div>
                  <div className="flex justify-between text-xs mb-4">
                    <span className="text-[var(--color-text-secondary)]">Available</span>
                    <span className="font-semibold text-brand-teal">à§³{((data.creditLimit || 0) - (data.creditUsed || 0)).toLocaleString()}</span>
                  </div>
                  <div className="pt-3 border-t border-[var(--color-border-primary)]">
                    <div className="text-xs text-[var(--color-text-tertiary)]">Credit Limit</div>
                    <div className="text-lg font-semibold text-brand-navy">à§³{(data.creditLimit || 0).toLocaleString()}</div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-sm text-[var(--color-text-tertiary)] mb-3">No credit line yet</div>
                  <a href="mailto:b2b@MediportBD.com"
                    className="text-xs text-brand-teal font-semibold hover:underline">
                    Request credit terms â†’
                  </a>
                </div>
              )}
            </div>

            {/* Loyalty points */}
            {data.loyaltyPoints > 0 && (
              <div className="bg-gradient-to-br from-brand-navy to-[#1E3A5F] rounded-2xl p-5 text-white">
                <div className="text-xs text-[var(--color-text-secondary)] mb-1">Loyalty Points</div>
                <div className="text-2xl font-semibold text-brand-teal">{data.loyaltyPoints.toLocaleString()}</div>
                <div className="text-xs text-[var(--color-text-tertiary)] mt-1">Redeem on your next order</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Main export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function B2BDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const authed = isAuthenticated();

  useEffect(() => {
    if (!authed || !user) return;

    const fetchB2BData = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const token = localStorage.getItem('Mediport_token');
        const headers = { Authorization: `Bearer ${token}` };

        const [ordersRes, quotesRes, profileRes] = await Promise.all([
          fetch(`${API}/orders?limit=10`, { headers }),
          fetch(`${API}/quotes?limit=5`, { headers }),
          fetch(`${API}/auth/me`, { headers }),
        ]);

        const [ordersData, quotesData, profileData] = await Promise.all([
          ordersRes.json(),
          quotesRes.json(),
          profileRes.json(),
        ]);

        const profile = profileData.data || profileData.user || {};
        const orders = ordersData.data?.orders || ordersData.orders || [];
        const quotes = quotesData.data?.quotes || quotesData.quotes || [];

        setDashboardData({
          name: profile.companyName || profile.name || user.name || 'Your Account',
          accountId: profile.accountId || `B2B-${String(profile._id || '').slice(-5).toUpperCase()}`,
          tier: profile.tier || 'Standard',
          discount: profile.discountPct || 8,
          totalSpend: ordersData.data?.totalSpend || 0,
          activeOrders: orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
          ordersInDelivery: orders.filter(o => ['shipped', 'out_for_delivery'].includes(o.status)).length,
          creditUsed: profile.creditUsed || 0,
          creditLimit: profile.creditLimit || 0,
          loyaltyPoints: profile.loyaltyPoints || 0,
          recentOrders: orders,
          recentQuotes: quotes,
        });
      } catch (err) {
        setFetchError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchB2BData();
  }, [authed, user]);

  // Not logged in â†’ show marketing landing page
  if (!authed) return <B2BLanding />;

  // Check if user is actually a B2B customer
  // B2B users have a tier property or accountType === 'b2b'
  const isB2BUser = user?.tier || user?.accountType === 'b2b' || user?.role === 'b2b';
  
  // Regular B2C customer trying to access B2B portal â†’ show landing page with message
  if (authed && !isB2BUser) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-brand-navy text-white px-4 md:px-8 py-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-lg font-semibold">B2B Portal</h1>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <div className="text-6xl mb-6">ðŸ¢</div>
          <h2 className="text-xl font-semibold text-brand-navy mb-3">
            B2B Portal Access Required
          </h2>
          <p className="text-base text-[var(--color-text-secondary)] leading-relaxed mb-6">
            This section is exclusively for B2B customers (hospitals, clinics, diagnostic centers). 
            If you&apos;re interested in bulk orders and special pricing, please apply for a B2B account.
          </p>
          <div className="bg-[var(--color-status-success-tint)] border border-brand-teal/20 rounded-2xl p-5 mb-6">
            <h3 className="text-base font-semibold text-brand-navy mb-3">B2B Benefits:</h3>
            <div className="grid md:grid-cols-2 gap-3 text-left text-sm text-[var(--color-text-primary)]">
              {['Up to 30% bulk discounts', 'Credit terms (30-90 days)', 'Dedicated account manager', 'Free installation & training'].map(benefit => (
                <div key={benefit} className="flex items-center gap-2">
                  <span className="text-brand-teal">âœ“</span>
                  {benefit}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button 
              onClick={() => document.getElementById('b2b-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3 bg-brand-teal hover:bg-[var(--color-brand-teal-hover)] text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Apply for B2B Account
            </button>
            <button 
              onClick={() => window.location.href = '/products'}
              className="px-6 py-3 border border-[var(--color-border-primary)] hover:border-brand-teal/40 text-[var(--color-text-primary)] rounded-xl text-sm font-semibold transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
        <B2BLanding />
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <Spinner size="xl" variant="medical" />
          <p className="text-sm text-[var(--color-text-secondary)] mt-4">Loading your dashboardâ€¦</p>
        </div>
      </div>
    );
  }

  // Error
  if (fetchError) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-3">âš ï¸</div>
          <h2 className="text-lg font-semibold text-brand-navy mb-2">Failed to load dashboard</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">{fetchError}</p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-brand-navy text-white rounded-xl text-sm font-semibold hover:bg-[var(--color-brand-navy-hover)] transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Logged in but data not yet loaded (first render)
  const data = dashboardData || {
    name: user?.name || 'Your Account',
    accountId: 'â€”', tier: 'Standard', discount: 8,
    totalSpend: 0, activeOrders: 0, ordersInDelivery: 0,
    creditUsed: 0, creditLimit: 0, loyaltyPoints: 0,
    recentOrders: [], recentQuotes: [],
  };

  return <B2BDashboard data={data} />;
}
