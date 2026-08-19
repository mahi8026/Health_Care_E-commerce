"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { API } from '@/constants/api';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';

const STATUS_OPTIONS = ['all', 'pending', 'sent', 'approved', 'converted', 'expired', 'rejected'];

const STATUS_META = {
  pending:   { label: 'Pending',   color: 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]' },
  sent:      { label: 'Sent',      color: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]' },
  approved:  { label: 'Approved',  color: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' },
  converted: { label: 'Converted', color: 'bg-[#EDE9FE] text-[#5B21B6]' },
  expired:   { label: 'Expired',   color: 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]' },
  rejected:  { label: 'Rejected',  color: 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]' },
};

const fmtMoney = (n) => `৳${(Number(n) || 0).toLocaleString('en-BD')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

export default function QuotationsManagement() {
  const [quotes, setQuotes] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });
  const [selected, setSelected] = useState(null);

  const showMessage = useCallback((text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  }, []);

  const getToken = () => localStorage.getItem('Mediport_token');

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      const res = await fetch(`${API}/admin/quotes?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setQuotes(Array.isArray(data.data) ? data.data : []);
      setPagination(data.pagination || null);
    } catch {
      setQuotes([]);
      showMessage('Failed to load quotations', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch, showMessage]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1); }, [statusFilter, debouncedSearch]);

  const openQuote = async (id) => {
    setActionLoading(prev => ({ ...prev, [`view-${id}`]: true }));
    try {
      const res = await fetch(`${API}/admin/quotes/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Failed to load quote');
      const data = await res.json();
      setSelected(data.data);
    } catch {
      showMessage('Failed to load quote details', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`view-${id}`]: false }));
    }
  };

  const handleUpdateStatus = async (quoteId, newStatus, rejectionReason) => {
    setActionLoading(prev => ({ ...prev, [`status-${quoteId}`]: true }));
    try {
      const res = await fetch(`${API}/admin/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: newStatus, rejectionReason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Update failed');
      }
      showMessage(`Quotation marked as ${newStatus}`);
      fetchQuotes();
      setSelected(prev => prev && prev._id === quoteId ? { ...prev, status: newStatus, rejectionReason } : prev);
    } catch (e) {
      showMessage(e.message || 'Failed to update quotation', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`status-${quoteId}`]: false }));
    }
  };

  const handleConvert = async (quoteId) => {
    setActionLoading(prev => ({ ...prev, [`convert-${quoteId}`]: true }));
    try {
      const res = await fetch(`${API}/admin/quotes/${quoteId}/convert`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Conversion failed');
      }
      const data = await res.json();
      showMessage(`Quotation converted to order (${data.data?.order?.orderNumber || data.data?.order?._id || ''})`);
      fetchQuotes();
      setSelected(null);
    } catch (e) {
      showMessage(e.message || 'Failed to convert quotation', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`convert-${quoteId}`]: false }));
    }
  };

  const totals = useMemo(() => ({
    total: pagination?.total ?? quotes.length,
    pending: quotes.filter(q => q.status === 'pending').length,
    page,
  }), [pagination, quotes, page]);

  const canSend = (q) => q.status === 'pending';
  const canApprove = (q) => ['pending', 'sent'].includes(q.status);
  const canConvert = (q) => q.status === 'approved';
  const canReject = (q) => ['pending', 'sent'].includes(q.status);

  return (
    <div className="space-y-4">
      {/* Toast */}
      {message.text && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-toast ${
          message.type === 'success' ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' : 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)]">
        <div className="p-3 sm:p-4 flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-xs font-[family-name:var(--font-plus-jakarta)] bg-white min-h-[48px]"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s === 'all' ? 'All statuses' : STATUS_META[s]?.label || s}</option>
              ))}
            </select>
            <div className="relative flex-1 min-w-[200px]">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by quotation number…"
                className="w-full px-3 py-2 pl-8 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-xs font-[family-name:var(--font-plus-jakarta)] bg-white min-h-[48px]"
              />
              <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
              </svg>
            </div>
          </div>
          <div className="text-xs text-[var(--color-text-secondary)] self-center">
            {totals.total} quotation{totals.total !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Loading / Empty */}
        {loading ? (
          <div className="p-10 flex flex-col items-center gap-3 text-xs text-[var(--color-text-secondary)]">
            <Spinner size="md" variant="medical" />
            Loading quotations…
          </div>
        ) : quotes.length === 0 ? (
          <div className="p-10 text-center text-xs text-[var(--color-text-secondary)]">
            No quotations found
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full" style={{ minWidth: '1000px' }}>
                <thead>
                  <tr className="border-b-[0.5px] border-[var(--color-border-tertiary)]">
                    {['Quotation', 'Customer', 'Items', 'Amount', 'Status', 'Created', 'Valid Until', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quotes.map(quote => (
                    <tr key={quote._id} className="border-b-[0.5px] border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-tertiary)]">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openQuote(quote._id)}
                          className="text-xs font-semibold font-[family-name:var(--font-plus-jakarta)] text-brand-navy hover:text-brand-teal hover:underline"
                        >
                          {quote.quoteNumber || quote.quoteId}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-[var(--color-text-primary)]">{quote.user?.companyName || quote.user?.name || '—'}</div>
                        {quote.user?.email && <div className="text-[var(--color-text-tertiary)] text-[11px]">{quote.user.email}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{quote.items?.length || 0} items</td>
                      <td className="px-4 py-3 text-xs font-semibold font-[family-name:var(--font-plus-jakarta)] text-brand-navy">
                        {fmtMoney(quote.finalAmount)}
                        {quote.discountPct > 0 && (
                          <div className="text-[10px] font-normal text-[var(--color-status-success)]">−{quote.discountPct}% off</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-[3px] rounded font-medium ${STATUS_META[quote.status]?.color || ''}`}>
                          {STATUS_META[quote.status]?.label || quote.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{fmtDate(quote.createdAt)}</td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{fmtDate(quote.validUntil)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap items-center">
                          {canSend(quote) && (
                            <button
                              onClick={() => handleUpdateStatus(quote._id, 'sent')}
                              disabled={actionLoading[`status-${quote._id}`]}
                              className="text-xs text-brand-teal font-medium hover:underline disabled:opacity-50"
                            >
                              {actionLoading[`status-${quote._id}`] ? 'Sending…' : 'Send to Customer'}
                            </button>
                          )}
                          {canApprove(quote) && (
                            <button
                              onClick={() => handleUpdateStatus(quote._id, 'approved')}
                              disabled={actionLoading[`status-${quote._id}`]}
                              className="text-xs text-[var(--color-status-success)] font-medium hover:underline disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}
                          {canConvert(quote) && (
                            <button
                              onClick={() => handleConvert(quote._id)}
                              disabled={actionLoading[`convert-${quote._id}`]}
                              className="text-xs text-brand-navy font-medium hover:underline disabled:opacity-50"
                            >
                              {actionLoading[`convert-${quote._id}`] ? 'Converting…' : 'Convert →'}
                            </button>
                          )}
                          {canReject(quote) && (
                            <button
                              onClick={() => handleUpdateStatus(quote._id, 'rejected', 'Rejected by admin')}
                              disabled={actionLoading[`status-${quote._id}`]}
                              className="text-xs text-[var(--color-status-danger)] font-medium hover:underline disabled:opacity-50"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => openQuote(quote._id)}
                            className="text-xs text-brand-teal font-medium hover:underline"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 p-3">
              {quotes.map(quote => (
                <div key={quote._id} className="bg-[var(--color-background-secondary)] rounded-lg border border-[var(--color-border-tertiary)] p-4 space-y-3">
                  <button onClick={() => openQuote(quote._id)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-brand-navy font-[family-name:var(--font-plus-jakarta)]">
                          {quote.quoteNumber || quote.quoteId}
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          {quote.user?.companyName || quote.user?.name || '—'}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${STATUS_META[quote.status]?.color || ''}`}>
                        {STATUS_META[quote.status]?.label || quote.status}
                      </span>
                    </div>
                  </button>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-[var(--color-text-secondary)]">Amount:</span> <span className="font-semibold text-brand-navy">{fmtMoney(quote.finalAmount)}</span></div>
                    <div><span className="text-[var(--color-text-secondary)]">Items:</span> {quote.items?.length || 0}</div>
                    <div><span className="text-[var(--color-text-secondary)]">Created:</span> {fmtDate(quote.createdAt)}</div>
                    <div><span className="text-[var(--color-text-secondary)]">Valid:</span> {fmtDate(quote.validUntil)}</div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-[var(--color-border-tertiary)]">
                    {canSend(quote) && (
                      <button
                        onClick={() => handleUpdateStatus(quote._id, 'sent')}
                        disabled={actionLoading[`status-${quote._id}`]}
                        className="flex-1 min-h-[44px] px-3 py-2 bg-brand-teal text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                      >
                        {actionLoading[`status-${quote._id}`] ? 'Sending…' : 'Send to Customer'}
                      </button>
                    )}
                    {canApprove(quote) && (
                      <button
                        onClick={() => handleUpdateStatus(quote._id, 'approved')}
                        disabled={actionLoading[`status-${quote._id}`]}
                        className="flex-1 min-h-[44px] px-3 py-2 bg-[var(--color-status-success-tint)] text-[var(--color-status-success)] rounded-lg text-xs font-semibold disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {canConvert(quote) && (
                      <button
                        onClick={() => handleConvert(quote._id)}
                        disabled={actionLoading[`convert-${quote._id}`]}
                        className="flex-1 min-h-[44px] px-3 py-2 bg-brand-navy text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                      >
                        {actionLoading[`convert-${quote._id}`] ? 'Converting…' : 'Convert to Order'}
                      </button>
                    )}
                    {canReject(quote) && (
                      <button
                        onClick={() => handleUpdateStatus(quote._id, 'rejected', 'Rejected by admin')}
                        disabled={actionLoading[`status-${quote._id}`]}
                        className="flex-1 min-h-[44px] px-3 py-2 bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] rounded-lg text-xs font-semibold disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t-[0.5px] border-[var(--color-border-tertiary)] text-xs text-[var(--color-text-secondary)]">
            <span>
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg disabled:opacity-40 hover:bg-[var(--color-background-tertiary)]"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg disabled:opacity-40 hover:bg-[var(--color-background-tertiary)]"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Quotation Details" size="xl">
        {selected && (
          <div className="space-y-4 text-sm">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold font-[family-name:var(--font-plus-jakarta)] text-brand-navy">
                  {selected.quoteNumber || selected.quoteId}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Requested {fmtDateTime(selected.createdAt)}
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_META[selected.status]?.color || ''}`}>
                {STATUS_META[selected.status]?.label || selected.status}
              </span>
            </div>

            {/* Customer */}
            <div className="grid sm:grid-cols-2 gap-3 bg-[var(--color-background-secondary)] rounded-lg p-3">
              <div>
                <div className="text-xs font-semibold text-brand-navy mb-1">Customer</div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {selected.user?.companyName || selected.user?.name || '—'}
                </div>
                {selected.user?.email && (
                  <div className="text-xs text-[var(--color-text-secondary)]">{selected.user.email}</div>
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-brand-navy mb-1">Validity & Terms</div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  Valid until {fmtDate(selected.validUntil)} · Net {selected.paymentTerms || 30} days
                </div>
                {selected.accountManager && (
                  <div className="text-xs text-[var(--color-text-secondary)]">AM: {selected.accountManager}</div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="border-[0.5px] border-[var(--color-border-tertiary)] rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[var(--color-background-secondary)] border-b-[0.5px] border-[var(--color-border-tertiary)]">
                    {['Item', 'Qty', 'Unit Price', 'Line Total'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-[var(--color-text-secondary)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(selected.items || []).map((item, idx) => (
                    <tr key={idx} className="border-b-[0.5px] border-[var(--color-border-tertiary)] last:border-0">
                      <td className="px-3 py-2">
                        <div className="font-medium text-[var(--color-text-primary)]">{item.name}</div>
                        <div className="text-[11px] text-[var(--color-text-tertiary)]">{item.sku || '—'}{item.sizeName ? ` · ${item.sizeName}` : ''}</div>
                      </td>
                      <td className="px-3 py-2">{item.qty}</td>
                      <td className="px-3 py-2">{fmtMoney(item.unitPrice)}</td>
                      <td className="px-3 py-2 font-medium">{fmtMoney(item.lineTotal ?? item.unitPrice * item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full sm:w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-[var(--color-text-secondary)]">
                  <span>Subtotal</span><span>{fmtMoney(selected.subtotal)}</span>
                </div>
                {selected.discountAmount > 0 && (
                  <div className="flex justify-between text-[var(--color-status-success)]">
                    <span>Discount ({selected.discountPct}%)</span><span>−{fmtMoney(selected.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-brand-navy text-sm pt-1 border-t-[0.5px] border-[var(--color-border-tertiary)]">
                  <span>Total</span><span>{fmtMoney(selected.finalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {(selected.notes || selected.rejectionReason) && (
              <div className="bg-[var(--color-background-secondary)] rounded-lg p-3 text-xs text-[var(--color-text-secondary)]">
                {selected.notes && <div><span className="font-semibold text-brand-navy">Notes: </span>{selected.notes}</div>}
                {selected.rejectionReason && <div><span className="font-semibold text-brand-navy">Rejection reason: </span>{selected.rejectionReason}</div>}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t-[0.5px] border-[var(--color-border-tertiary)]">
              {canSend(selected) && (
                <button
                  onClick={() => handleUpdateStatus(selected._id, 'sent')}
                  disabled={actionLoading[`status-${selected._id}`]}
                  className="flex-1 min-h-[44px] px-4 py-2 bg-brand-teal hover:bg-[var(--color-brand-teal-hover)] text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {actionLoading[`status-${selected._id}`] ? 'Sending…' : 'Send to Customer'}
                </button>
              )}
              {canApprove(selected) && (
                <button
                  onClick={() => handleUpdateStatus(selected._id, 'approved')}
                  disabled={actionLoading[`status-${selected._id}`]}
                  className="flex-1 min-h-[44px] px-4 py-2 bg-[var(--color-status-success-tint)] hover:bg-[var(--color-status-success)] hover:text-white text-[var(--color-status-success)] rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Approve Quotation
                </button>
              )}
              {canConvert(selected) && (
                <button
                  onClick={() => handleConvert(selected._id)}
                  disabled={actionLoading[`convert-${selected._id}`]}
                  className="flex-1 min-h-[44px] px-4 py-2 bg-brand-navy hover:bg-[var(--color-brand-navy-hover)] text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {actionLoading[`convert-${selected._id}`] ? 'Converting…' : 'Convert to Order'}
                </button>
              )}
              {canReject(selected) && (
                <button
                  onClick={() => handleUpdateStatus(selected._id, 'rejected', 'Rejected by admin')}
                  disabled={actionLoading[`status-${selected._id}`]}
                  className="flex-1 min-h-[44px] px-4 py-2 bg-[var(--color-status-danger-tint)] hover:bg-[var(--color-status-danger)] hover:text-white text-[var(--color-status-danger)] rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Reject Quotation
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}