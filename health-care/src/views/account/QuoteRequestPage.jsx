'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AccountPageShell from '@/components/account/AccountPageShell';
import Spinner from '@/components/ui/Spinner';
import { API } from '@/constants/api';
import { FaPlus, FaTrashAlt, FaFileInvoiceDollar, FaSearch, FaArrowLeft } from 'react-icons/fa';

const fmtMoney = (n) => `৳${(Number(n) || 0).toLocaleString('en-BD')}`;

export default function QuoteRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [lines, setLines] = useState([]);
  const [paymentTerms, setPaymentTerms] = useState(30);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  const prefillProduct = searchParams.get('product');
  const prefillQty = parseInt(searchParams.get('qty') || '1', 10);

  // Load product catalog for search
  useEffect(() => {
    fetch(`${API}/products?limit=50&page=1`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const list = (data?.data || data?.products || []);
        const items = Array.isArray(list) ? list : [];
        setProducts(items);

        // Prefill line from product detail link (?product=ID&qty=N)
        if (prefillProduct) {
          const match = items.find(p => String(p._id) === prefillProduct);
          if (match) {
            setLines(prev => {
              if (prev.some(l => l.product === String(match._id))) return prev;
              return [...prev, {
                product: String(match._id),
                name: match.name,
                sku: match.sku || '',
                brand: typeof match.brand === 'object' ? match.brand?.name : match.brand || '',
                qty: Math.max(1, prefillQty),
                estPrice: Number(match.price) || 0,
              }];
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, [prefillProduct, prefillQty]);

  const searchCatalog = useCallback((term) => {
    if (!term.trim()) { setSearchResults([]); return; }
    const q = term.toLowerCase();
    const results = products
      .filter(p => (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q))
      .slice(0, 10);
    setSearchResults(results);
  }, [products]);

  useEffect(() => {
    const t = setTimeout(() => searchCatalog(search), 250);
    return () => clearTimeout(t);
  }, [search, searchCatalog]);

  const addLine = (product) => {
    setLines(prev => {
      const existing = prev.find(l => l.product === String(product._id));
      if (existing) {
        return prev.map(l => l.product === existing.product ? { ...l, qty: l.qty + 1 } : l);
      }
      return [...prev, {
        product: String(product._id),
        name: product.name,
        sku: product.sku || '',
        brand: typeof product.brand === 'object' ? product.brand?.name : product.brand || '',
        qty: 1,
        estPrice: Number(product.price) || 0,
      }];
    });
    setSearch('');
    setSearchResults([]);
  };

  const updateLine = (idx, patch) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
  };

  const removeLine = (idx) => {
    setLines(prev => prev.filter((_, i) => i !== idx));
  };

  const totals = useMemo(() => {
    const estimatedSubtotal = lines.reduce((sum, l) => sum + (l.estPrice * l.qty), 0);
    return { estimatedSubtotal };
  }, [lines]);

  const flash = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(''), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lines.length) {
      flash('Add at least one product to your quotation request', 'error');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const token = localStorage.getItem('Mediport_token');
      const r = await fetch(`${API}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: lines.map(l => ({ product: l.product, qty: l.qty })),
          paymentTerms,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Failed to submit quotation request');
      flash(`Quotation ${data.data?.quoteNumber || ''} submitted! Our team will contact you within 24 hours.`);
      router.push('/account/quotes');
    } catch (err) {
      flash(err.message, 'error');
      setSubmitting(false);
    }
  };

  return (
    <AccountPageShell
      title="Request a Quotation"
      description="Build your bulk order — our team will prepare a customized quotation within 24 hours."
      backHref="/account/quotes"
      backLabel="Back to My Quotations"
    >
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          message.type === 'success'
            ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]'
            : 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Product search */}
        <div className="bg-white rounded-xl border border-[var(--color-border-primary)] p-4 sm:p-5 mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-navy mb-3">
            <FaSearch className="text-brand-teal" />
            Add Products
          </div>
          <div className="relative">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by product name or SKU…"
              className="w-full px-4 py-3 pl-10 border-[0.5px] border-[var(--color-border-secondary)] rounded-xl text-sm bg-white focus:outline-none focus:border-brand-teal"
            />
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          </div>

          {searchResults.length > 0 && (
            <div className="mt-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              {searchResults.map(p => (
                <button
                  type="button"
                  key={p._id}
                  onClick={() => addLine(p)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--color-background-tertiary)] border-b-[0.5px] border-[var(--color-border-tertiary)] last:border-0 text-left"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">{p.name}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">{p.sku || ''}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-semibold text-brand-navy">{fmtMoney(p.price)}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-brand-teal font-semibold">
                      <FaPlus /> Add
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {search && !loadingProducts && searchResults.length === 0 && (
            <div className="mt-2 text-xs text-[var(--color-text-tertiary)]">No products match “{search}”</div>
          )}
        </div>

        {/* Selected items */}
        <div className="bg-white rounded-xl border border-[var(--color-border-primary)] p-4 sm:p-5 mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-navy mb-3">
            <FaFileInvoiceDollar className="text-brand-teal" />
            Items Requested ({lines.length})
          </div>

          {lines.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
              No items yet. Search and add products above.
            </div>
          ) : (
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 bg-[var(--color-background-secondary)] rounded-lg">
                  <div className="flex-1 min-w-[160px]">
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">{line.name}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">{line.sku || ''}{line.brand ? ` · ${line.brand}` : ''}</div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">Est. {fmtMoney(line.estPrice)} / unit</div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                    Qty
                    <input
                      type="number"
                      min="1"
                      value={line.qty}
                      onChange={e => updateLine(idx, { qty: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-20 px-2 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-teal"
                    />
                  </label>
                  <div className="text-sm font-semibold text-brand-navy w-24 text-right">
                    {fmtMoney(line.estPrice * line.qty)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    aria-label={`Remove ${line.name}`}
                    className="p-2 text-[var(--color-status-danger)] hover:bg-[var(--color-status-danger-tint)] rounded-lg"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="bg-white rounded-xl border border-[var(--color-border-primary)] p-4 sm:p-5 mb-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-2">Payment Terms</label>
            <div className="flex gap-2 flex-wrap">
              {[30, 60, 90].map(t => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setPaymentTerms(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    paymentTerms === t
                      ? 'bg-brand-navy text-white border-brand-navy'
                      : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border-primary)] hover:border-brand-teal/40'
                  }`}
                >
                  Net {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-2">Notes for our team</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Delivery location, preferred brands, installation needs, or any special requirements…"
              className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-teal"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border border-[var(--color-border-primary)] p-4 sm:p-5 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Estimated subtotal</span>
            <span className="font-semibold text-brand-navy">{fmtMoney(totals.estimatedSubtotal)}</span>
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
            Final pricing, discounts and payment terms will be confirmed in your quotation. Prices shown are estimates based on current list price.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/account/quotes"
            className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-3 border border-[var(--color-border-primary)] rounded-xl text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-background-tertiary)]"
          >
            <FaArrowLeft /> Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !lines.length}
            className="flex-1 min-h-[48px] px-4 py-3 bg-brand-navy hover:bg-[var(--color-brand-navy-hover)] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Quotation Request'}
          </button>
        </div>
      </form>
    </AccountPageShell>
  );
}