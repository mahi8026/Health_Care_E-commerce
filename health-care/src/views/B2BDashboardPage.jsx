"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { API } from '@/constants/api';

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color = '#0E8A6E' }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-[22px]"
        style={{ background: color + '18' }}>
        {icon}
      </div>
      <div>
        <div className="text-[12px] text-[#6B7280] mb-0.5">{label}</div>
        <div className="text-[20px] font-bold text-[#0B2545]">{value}</div>
        {sub && <div className="text-[11px] text-[#9CA3AF] mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    delivered:   { bg: '#D1FAE5', text: '#065F46', label: 'Delivered' },
    shipped:     { bg: '#DBEAFE', text: '#1E40AF', label: 'Shipped' },
    processing:  { bg: '#FEF3C7', text: '#92400E', label: 'Processing' },
    pending:     { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
    cancelled:   { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' },
    approved:    { bg: '#D1FAE5', text: '#065F46', label: 'Approved' },
    converted:   { bg: '#EDE9FE', text: '#5B21B6', label: 'Converted' },
    'in transit':{ bg: '#DBEAFE', text: '#1E40AF', label: 'In Transit' },
  };
  const s = map[status?.toLowerCase()] || { bg: '#F3F4F6', text: '#374151', label: status || '—' };
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

// ── Marketing landing page (unauthenticated) ──────────────────────────────────

function B2BLanding() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

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

  const benefits = [
    { icon: '💰', title: '8–30% Bulk Discounts', desc: 'Tiered pricing based on order volume. The more you buy, the more you save.' },
    { icon: '🏦', title: 'Credit Terms up to 90 Days', desc: 'Net-30, Net-60, or Net-90 payment terms for approved accounts.' },
    { icon: '👤', title: 'Dedicated Account Manager', desc: '24/7 support from a dedicated B2B executive who knows your needs.' },
    { icon: '🚚', title: 'Free Priority Delivery', desc: 'Free delivery on all B2B orders within Dhaka metro area.' },
    { icon: '🔧', title: 'Free Installation & Training', desc: 'Professional installation and staff training for all diagnostic equipment.' },
    { icon: '📋', title: 'Custom Quotations', desc: 'Get tailored quotes for large orders with special pricing.' },
  ];

  const tiers = [
    { name: 'Standard', min: '৳0', discount: '8%', credit: 'None', color: '#6B7280', bg: '#F9FAFB' },
    { name: 'Silver', min: '৳5L/yr', discount: '15%', credit: '30 days', color: '#6B7280', bg: '#F3F4F6' },
    { name: 'Gold', min: '৳15L/yr', discount: '22%', credit: '60 days', color: '#D97706', bg: '#FFFBEB' },
    { name: 'Platinum', min: '৳30L/yr', discount: '30%', credit: '90 days', color: '#7C3AED', bg: '#F5F3FF' },
  ];

  const clients = ['Dhaka Medical College', 'Square Hospital', 'Popular Diagnostic', 'Ibn Sina Hospital', 'Labaid Group', 'Delta Hospital'];

  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-[#0B2545] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#0E8A6E]/20 text-[#4ADE80] text-[12px] font-semibold px-3 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 bg-[#4ADE80] rounded-full animate-pulse"/>
                B2B Portal — Bangladesh&apos;s #1 Medical Supplier
              </div>
              <h1 className="text-[32px] md:text-[44px] font-bold leading-tight mb-5">
                Medical Equipment<br/>
                <span className="text-[#0E8A6E]">for Healthcare Professionals</span>
              </h1>
              <p className="text-[15px] text-[#94A3B8] leading-relaxed mb-8">
                Join 500+ hospitals, clinics, and diagnostic centers across Bangladesh. Get exclusive B2B pricing, credit terms, and a dedicated account manager.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => document.getElementById('b2b-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 bg-[#0E8A6E] hover:bg-[#0B7558] text-white rounded-xl text-[14px] font-bold transition-colors">
                  Apply for B2B Account
                </button>
                <button onClick={() => router.push('/products')}
                  className="px-6 py-3 border border-[#334155] hover:border-[#475569] text-[#CBD5E1] rounded-xl text-[14px] font-semibold transition-colors">
                  Browse Catalog
                </button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-[12px] text-[#64748B]">
                <span>✓ DGDA Registered</span>
                <span>✓ ISO 13485 Certified</span>
                <span>✓ 10,000+ Products</span>
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { n: '500+', l: 'B2B Clients' },
                { n: '10,000+', l: 'Products' },
                { n: '30%', l: 'Max Discount' },
                { n: '24/7', l: 'Support' },
              ].map(({ n, l }) => (
                <div key={l} className="bg-[#0E1E35] rounded-2xl p-6 text-center border border-[#1E3A5F]">
                  <div className="text-[28px] font-bold text-[#0E8A6E] mb-1">{n}</div>
                  <div className="text-[12px] text-[#64748B]">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trusted by */}
      <div className="bg-[#F8FAFC] border-y border-[#E5E7EB] py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <p className="text-[11px] text-[#9CA3AF] text-center uppercase tracking-widest mb-4">Trusted by leading healthcare institutions</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            {clients.map(c => (
              <span key={c} className="text-[13px] font-semibold text-[#374151]">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-[28px] md:text-[32px] font-bold text-[#0B2545] mb-3">Why Choose MedCore B2B?</h2>
          <p className="text-[14px] text-[#6B7280] max-w-xl mx-auto">Everything your healthcare facility needs, with the pricing and support you deserve.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map(({ icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl border border-[#E5E7EB] hover:shadow-md hover:border-[#0E8A6E]/30 transition-all">
              <div className="text-[32px] mb-4">{icon}</div>
              <h3 className="text-[15px] font-bold text-[#0B2545] mb-2">{title}</h3>
              <p className="text-[13px] text-[#6B7280] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing tiers */}
      <div className="bg-[#F8FAFC] py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-[28px] md:text-[32px] font-bold text-[#0B2545] mb-3">B2B Pricing Tiers</h2>
            <p className="text-[14px] text-[#6B7280]">Unlock better pricing as your business grows with us.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tiers.map(({ name, min, discount, credit, color, bg }) => (
              <div key={name} className="rounded-2xl p-5 border-2 text-center"
                style={{ background: bg, borderColor: color + '40' }}>
                <div className="text-[13px] font-bold mb-1" style={{ color }}>{name}</div>
                <div className="text-[11px] text-[#9CA3AF] mb-3">From {min}/yr</div>
                <div className="text-[28px] font-bold text-[#0B2545] mb-1">{discount}</div>
                <div className="text-[11px] text-[#6B7280] mb-2">discount</div>
                <div className="text-[11px] font-medium" style={{ color }}>
                  {credit === 'None' ? 'No credit' : `${credit} credit`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Application form */}
      <div id="b2b-form" className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-[28px] md:text-[32px] font-bold text-[#0B2545] mb-4">Apply for a B2B Account</h2>
            <p className="text-[14px] text-[#6B7280] mb-6 leading-relaxed">
              Fill in the form and our B2B team will contact you within 24 hours to set up your account and discuss pricing.
            </p>
            <div className="space-y-4 text-[13px] text-[#374151]">
              {['Application reviewed within 24 hours', 'Dedicated account manager assigned', 'Custom pricing based on your volume', 'Credit terms set up after approval'].map(s => (
                <div key={s} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-[#D1FAE5] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0E8A6E" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  {s}
                </div>
              ))}
            </div>
            <div className="mt-8 p-5 bg-[#0B2545] rounded-2xl text-white">
              <div className="text-[13px] font-bold mb-1">Need immediate assistance?</div>
              <div className="text-[12px] text-[#94A3B8] mb-3">Our B2B team is available Mon–Sat, 9am–6pm</div>
              <a href="tel:+8801800000000" className="text-[#0E8A6E] font-bold text-[14px]">+880 1800-MEDCORE</a>
              <div className="mt-1">
                <a href="mailto:b2b@medcorebd.com" className="text-[12px] text-[#64748B] hover:text-[#94A3B8]">b2b@medcorebd.com</a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#D1FAE5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0E8A6E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="text-[18px] font-bold text-[#0B2545] mb-2">Application Submitted!</h3>
                <p className="text-[13px] text-[#6B7280]">Our B2B team will contact you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-[16px] font-bold text-[#0B2545] mb-4">B2B Inquiry Form</h3>
                {error && (
                  <div className="p-3 bg-[#FEE2E2] text-[#991B1B] rounded-lg text-[12px]">{error}</div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#374151] mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Dr. Ahmed Rahman"
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-xl text-[13px] focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#374151] mb-1">Company / Hospital <span className="text-red-500">*</span></label>
                    <input type="text" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                      placeholder="Dhaka Medical Center"
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-xl text-[13px] focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10"/>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#374151] mb-1">Email Address <span className="text-red-500">*</span></label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="ahmed@hospital.com"
                    className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-xl text-[13px] focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10"/>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#374151] mb-1">Phone Number</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+880 1700-000000"
                    className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-xl text-[13px] focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10"/>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#374151] mb-1">What are you looking for?</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={3} placeholder="e.g. ECG machines, lab reagents, surgical instruments..."
                    className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-xl text-[13px] focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10 resize-none"/>
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full h-12 bg-[#0B2545] hover:bg-[#0d2e56] disabled:opacity-60 text-white rounded-xl text-[14px] font-bold transition-colors">
                  {submitting ? 'Submitting…' : 'Submit Application'}
                </button>
                <p className="text-[10px] text-[#9CA3AF] text-center">
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

// ── Authenticated B2B Dashboard ───────────────────────────────────────────────

function B2BDashboard({ data, onRefresh }) {
  const router = useRouter();
  const orders = data.recentOrders || [];
  const quotes = data.recentQuotes || [];

  const handleDownloadInvoice = async (orderId) => {
    try {
      const token = localStorage.getItem('medcore_token');
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
      alert('Invoice download failed. Please try again.');
    }
  };

  const creditPct = data.creditLimit > 0
    ? Math.min(100, Math.round((data.creditUsed / data.creditLimit) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top bar */}
      <div className="bg-[#0B2545] text-white px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#64748B] mb-0.5">B2B Portal</div>
            <h1 className="text-[18px] font-bold">
              Welcome back, {data.name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] bg-[#0E8A6E]/20 text-[#4ADE80] px-3 py-1.5 rounded-full font-semibold">
              <span className="w-1.5 h-1.5 bg-[#4ADE80] rounded-full"/>
              {data.tier} Tier · {data.discount}% off
            </span>
            <button onClick={() => router.push('/products')}
              className="px-4 py-2 bg-[#0E8A6E] hover:bg-[#0B7558] text-white rounded-xl text-[12px] font-bold transition-colors">
              Shop Now
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="💰" label="Total Spend" value={`৳${(data.totalSpend || 0).toLocaleString()}`} color="#0E8A6E"/>
          <StatCard icon="📦" label="Active Orders" value={data.activeOrders || 0} sub="in progress" color="#3B82F6"/>
          <StatCard icon="🚚" label="In Delivery" value={data.ordersInDelivery || 0} sub="on the way" color="#F59E0B"/>
          <StatCard icon="🏷️" label="Your Discount" value={`${data.discount || 0}%`} sub={`${data.tier} tier`} color="#8B5CF6"/>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* Left column */}
          <div className="space-y-6">

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
              <h2 className="text-[15px] font-bold text-[#0B2545] mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: '🛒', label: 'New Order', onClick: () => router.push('/products') },
                  { icon: '📋', label: 'Request Quote', onClick: () => router.push('/products') },
                  { icon: '📦', label: 'Track Orders', onClick: () => router.push('/orders') },
                  { icon: '↩', label: 'Returns', onClick: () => router.push('/returns/my-returns') },
                ].map(({ icon, label, onClick }) => (
                  <button key={label} onClick={onClick}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#E5E7EB] hover:border-[#0E8A6E]/40 hover:bg-[#F0FDF9] transition-all">
                    <span className="text-[28px]">{icon}</span>
                    <span className="text-[12px] font-semibold text-[#374151]">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent orders */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-bold text-[#0B2545]">Recent Orders</h2>
                <button onClick={() => router.push('/orders')}
                  className="text-[12px] text-[#0E8A6E] font-semibold hover:underline">
                  View all →
                </button>
              </div>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-[13px] text-[#9CA3AF]">
                  No orders yet. <button onClick={() => router.push('/products')} className="text-[#0E8A6E] font-semibold hover:underline">Start shopping</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 5).map((order) => {
                    const id = order._id || order.id;
                    const displayId = order.orderNumber || `ORD-${String(id).slice(-5).toUpperCase()}`;
                    const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : order.date || '—';
                    const itemCount = order.items?.length || order.itemCount || 0;
                    const total = order.totalAmount || order.total || 0;
                    return (
                      <div key={id} className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#EFF6FF] rounded-lg flex items-center justify-center text-[16px]">📦</div>
                          <div>
                            <div className="text-[13px] font-bold text-[#0B2545]">{displayId}</div>
                            <div className="text-[11px] text-[#9CA3AF]">{date} · {itemCount} item{itemCount !== 1 ? 's' : ''}</div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <div className="text-[13px] font-bold text-[#0B2545]">৳{total.toLocaleString()}</div>
                            <StatusBadge status={order.status}/>
                          </div>
                          <button onClick={() => handleDownloadInvoice(id)}
                            className="text-[11px] text-[#0E8A6E] hover:underline font-medium hidden md:block">
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
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-bold text-[#0B2545]">Recent Quotations</h2>
                <button onClick={() => router.push('/products')}
                  className="text-[12px] text-[#0E8A6E] font-semibold hover:underline">
                  Request quote →
                </button>
              </div>
              {quotes.length === 0 ? (
                <div className="text-center py-8 text-[13px] text-[#9CA3AF]">
                  No quotations yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {quotes.slice(0, 4).map((q) => {
                    const id = q._id || q.id;
                    const displayId = q.quoteNumber || `QUO-${String(id).slice(-5).toUpperCase()}`;
                    const date = q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short' }) : q.date || '—';
                    const total = q.totalAmount || q.total || 0;
                    return (
                      <div key={id} className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB]">
                        <div>
                          <div className="text-[13px] font-bold text-[#0B2545]">{displayId}</div>
                          <div className="text-[11px] text-[#9CA3AF]">{date}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[13px] font-bold text-[#0B2545]">৳{total.toLocaleString()}</div>
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
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
              <h2 className="text-[14px] font-bold text-[#0B2545] mb-4">Your Account Manager</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#0E8A6E] flex items-center justify-center text-white text-[18px] font-bold flex-shrink-0">
                  B
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#0B2545]">B2B Support Team</div>
                  <div className="text-[11px] text-[#6B7280]">Senior B2B Executive</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 bg-[#22C55E] rounded-full"/>
                    <span className="text-[10px] text-[#22C55E] font-medium">Available</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-[12px] mb-4">
                <div className="flex items-center gap-2 text-[#374151]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  +880 1800-MEDCORE
                </div>
                <div className="flex items-center gap-2 text-[#374151]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  b2b@medcorebd.com
                </div>
              </div>
              <a href="mailto:b2b@medcorebd.com"
                className="block w-full py-2.5 bg-[#0E8A6E] hover:bg-[#0B7558] text-white rounded-xl text-[12px] font-bold text-center transition-colors">
                Contact Manager
              </a>
            </div>

            {/* Credit status */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
              <h2 className="text-[14px] font-bold text-[#0B2545] mb-4">Credit Status</h2>
              {data.creditLimit > 0 ? (
                <>
                  <div className="flex justify-between text-[12px] mb-2">
                    <span className="text-[#6B7280]">Used</span>
                    <span className="font-bold text-[#0B2545]">৳{(data.creditUsed || 0).toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 bg-[#E5E7EB] rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${creditPct}%`, background: creditPct > 80 ? '#E24B4A' : '#0E8A6E' }}/>
                  </div>
                  <div className="flex justify-between text-[12px] mb-4">
                    <span className="text-[#6B7280]">Available</span>
                    <span className="font-bold text-[#0E8A6E]">৳{((data.creditLimit || 0) - (data.creditUsed || 0)).toLocaleString()}</span>
                  </div>
                  <div className="pt-3 border-t border-[#E5E7EB]">
                    <div className="text-[11px] text-[#9CA3AF]">Credit Limit</div>
                    <div className="text-[18px] font-bold text-[#0B2545]">৳{(data.creditLimit || 0).toLocaleString()}</div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-[13px] text-[#9CA3AF] mb-3">No credit line yet</div>
                  <a href="mailto:b2b@medcorebd.com"
                    className="text-[12px] text-[#0E8A6E] font-semibold hover:underline">
                    Request credit terms →
                  </a>
                </div>
              )}
            </div>

            {/* Loyalty points */}
            {data.loyaltyPoints > 0 && (
              <div className="bg-gradient-to-br from-[#0B2545] to-[#1E3A5F] rounded-2xl p-5 text-white">
                <div className="text-[12px] text-[#64748B] mb-1">Loyalty Points</div>
                <div className="text-[28px] font-bold text-[#0E8A6E]">{data.loyaltyPoints.toLocaleString()}</div>
                <div className="text-[11px] text-[#94A3B8] mt-1">Redeem on your next order</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

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
        const token = localStorage.getItem('medcore_token');
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

  // Not logged in → show marketing landing page
  if (!authed) return <B2BLanding />;

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#0E8A6E] border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
          <p className="text-[13px] text-[#6B7280]">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  // Error
  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-[48px] mb-4">⚠️</div>
          <h2 className="text-[18px] font-bold text-[#0B2545] mb-2">Failed to load dashboard</h2>
          <p className="text-[13px] text-[#6B7280] mb-4">{fetchError}</p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-[#0B2545] text-white rounded-xl text-[13px] font-semibold hover:bg-[#0d2e56] transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Logged in but data not yet loaded (first render)
  const data = dashboardData || {
    name: user?.name || 'Your Account',
    accountId: '—', tier: 'Standard', discount: 8,
    totalSpend: 0, activeOrders: 0, ordersInDelivery: 0,
    creditUsed: 0, creditLimit: 0, loyaltyPoints: 0,
    recentOrders: [], recentQuotes: [],
  };

  return <B2BDashboard data={data} />;
}
