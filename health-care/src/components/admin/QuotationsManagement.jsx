"use client";

import { useState, useEffect, useCallback } from 'react';
import { API } from '@/constants/api';

const STATUS_OPTIONS = ['all', 'pending', 'sent', 'approved', 'rejected', 'expired'];

export default function QuotationsManagement() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('medcore_token');
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

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const handleUpdateStatus = async (quoteId, newStatus) => {
    setActionLoading(prev => ({ ...prev, [`status-${quoteId}`]: true }));
    try {
      const token = localStorage.getItem('medcore_token');
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
    if (!confirm('Convert this quotation to an order?')) return;
    setActionLoading(prev => ({ ...prev, [`convert-${quoteId}`]: true }));
    try {
      const token = localStorage.getItem('medcore_token');
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

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-[#FEF3C7] text-[#92400E]',
      sent: 'bg-[#DBEAFE] text-[#1E40AF]',
      approved: 'bg-[#D1FAE5] text-[#065F46]',
      rejected: 'bg-[#FEE2E2] text-[#991B1B]',
      expired: 'bg-[#F3F4F6] text-[#6B7280]',
      converted: 'bg-[#E0E7FF] text-[#3730A3]',
    };
    return colors[status] || 'bg-[#F3F4F6] text-[#6B7280]';
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)]">
      {/* Toast */}
      {message.text && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          message.type === 'success' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="p-4 border-b-[0.5px] border-[var(--color-border-tertiary)] flex gap-3">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-[8px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] bg-white"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <div className="ml-auto self-center text-[12px] text-[var(--color-text-secondary)]">
          {quotes.length} quotations
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto" style={{WebkitOverflowScrolling: 'touch'}}>
        {loading ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-secondary)]">Loading quotations…</div>
        ) : quotes.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-secondary)]">No quotations found</div>
        ) : (
          <table className="w-full" style={{minWidth: '900px'}}>
            <thead>
              <tr className="border-b-[0.5px] border-[var(--color-border-tertiary)]">
                {['Quote ID', 'Customer', 'Items', 'Amount', 'Status', 'Created', 'Valid Until', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map(quote => (
                <tr key={quote._id} className="border-b-[0.5px] border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-tertiary)]">
                  <td className="px-4 py-3 text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                    {quote.quoteNumber || quote._id?.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-[12px]">
                    {quote.user?.companyName || quote.user?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-[12px]">{quote.items?.length || 0} items</td>
                  <td className="px-4 py-3 text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                    ৳{(quote.totalAmount || quote.total || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-[3px] rounded font-medium ${getStatusColor(quote.status)}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[var(--color-text-secondary)]">
                    {formatDate(quote.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[var(--color-text-secondary)]">
                    {formatDate(quote.validUntil)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {quote.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(quote._id, 'approved')}
                          disabled={actionLoading[`status-${quote._id}`]}
                          className="text-[11px] text-[#065F46] font-medium hover:underline disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      {quote.status === 'approved' && (
                        <button
                          onClick={() => handleConvert(quote._id)}
                          disabled={actionLoading[`convert-${quote._id}`]}
                          className="text-[11px] text-[#0B2545] font-medium hover:underline disabled:opacity-50"
                        >
                          {actionLoading[`convert-${quote._id}`] ? 'Converting…' : 'Convert →'}
                        </button>
                      )}
                      {['pending', 'sent'].includes(quote.status) && (
                        <button
                          onClick={() => handleUpdateStatus(quote._id, 'rejected')}
                          disabled={actionLoading[`status-${quote._id}`]}
                          className="text-[11px] text-[#991B1B] font-medium hover:underline disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
