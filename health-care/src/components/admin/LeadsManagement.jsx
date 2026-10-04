"use client";

/**
 * Phase 4.2 — CRM lead pipeline (admin).
 *
 * Operationally simple first version: scan, filter, open a lead, move it
 * through the deterministic pipeline, assign an owner, add internal notes and
 * link the RFQ/quotation that belongs to it. Quotations stay owned by the
 * quotation system — this screen only shows the reference.
 *
 * Conventions mirror QuotationsManagement.jsx (API constant, Bearer token from
 * localStorage, Modal + Spinner from the shared UI kit, design tokens).
 */

import { useState, useEffect, useCallback } from 'react';
import { API } from '@/constants/api';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';

const STATUS_META = {
  new:       { label: 'New',       color: 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]' },
  verified:  { label: 'Verified',  color: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]' },
  contacted: { label: 'Contacted', color: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]' },
  qualified: { label: 'Qualified', color: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' },
  rfq:       { label: 'RFQ',       color: 'bg-role-admin-tint text-role-admin-strong' },
  quoted:    { label: 'Quoted',    color: 'bg-role-admin-tint text-role-admin-strong' },
  won:       { label: 'Won',       color: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' },
  lost:      { label: 'Lost',      color: 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]' },
  dormant:   { label: 'Nurture',   color: 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]' },
};

// Mirrors models/Lead.js TRANSITIONS — the server remains the authority and
// rejects anything illegal with 400 + the allowed list.
const TRANSITIONS = {
  new: ['verified', 'contacted', 'lost'],
  verified: ['contacted', 'qualified', 'lost'],
  contacted: ['qualified', 'rfq', 'lost'],
  qualified: ['rfq', 'quoted', 'lost'],
  rfq: ['quoted', 'lost'],
  quoted: ['won', 'lost'],
  won: [],
  lost: ['dormant'],
  dormant: ['contacted', 'lost'],
};

const ORG_TYPES = ['hospital', 'clinic', 'diagnostic_centre', 'laboratory', 'pharmacy', 'institution', 'healthcare_professional', 'other'];
const LEAD_SOURCES = ['organic', 'google_ads', 'meta', 'whatsapp_direct', 'outbound', 'referral', 'event', 'existing_customer'];
const ALL_STATUSES = Object.keys(STATUS_META);

const pretty = (v) => (v ? String(v).replace(/_/g, ' ') : '—');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-BD', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');

export default function LeadsManagement() {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', organization_type: 'all', source: 'all', district: '', assigned_to: '' });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [assignDraft, setAssignDraft] = useState('');
  const [quoteDraft, setQuoteDraft] = useState('');

  const getToken = () => localStorage.getItem('Mediport_token');
  const showMessage = useCallback((text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  }, []);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams({ page, limit: 20 });
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.organization_type !== 'all') params.set('organization_type', filters.organization_type);
    if (filters.source !== 'all') params.set('source', filters.source);
    if (filters.district.trim()) params.set('district', filters.district.trim());
    if (filters.assigned_to.trim()) params.set('assigned_to', filters.assigned_to.trim());
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    return params;
  }, [page, filters, debouncedSearch]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/crm?${buildQuery()}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setLeads(Array.isArray(data.data) ? data.data : []);
      setPagination(data.pagination || null);
    } catch {
      setLeads([]);
      showMessage('Failed to load leads', 'error');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, showMessage]);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch(`${API}/crm/metrics`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) return;
      const data = await res.json();
      setMetrics(data.data || null);
    } catch { /* metrics are advisory — never block the list */ }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1); }, [filters, debouncedSearch]);

  const adminFetch = async (path, options = {}) => {
    const res = await fetch(`${API}/crm${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = Array.isArray(data.errors)
        ? data.errors.map((e) => e.message).join(', ')
        : (data.errors && data.errors.allowed ? `Allowed: ${data.errors.allowed.join(', ')}` : '');
      throw new Error([data.message || 'Request failed', detail].filter(Boolean).join(' — '));
    }
    return data;
  };

  const openLead = async (id) => {
    try {
      const data = await adminFetch(`/${id}`);
      setSelected(data.data);
      setAssignDraft(data.data.assigned_to || '');
      setNoteDraft('');
      setQuoteDraft('');
    } catch (e) {
      showMessage(e.message, 'error');
    }
  };

  const refreshSelected = async (id) => {
    const data = await adminFetch(`/${id}`);
    setSelected(data.data);
  };

  const handleStatus = async (next) => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await adminFetch(`/${selected._id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
      await refreshSelected(selected._id);
      await Promise.all([fetchLeads(), fetchMetrics()]);
      showMessage(`Status updated to ${STATUS_META[next]?.label || next}`);
    } catch (e) {
      showMessage(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await adminFetch(`/${selected._id}/assign`, { method: 'POST', body: JSON.stringify({ assigned_to: assignDraft }) });
      await refreshSelected(selected._id);
      await fetchLeads();
      showMessage(assignDraft ? 'Owner assigned' : 'Owner cleared');
    } catch (e) {
      showMessage(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!selected || !noteDraft.trim() || saving) return;
    setSaving(true);
    try {
      await adminFetch(`/${selected._id}/notes`, { method: 'POST', body: JSON.stringify({ text: noteDraft }) });
      setNoteDraft('');
      await refreshSelected(selected._id);
      showMessage('Note added');
    } catch (e) {
      showMessage(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkQuote = async () => {
    if (!selected || !quoteDraft.trim() || saving) return;
    setSaving(true);
    try {
      const data = await adminFetch(`/${selected._id}/quote`, { method: 'POST', body: JSON.stringify({ quote_number: quoteDraft.trim() }) });
      setSelected(data.data);
      setQuoteDraft('');
      await Promise.all([fetchLeads(), fetchMetrics()]);
      showMessage(data.message || 'Quotation linked');
    } catch (e) {
      showMessage(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const allowedNext = selected ? (TRANSITIONS[selected.status] || []) : [];
  const metricEntries = metrics
    ? ALL_STATUSES.map((s) => ({ status: s, count: metrics.by_status?.[s] || 0 }))
    : [];

  return (
    <div>
      {message.text && (
        <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm font-medium ${
          message.type === 'error'
            ? 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
            : 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Pipeline snapshot — counts come from stored leads only */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-[var(--color-border-primary)] p-3">
          <div className="text-xs text-[var(--color-text-secondary)]">Total leads</div>
          <div className="text-xl font-semibold text-brand-navy">{metrics ? metrics.total : '—'}</div>
        </div>
        {metricEntries.map(({ status, count }) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilters((f) => ({ ...f, status: f.status === status ? 'all' : status }))}
            className={`text-left bg-white rounded-xl border p-3 transition-colors ${
              filters.status === status ? 'border-brand-teal' : 'border-[var(--color-border-primary)] hover:border-brand-teal/40'
            }`}
          >
            <div className="text-xs text-[var(--color-text-secondary)]">{STATUS_META[status].label}</div>
            <div className="text-xl font-semibold text-brand-navy">{count}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[var(--color-border-primary)] p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Organization, contact, phone, lead ID or quote #"
            className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Status</label>
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm bg-white">
            <option value="all">All</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Org type</label>
          <select value={filters.organization_type} onChange={(e) => setFilters((f) => ({ ...f, organization_type: e.target.value }))}
            className="px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm bg-white">
            <option value="all">All</option>
            {ORG_TYPES.map((o) => <option key={o} value={o}>{pretty(o)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Source</label>
          <select value={filters.source} onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value }))}
            className="px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm bg-white">
            <option value="all">All</option>
            {LEAD_SOURCES.map((s) => <option key={s} value={s}>{pretty(s)}</option>)}
          </select>
        </div>
        <div className="w-[150px]">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">District</label>
          <input value={filters.district} onChange={(e) => setFilters((f) => ({ ...f, district: e.target.value }))}
            className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm" />
        </div>
        <div className="w-[150px]">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Owner</label>
          <input value={filters.assigned_to} onChange={(e) => setFilters((f) => ({ ...f, assigned_to: e.target.value }))}
            className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[var(--color-border-primary)] overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center"><Spinner /></div>
        ) : leads.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--color-text-secondary)]">
            No leads match these filters. Leads are only created from real business enquiries.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-background-secondary)] text-xs text-[var(--color-text-secondary)]">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Lead</th>
                  <th className="text-left px-4 py-2.5 font-medium">Organization</th>
                  <th className="text-left px-4 py-2.5 font-medium">District</th>
                  <th className="text-left px-4 py-2.5 font-medium">Source</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  <th className="text-left px-4 py-2.5 font-medium">Owner</th>
                  <th className="text-left px-4 py-2.5 font-medium">Quote</th>
                  <th className="text-left px-4 py-2.5 font-medium">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead._id}
                    onClick={() => openLead(lead._id)}
                    className="border-t border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-secondary)] cursor-pointer"
                  >
                    <td className="px-4 py-2.5 font-medium text-brand-navy whitespace-nowrap">{lead.lead_id || '—'}</td>
                    <td className="px-4 py-2.5">
                      <div className="text-[var(--color-text-primary)]">{lead.organization}</div>
                      <div className="text-xs text-[var(--color-text-tertiary)]">{pretty(lead.organization_type)}</div>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-text-secondary)]">{lead.district || '—'}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-secondary)]">{pretty(lead.source)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_META[lead.status]?.color || ''}`}>
                        {STATUS_META[lead.status]?.label || lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-text-secondary)]">{lead.assigned_to || '—'}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-secondary)] whitespace-nowrap">
                      {lead.related_quotes && lead.related_quotes.length ? lead.related_quotes[0].quote_number : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-text-tertiary)] whitespace-nowrap">
                      {fmtDate(lead.last_touch_at || lead.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-[var(--color-text-secondary)]">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} leads
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-[var(--color-border-primary)] rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!pagination.hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-[var(--color-border-primary)] rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Lead Details" size="xl">
        {selected && (
          <div className="space-y-5 text-sm">
            {/* Identity */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-brand-navy">{selected.organization}</h3>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_META[selected.status]?.color || ''}`}>
                    {STATUS_META[selected.status]?.label || selected.status}
                  </span>
                </div>
                <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  {selected.lead_id} · {pretty(selected.organization_type)} · created {fmtDate(selected.created_at)}
                </div>
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] text-right">
                <div>Last activity {fmtDateTime(selected.last_touch_at || selected.updated_at)}</div>
                <div>First contact {fmtDate(selected.first_contact_at)}</div>
              </div>
            </div>

            {/* Contact + location */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-[var(--color-background-secondary)] rounded-xl p-4">
                <div className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">Business contact</div>
                <dl className="space-y-1">
                  <div><dt className="inline text-[var(--color-text-tertiary)]">Contact: </dt><dd className="inline">{selected.contact_name || '—'}{selected.contact_role ? ` (${selected.contact_role})` : ''}</dd></div>
                  <div><dt className="inline text-[var(--color-text-tertiary)]">Phone: </dt><dd className="inline">{selected.phone || '—'}</dd></div>
                  <div><dt className="inline text-[var(--color-text-tertiary)]">Email: </dt><dd className="inline">{selected.email || '—'}</dd></div>
                  <div><dt className="inline text-[var(--color-text-tertiary)]">Website: </dt><dd className="inline break-all">{selected.website || '—'}</dd></div>
                  <div><dt className="inline text-[var(--color-text-tertiary)]">Facebook: </dt><dd className="inline break-all">{selected.facebook_url || '—'}</dd></div>
                  <div><dt className="inline text-[var(--color-text-tertiary)]">LinkedIn: </dt><dd className="inline break-all">{selected.linkedin_url || '—'}</dd></div>
                </dl>
              </div>
              <div className="bg-[var(--color-background-secondary)] rounded-xl p-4">
                <div className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">Location &amp; intent</div>
                <dl className="space-y-1">
                  <div><dt className="inline text-[var(--color-text-tertiary)]">City: </dt><dd className="inline">{selected.city || '—'}</dd></div>
                  <div><dt className="inline text-[var(--color-text-tertiary)]">District: </dt><dd className="inline">{selected.district || '—'}</dd></div>
                  <div><dt className="inline text-[var(--color-text-tertiary)]">Division: </dt><dd className="inline">{selected.division || '—'}</dd></div>
                  <div><dt className="inline text-[var(--color-text-tertiary)]">Product category: </dt><dd className="inline">{selected.likely_product_category || '—'}</dd></div>
                  <div><dt className="inline text-[var(--color-text-tertiary)]">Quality: </dt><dd className="inline">{selected.lead_quality || '—'}</dd></div>
                </dl>
              </div>
            </div>





            {/* Attribution (Phase 4.1 first touch) */}
            <div className="border border-[var(--color-border-primary)] rounded-xl p-4">
              <div className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">Attribution (first touch)</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><div className="text-[var(--color-text-tertiary)]">Source</div><div className="font-medium">{pretty(selected.source)}</div></div>
                <div><div className="text-[var(--color-text-tertiary)]">Medium</div><div className="font-medium">{selected.medium || '—'}</div></div>
                <div><div className="text-[var(--color-text-tertiary)]">Campaign</div><div className="font-medium">{selected.campaign || '—'}</div></div>
                <div><div className="text-[var(--color-text-tertiary)]">Content</div><div className="font-medium">{selected.content || '—'}</div></div>
              </div>
              <div className="text-xs text-[var(--color-text-tertiary)] mt-2 break-all">
                Landing page: {selected.landing_page || '—'} · first touch {fmtDateTime(selected.first_touch_at)}
              </div>
            </div>

            {/* Pipeline + assignment */}
            <div className="border border-[var(--color-border-primary)] rounded-xl p-4 space-y-4">
              <div>
                <div className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">Advance pipeline</div>
                {allowedNext.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-tertiary)]">This lead is in a terminal state.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allowedNext.map((next) => (
                      <button
                        key={next}
                        type="button"
                        disabled={saving}
                        onClick={() => handleStatus(next)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-navy text-white disabled:opacity-50"
                      >
                        → {STATUS_META[next]?.label || next}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Owner</label>
                  <input
                    value={assignDraft}
                    onChange={(e) => setAssignDraft(e.target.value)}
                    placeholder="Sales owner name"
                    className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm"
                  />
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleAssign}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-[var(--color-border-primary)] disabled:opacity-50"
                >
                  Save owner
                </button>
              </div>
            </div>

            {/* RFQ / quotation references (never a copy of the quote) */}
            <div className="border border-[var(--color-border-primary)] rounded-xl p-4 space-y-3">
              <div className="text-xs font-semibold text-[var(--color-text-secondary)]">Related RFQ / quotations</div>
              {selected.related_quotes && selected.related_quotes.length ? (
                <ul className="space-y-1.5">
                  {selected.related_quotes.map((q) => (
                    <li key={q.quote_number} className="flex items-center justify-between text-xs bg-[var(--color-background-secondary)] rounded-lg px-3 py-2">
                      <a href={`/admin/quotes`} className="font-medium text-brand-navy hover:underline">{q.quote_number}</a>
                      <span className="text-[var(--color-text-tertiary)]">linked {fmtDate(q.linked_at)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[var(--color-text-tertiary)]">No quotation linked yet. The quotation system remains the source of truth.</p>
              )}
              <div className="flex gap-2">
                <input
                  value={quoteDraft}
                  onChange={(e) => setQuoteDraft(e.target.value)}
                  placeholder="Quote number, e.g. QT-2026-0042"
                  className="flex-1 px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm"
                />
                <button
                  type="button"
                  disabled={saving || !quoteDraft.trim()}
                  onClick={handleLinkQuote}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-role-admin-tint text-role-admin-strong disabled:opacity-50"
                >
                  Link quote
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                RFQ status: {pretty(selected.rfq_status)} · Customer status: {pretty(selected.customer_status)}
              </p>
            </div>

            {/* Internal notes */}
            <div className="border border-[var(--color-border-primary)] rounded-xl p-4 space-y-3">
              <div className="text-xs font-semibold text-[var(--color-text-secondary)]">Internal notes</div>
              {selected.notes && selected.notes.length ? (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {selected.notes.map((n) => (
                    <li key={n._id || n.at} className="text-xs bg-[var(--color-background-secondary)] rounded-lg px-3 py-2">
                      <span className="text-[var(--color-text-tertiary)]">{fmtDateTime(n.at)} · {n.by || 'admin'}</span>
                      <div className="text-[var(--color-text-primary)] break-words">{n.text}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[var(--color-text-tertiary)]">No notes yet.</p>
              )}
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={3}
                placeholder="Add an internal note (not shown to customers)"
                className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm"
              />
              <button
                type="button"
                disabled={saving || !noteDraft.trim()}
                onClick={handleAddNote}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-navy text-white disabled:opacity-50"
              >
                Add note
              </button>
            </div>

            <div className="text-xs text-[var(--color-text-tertiary)] border-t border-[var(--color-border-tertiary)] pt-3">
              Next action: {selected.next_action || '—'}
              {selected.next_action_date ? ` (due ${fmtDate(selected.next_action_date)})` : ''} · Updated {fmtDateTime(selected.updated_at)}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

