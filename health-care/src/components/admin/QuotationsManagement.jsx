"use client";

import { confirmAction } from '@/components/ui/ConfirmDialog';
import { useState, useEffect, useCallback } from 'react';
import { API } from '@/constants/api';

const STATUS_OPTIONS = ['all', 'pending', 'sent', 'approved', 'rejected', 'expired'];

export default function QuotationsManagement() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('Mediport_token');
      const params = new URLSearchParams({ limit: 20 });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`${API}/admin/quotes?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setQuotes(data.data?.quotes || data.quotes || []);
    } catch {
      showMessage('Failed to load quotations', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { 
    (async () => {
      await fetchQuotes();
    })();
  }, [fetchQuotes]);

  const handleUpdateStatus = async (quoteId, newStatus) => {
    setActionLoading(prev => ({ ...prev, [`status-${quoteId}`]: true }));
    try {
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/admin/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Update failed');
      showMessage(`Quote ${newStatus}`, 'success');
      fetchQuotes();
    } catch {
      showMessage('Failed to update quotation', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`status-${quoteId}`]: false }));
    }
  };

  const handleConvert = async (quoteId) => {
    if (!await confirmAction('Convert this quotation to an order?')) return;
    setActionLoading(prev => ({ ...prev, [`convert-${quoteId}`]: true }));
    try {
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/admin/quotes/${quoteId}/convert`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Conversion failed');
      showMessage('Quotation converted to order', 'success');
      fetchQuotes();
    } catch {
      showMessage('Failed to convert quotation', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`convert-${quoteId}`]: false }));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]',
      sent: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
      approved: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]',
      rejected: 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]',
      expired: 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]',
      converted: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
    };
    return colors[status] || 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]';
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)]">
      {/* Toast */}
      {message.text && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-toast ${
          message.type === 'success' ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' : 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="p-3 sm:p-4 border-b-[0.5px] border-[var(--color-border-tertiary)] flex flex-col sm:flex-row gap-2 sm:gap-3">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-xs font-[family-name:var(--font-plus-jakarta)] bg-white min-h-[48px]"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <div className="sm:ml-auto self-center text-xs sm:text-xs text-[var(--color-text-secondary)] text-center sm:text-left">
          {quotes.length} quotations
        </div>
      </div>

      {/* Loading / Empty */}
      {loading ? (
        <div className="p-8 text-center text-xs text-[var(--color-text-secondary)]">Loading quotations…</div>
      ) : quotes.length === 0 ? (
        <div className="p-8 text-center text-xs text-[var(--color-text-secondary)]">No quotations found</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto" style={{WebkitOverflowScrolling: 'touch'}}>
            <table className="w-full" style={{minWidth: '900px'}}>
              <thead>
                <tr className="border-b-[0.5px] border-[var(--color-border-tertiary)]">
                  {['Quote ID', 'Customer', 'Items', 'Amount', 'Status', 'Created', 'Valid Until', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quotes.map(quote => (
                  <tr key={quote._id} className="border-b-[0.5px] border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-tertiary)]">
                    <td className="px-4 py-3 text-xs font-semibold font-[family-name:var(--font-plus-jakarta)]">
                      {quote.quoteNumber || quote._id?.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-xs">{quote.user?.companyName || quote.user?.name || '—'}</td>
                    <td className="px-4 py-3 text-xs">{quote.items?.length || 0} items</td>
                    <td className="px-4 py-3 text-xs font-semibold font-[family-name:var(--font-plus-jakarta)]">
                      ৳{(quote.totalAmount || quote.total || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-[3px] rounded font-medium ${getStatusColor(quote.status)}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{formatDate(quote.createdAt)}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{formatDate(quote.validUntil)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        {quote.status === 'pending' && (
                          <button onClick={() => handleUpdateStatus(quote._id, 'approved')} disabled={actionLoading[`status-${quote._id}`]} className="text-xs text-[var(--color-status-success)] font-medium hover:underline disabled:opacity-50">Approve</button>
                        )}
                        {quote.status === 'approved' && (
                          <button onClick={() => handleConvert(quote._id)} disabled={actionLoading[`convert-${quote._id}`]} className="text-xs text-brand-navy font-medium hover:underline disabled:opacity-50">{actionLoading[`convert-${quote._id}`] ? 'Converting…' : 'Convert →'}</button>
                        )}
                        {['pending', 'sent'].includes(quote.status) && (
                          <button onClick={() => handleUpdateStatus(quote._id, 'rejected')} disabled={actionLoading[`status-${quote._id}`]} className="text-xs text-[var(--color-status-danger)] font-medium hover:underline disabled:opacity-50">Reject</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 p-3">
            {quotes.map(quote => (
              <div key={quote._id} className="bg-[var(--color-background-secondary)] rounded-lg border border-[var(--color-border-tertiary)] p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-brand-navy font-[family-name:var(--font-plus-jakarta)]">
                      {quote.quoteNumber || quote._id?.slice(-8).toUpperCase()}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {quote.user?.companyName || quote.user?.name || '—'}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${getStatusColor(quote.status)}`}>
                    {quote.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-[var(--color-text-secondary)]">Amount:</span> <span className="font-semibold">৳{(quote.totalAmount || 0).toLocaleString()}</span></div>
                  <div><span className="text-[var(--color-text-secondary)]">Items:</span> {quote.items?.length || 0}</div>
                  <div><span className="text-[var(--color-text-secondary)]">Created:</span> {formatDate(quote.createdAt)}</div>
                  <div><span className="text-[var(--color-text-secondary)]">Valid:</span> {formatDate(quote.validUntil)}</div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-[var(--color-border-tertiary)]">
                  {quote.status === 'pending' && (
                    <button onClick={() => handleUpdateStatus(quote._id, 'approved')} disabled={actionLoading[`status-${quote._id}`]} className="flex-1 min-h-[48px] px-3 py-2 bg-[var(--color-status-success-tint)] text-[var(--color-status-success)] rounded-lg text-xs font-semibold disabled:opacity-50">Approve</button>
                  )}
                  {quote.status === 'approved' && (
                    <button onClick={() => handleConvert(quote._id)} disabled={actionLoading[`convert-${quote._id}`]} className="flex-1 min-h-[48px] px-3 py-2 bg-brand-navy text-white rounded-lg text-xs font-semibold disabled:opacity-50">{actionLoading[`convert-${quote._id}`] ? 'Converting…' : 'Convert to Order'}</button>
                  )}
                  {['pending', 'sent'].includes(quote.status) && (
                    <button onClick={() => handleUpdateStatus(quote._id, 'rejected')} disabled={actionLoading[`status-${quote._id}`]} className="flex-1 min-h-[48px] px-3 py-2 bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] rounded-lg text-xs font-semibold disabled:opacity-50">Reject</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
