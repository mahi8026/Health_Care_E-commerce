'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AccountPageShell from '@/components/account/AccountPageShell';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import { API } from '@/constants/api';
import { FaFileInvoiceDollar, FaCheckCircle, FaTimesCircle, FaPrint } from 'react-icons/fa';

const STATUS_META = {
  pending:   { label: 'Pending',   cls: 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]' },
  sent:      { label: 'Sent',      cls: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]' },
  approved:  { label: 'Approved',  cls: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' },
  converted: { label: 'Converted', cls: 'bg-[#EDE9FE] text-[#5B21B6]' },
  expired:   { label: 'Expired',   cls: 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]' },
  rejected:  { label: 'Rejected',  cls: 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]' },
};

const fmtMoney = (n) => `৳${(Number(n) || 0).toLocaleString('en-BD')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function QuoteDetailPage({ quoteId }) {
  const router = useRouter();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const token = localStorage.getItem('Mediport_token');
    fetch(`${API}/quotes/${quoteId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to load quotation');
        }
        return r.json();
      })
      .then(data => setQuote(data.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [quoteId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const flash = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(''), 4000);
  };

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('Mediport_token');
      const r = await fetch(`${API}/quotes/${quoteId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Failed to accept quotation');
      flash(`Quotation ${quote.quoteNumber || ''} approved`);
      setQuote(data.data);
    } catch (e) {
      flash(e.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      flash('Please provide a reason', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('Mediport_token');
      const r = await fetch(`${API}/quotes/${quoteId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Failed to reject quotation');
      flash('Quotation rejected');
      setQuote(data.data);
      setRejectOpen(false);
      setRejectReason('');
    } catch (e) {
      flash(e.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <AccountPageShell title="Quotation" backHref="/account/quotes" backLabel="Back to My Quotations">
        <div className="py-16 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-brand-navy mb-2">Could not load quotation</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">{error || 'Quotation not found'}</p>
          <Link href="/account/quotes" className="text-sm text-brand-teal font-semibold hover:underline">
            ← Back to My Quotations
          </Link>
        </div>
      </AccountPageShell>
    );
  }

  const meta = STATUS_META[quote.status] || { label: quote.status, cls: 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]' };
  const canAccept = ['pending', 'sent'].includes(quote.status);
  const canReject = ['pending', 'sent', 'approved'].includes(quote.status);

  return (
    <AccountPageShell
      title={`Quotation ${quote.quoteNumber || quote.quoteId || ''}`}
      description={quote.createdAt ? `Requested on ${fmtDate(quote.createdAt)}` : undefined}
      backHref="/account/quotes"
      backLabel="Back to My Quotations"
    >
      {/* Toast */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          message.type === 'success'
            ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]'
            : 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Status banner */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-[var(--color-border-primary)] p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-status-info-tint)] flex items-center justify-center">
            <FaFileInvoiceDollar className="text-[var(--color-status-info)]" />
          </div>
          <div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${meta.cls}`}>{meta.label}</span>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">Valid until {fmtDate(quote.validUntil)}</div>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-background-tertiary)]"
        >
          <FaPrint /> Print
        </button>
      </div>

      {/* Quotation document (print area) */}
      <div className="bg-white rounded-xl border border-[var(--color-border-primary)] p-4 sm:p-6">
        {/* Company header */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[var(--color-border-tertiary)]">
          <div>
            <div className="text-lg font-semibold text-brand-navy font-[family-name:var(--font-lora)]">MediportBD</div>
            <div className="text-xs text-[var(--color-text-secondary)]">Medical Equipment & Supplies</div>
          </div>
          <div className="text-right text-xs text-[var(--color-text-secondary)]">
            <div className="font-semibold text-brand-navy">Quotation</div>
            <div>No: {quote.quoteNumber || quote.quoteId || quote._id?.slice(-8).toUpperCase()}</div>
            <div>Date: {fmtDate(quote.createdAt)}</div>
            <div>Payment terms: Net {quote.paymentTerms || 30} days</div>
          </div>
        </div>

        {/* Items */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-xs sm:text-sm" style={{ minWidth: '480px' }}>
            <thead>
              <tr className="border-b border-[var(--color-border-tertiary)] text-left">
                <th className="py-2 pr-2 font-semibold text-[var(--color-text-secondary)]">#</th>
                <th className="py-2 pr-2 font-semibold text-[var(--color-text-secondary)]">Item</th>
                <th className="py-2 pr-2 font-semibold text-[var(--color-text-secondary)] text-right">Qty</th>
                <th className="py-2 pr-2 font-semibold text-[var(--color-text-secondary)] text-right">Unit Price</th>
                <th className="py-2 font-semibold text-[var(--color-text-secondary)] text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(quote.items || []).map((item, idx) => (
                <tr key={idx} className="border-b border-[var(--color-border-tertiary)] last:border-0">
                  <td className="py-2 pr-2 text-[var(--color-text-tertiary)]">{idx + 1}</td>
                  <td className="py-2 pr-2">
                    <div className="font-medium text-[var(--color-text-primary)]">{item.name}</div>
                    <div className="text-[11px] text-[var(--color-text-tertiary)]">{item.sku || ''}{item.sizeName ? ` · ${item.sizeName}` : ''}</div>
                  </td>
                  <td className="py-2 pr-2 text-right">{item.qty}</td>
                  <td className="py-2 pr-2 text-right">{fmtMoney(item.unitPrice)}</td>
                  <td className="py-2 text-right font-medium">{fmtMoney(item.lineTotal ?? item.unitPrice * item.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mt-4">
          <div className="w-full sm:w-64 space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between text-[var(--color-text-secondary)]">
              <span>Subtotal</span><span>{fmtMoney(quote.subtotal)}</span>
            </div>
            {quote.discountAmount > 0 && (
              <div className="flex justify-between text-[var(--color-status-success)]">
                <span>Discount ({quote.discountPct}%)</span><span>−{fmtMoney(quote.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-brand-navy text-base pt-2 border-t border-[var(--color-border-tertiary)]">
              <span>Total</span><span>{fmtMoney(quote.finalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {(quote.notes || quote.rejectionReason) && (
          <div className="mt-4 bg-[var(--color-background-secondary)] rounded-lg p-3 text-xs text-[var(--color-text-secondary)]">
            {quote.notes && <div><span className="font-semibold text-brand-navy">Notes: </span>{quote.notes}</div>}
            {quote.rejectionReason && <div><span className="font-semibold text-brand-navy">Reason: </span>{quote.rejectionReason}</div>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        {canAccept && (
          <button
            onClick={handleAccept}
            disabled={actionLoading}
            className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-status-success-tint)] hover:bg-[var(--color-status-success)] hover:text-white text-[var(--color-status-success)] rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <FaCheckCircle />
            {actionLoading ? 'Processing…' : 'Accept Quotation'}
          </button>
        )}
        {canReject && (
          <button
            onClick={() => setRejectOpen(true)}
            disabled={actionLoading}
            className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-status-danger-tint)] hover:bg-[var(--color-status-danger)] hover:text-white text-[var(--color-status-danger)] rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <FaTimesCircle />
            Decline Quotation
          </button>
        )}
        {quote.status === 'converted' && (
          <div className="flex-1 min-h-[48px] flex items-center justify-center px-4 py-3 bg-[#EDE9FE] text-[#5B21B6] rounded-xl text-sm font-semibold">
            ✓ This quotation has been converted to an order
          </div>
        )}
      </div>

      {/* Reject modal */}
      <Modal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} title="Decline Quotation" size="sm">
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Please let us know why you are declining this quotation so we can improve our offer.
          </p>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={3}
            placeholder="e.g. Pricing is above budget, need better payment terms…"
            className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm bg-white focus:outline-none focus:border-brand-teal"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setRejectOpen(false)}
              className="flex-1 min-h-[44px] px-4 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm font-semibold text-[var(--color-text-secondary)]"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="flex-1 min-h-[44px] px-4 py-2 bg-[var(--color-status-danger)] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {actionLoading ? 'Submitting…' : 'Decline Quotation'}
            </button>
          </div>
        </div>
      </Modal>
    </AccountPageShell>
  );
}