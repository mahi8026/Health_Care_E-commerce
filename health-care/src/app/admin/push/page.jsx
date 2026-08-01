'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { getToken } from '@/utils/api';

const authHeaders = () => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export default function PushNotificationsPage() {
  const [tab, setTab] = useState('broadcast');
  const [stats, setStats] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [image, setImage] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    fetch('/api/push/admin/stats', { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); })
      .catch(() => {});
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    setResult(null);
    setError('');
    try {
      const res = await fetch('/api/push/admin/broadcast', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          url: url || '/',
          image: image || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(`Sent to ${data.data?.sent || 0} device(s)`);
        setTitle(''); setBody(''); setUrl('/'); setImage('');
      } else {
        setError(data.message || 'Failed to send');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendToUser = async (e) => {
    e.preventDefault();
    if (!userId.trim() || !title.trim() || !body.trim()) return;
    setSubmitting(true);
    setResult(null);
    setError('');
    try {
      const res = await fetch('/api/push/admin/send-to-user', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          userId: userId.trim(),
          title: title.trim(),
          body: body.trim(),
          url: url || '/',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult('Notification sent to user');
        setTitle(''); setBody(''); setUrl('/'); setUserId('');
      } else {
        setError(data.message || 'Failed to send');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell title="Push Notifications">
      <div className="p-5 px-6 space-y-6 max-w-2xl">
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-[var(--color-border-primary)] p-4">
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">Total Subscribers</div>
              <div className="text-2xl font-semibold text-brand-navy">{stats.total || 0}</div>
            </div>
            <div className="bg-white rounded-xl border border-[var(--color-border-primary)] p-4">
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">Reachable</div>
              <div className="text-2xl font-semibold text-brand-teal">{stats.messagable || 0}</div>
            </div>
          </div>
        )}

        <div className="flex gap-2 border-b border-[var(--color-border-primary)] pb-3">
          {(['broadcast', 'user']).map(t => (
            <button key={t} onClick={() => { setTab(t); setResult(null); setError(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-brand-navy text-white' : 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-muted)]'
              }`}
            >
              {t === 'broadcast' ? 'Broadcast to All' : 'Send to User'}
            </button>
          ))}
        </div>

        <form onSubmit={tab === 'broadcast' ? handleBroadcast : handleSendToUser} className="space-y-4">
          {tab === 'user' && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">User ID</label>
              <input type="text" value={userId} onChange={e => setUserId(e.target.value)}
                placeholder="MongoDB user _id"
                className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Notification title"
              className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Body</label>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              placeholder="Notification message"
              rows={3}
              className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Click URL</label>
            <input type="text" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="/"
              className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Image URL (optional)</label>
            <input type="text" value={image} onChange={e => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none"
            />
          </div>

          {result && (
            <div className="p-3 rounded-lg bg-[var(--color-status-success-tint)] border border-[var(--color-status-success-tint)] text-[var(--color-status-success)] text-sm">
              {result}
            </div>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-[var(--color-status-danger-tint)] border border-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full py-2.5 bg-brand-teal text-white rounded-lg font-medium text-sm hover:bg-[var(--color-brand-teal-hover)] disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Sending...' : `Send ${tab === 'broadcast' ? 'Broadcast' : 'to User'}`}
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
