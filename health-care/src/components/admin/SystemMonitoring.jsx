'use client';
import { confirmAction } from '@/components/ui/ConfirmDialog';

import { useState, useEffect, useCallback } from 'react';
import { API } from '@/constants/api';
import { showToast } from '@/components/ui/Toast';

function formatUptime(uptime) {
  if (!uptime) return '—';
  const { hours = 0, minutes = 0, seconds = 0 } = uptime;
  if (hours >= 24) {
    const d = Math.floor(hours / 24);
    const h = hours % 24;
    return `${d}d ${h}h`;
  }
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatFetchedAt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-BD', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const STATUS_STYLES = {
  healthy: {
    banner: 'bg-[var(--color-status-success-tint)] border-[var(--color-status-success-tint)] text-[var(--color-status-success)]',
    dot: 'bg-[var(--color-status-success-tint)]',
    label: 'Healthy',
  },
  warning: {
    banner: 'bg-[var(--color-status-warning-tint)] border-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]',
    dot: 'bg-warning',
    label: 'Warning',
  },
  critical: {
    banner: 'bg-[var(--color-status-danger-tint)] border-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]',
    dot: 'bg-[var(--color-status-danger-tint)]',
    label: 'Critical',
  },
};

const SERVICE_LABELS = {
  api: 'API Server',
  database: 'MongoDB',
  redis: 'Redis Cache',
};

function ServiceCard({ name, status }) {
  const up = status === 'up';
  const connecting = status === 'connecting';
  const degraded = status === 'degraded' || status === 'down';

  const pill =
    up ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' :
    connecting ? 'bg-blue-100 text-blue-800' :
    degraded ? 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]' :
    'bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)]';

  const label =
    up ? 'Operational' :
    connecting ? 'Connecting' :
    status === 'degraded' ? 'Degraded' :
    'Down';

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border-tertiary)] p-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-brand-navy">{SERVICE_LABELS[name] || name}</p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 capitalize">{name}</p>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pill}`}>
        {label}
      </span>
    </div>
  );
}

function MetricTile({ label, value, hint }) {
  return (
    <div className="bg-white/80 rounded-lg px-4 py-3 min-w-[120px]">
      <p className="text-xs uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-lg font-semibold mt-0.5">{value}</p>
      {hint && <p className="text-xs opacity-60 mt-0.5">{hint}</p>}
    </div>
  );
}

function StatCard({ label, value, sub, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-[var(--color-background-secondary)] border-[var(--color-border-tertiary)]',
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-[var(--color-status-success-tint)] border-[var(--color-status-success-tint)]',
    red: 'bg-[var(--color-status-danger-tint)] border-[var(--color-status-danger-tint)]',
    amber: 'bg-[var(--color-status-warning-tint)] border-[var(--color-status-warning-tint)]',
    purple: 'bg-purple-50 border-purple-100',
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
      <p className="text-2xl font-semibold text-brand-navy mt-1">{value}</p>
      {sub && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{sub}</p>}
    </div>
  );
}

export default function SystemMonitoring() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async (silent = false, signal) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const token = localStorage.getItem('Mediport_token');
      if (!token) {
        setError('Please sign in again to view monitoring data.');
        return;
      }

      const authHeaders = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const fetchOpts = { headers: authHeaders, cache: 'no-store', signal };

      const loadCombined = async (url) => {
        const res = await fetch(url, fetchOpts);
        const json = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          throw new Error(json.message || 'Admin access required. Please log in again.');
        }
        if (!res.ok || !json.success) {
          return null;
        }
        return json.data;
      };

      let payload =
        (await loadCombined(`${API}/admin/monitoring`)) ||
        (await loadCombined(`${API}/monitoring/dashboard`));

      if (!payload) {
        const [healthRes, metricsRes, systemRes] = await Promise.all([
          fetch(`${API}/monitoring/health`, { cache: 'no-store', signal }),
          fetch(`${API}/monitoring/metrics`, fetchOpts),
          fetch(`${API}/monitoring/system`, fetchOpts),
        ]);

        const healthJson = await healthRes.json().catch(() => ({}));
        const metricsJson = await metricsRes.json().catch(() => ({}));
        const systemJson = await systemRes.json().catch(() => ({}));

        if (metricsRes.status === 401 || metricsRes.status === 403) {
          throw new Error(metricsJson.message || 'Admin access required. Please log in again.');
        }
        if (!metricsJson.success || !systemJson.success) {
          throw new Error(
            metricsJson.message ||
              systemJson.message ||
              'Monitoring API unavailable. Restart the backend server and try again.',
          );
        }

        payload = {
          health: healthJson.data,
          services: {
            api: 'up',
            database: healthJson.data?.status === 'critical' &&
              healthJson.data?.issues?.some((i) => i.includes('Database'))
              ? 'down'
              : 'up',
            redis: healthJson.data?.issues?.some((i) => i.includes('Redis'))
              ? 'degraded'
              : 'up',
          },
          metrics: metricsJson.data,
          system: systemJson.data,
          fetchedAt: new Date().toISOString(),
        };
      }

      setData(payload);
    } catch (err) {
      if (err.name === 'AbortError') return;
      const msg = err.message || '';
      if (msg === 'Failed to fetch' || msg.includes('NetworkError')) {
        setError(
          'Cannot reach the API server. Start the backend (npm run dev in the backend folder) and click Retry.',
        );
      } else {
        setError(msg || 'Failed to load monitoring data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => fetchDashboard(false, controller.signal));
    if (!autoRefresh) return () => controller.abort();
    const interval = setInterval(() => fetchDashboard(true, controller.signal), 30_000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [autoRefresh, fetchDashboard]);

  const handleResetMetrics = async () => {
    if (!await confirmAction('Reset all performance counters? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/monitoring/metrics/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) fetchDashboard(true);
      else showToast.error(json.message || 'Reset failed');
    } catch {
      showToast.error('Failed to reset metrics');
    }
  };

  if (loading && !data) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-navy border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading monitoring data…</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-[var(--color-status-danger-tint)]">
        <p className="text-sm text-[var(--color-status-danger)] mb-3">{error}</p>
        <button
          type="button"
          onClick={() => fetchDashboard()}
          className="px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const health = data?.health;
  const metrics = data?.metrics;
  const system = data?.system;
  const services = data?.services || {};
  const statusKey = health?.status || 'healthy';
  const statusStyle = STATUS_STYLES[statusKey] || STATUS_STYLES.healthy;
  const hm = health?.metrics || {};

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'performance', label: 'Performance' },
    { id: 'endpoints', label: 'Endpoints' },
    { id: 'system', label: 'System' },
  ];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Real-time API health and performance
          {data?.fetchedAt && (
            <span className="text-[var(--color-text-secondary)]">
              {' '}
              · Updated {formatFetchedAt(data.fetchedAt)}
              {refreshing && ' · refreshing…'}
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAutoRefresh((v) => !v)}
            className={`px-3 py-2 md:py-1.5 rounded-lg text-xs font-semibold border transition-colors min-h-[44px] md:min-h-0 ${
              autoRefresh
                ? 'bg-brand-teal text-white border-brand-teal'
                : 'bg-white text-[var(--color-text-primary)] border-[var(--color-border-primary)]'
            }`}
          >
            {autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
          </button>
          <button
            type="button"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="px-3 py-2 md:py-1.5 bg-brand-navy text-white rounded-lg text-xs font-semibold hover:bg-[#0a1f3a] disabled:opacity-60 min-h-[44px] md:min-h-0"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleResetMetrics}
            className="px-3 py-2 md:py-1.5 bg-white text-[var(--color-status-danger)] border border-[var(--color-status-danger-tint)] rounded-lg text-xs font-semibold hover:bg-[var(--color-status-danger-tint)] min-h-[44px] md:min-h-0"
          >
            Reset counters
          </button>
        </div>
      </div>

      {/* Status banner */}
      {health && (
        <div className={`rounded-xl border p-5 ${statusStyle.banner}`}>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${statusStyle.dot}`} />
              <div>
                <p className="text-lg font-semibold">{statusStyle.label}</p>
                <p className="text-xs opacity-80">Overall system status</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <MetricTile
                label="Process RAM"
                value={hm.memoryRss || hm.memoryUsage || '—'}
                hint={hm.heapUsedMB != null ? `Heap ${hm.heapUsedMB}/${hm.heapTotalMB} MB` : null}
              />
              <MetricTile label="Error rate" value={hm.errorRate || '0%'} />
              <MetricTile label="Avg response" value={hm.avgResponseTime || '—'} />
              <MetricTile
                label="Requests tracked"
                value={hm.totalRequests ?? 0}
                hint={hm.totalRequests < 10 ? 'Low sample — rates stabilize with traffic' : null}
              />
            </div>
          </div>
          {health.issues?.length > 0 ? (
            <ul className="mt-4 pt-4 border-t border-current/15 space-y-1 text-xs list-disc list-inside">
              {health.issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 pt-4 border-t border-current/15 text-xs opacity-80">
              No issues detected. Metrics reflect traffic since last server start or reset.
            </p>
          )}
        </div>
      )}

      {/* Services */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(services).map(([name, status]) => (
          <ServiceCard key={name} name={name} status={status} />
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-[var(--color-border-tertiary)] overflow-hidden">
        <div className="flex border-b border-[var(--color-border-tertiary)] overflow-x-auto" style={{WebkitOverflowScrolling: 'touch'}}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 md:px-5 py-4 md:py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors min-h-[44px] ${
                activeTab === tab.id
                  ? 'text-brand-teal border-brand-teal'
                  : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'overview' && metrics && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-brand-navy mb-3">Server uptime</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Uptime" value={formatUptime(metrics.uptime)} />
                  <StatCard label="Total requests" value={metrics.requests.total} tone="blue" />
                  <StatCard label="Successful" value={metrics.requests.success} tone="green" />
                  <StatCard
                    label="Errors"
                    value={metrics.requests.errors}
                    sub={`${metrics.requests.errorRate} error rate`}
                    tone="red"
                  />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-brand-navy mb-3">By HTTP method</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {Object.entries(metrics.requests.byMethod || {}).map(([method, count]) => (
                    <StatCard key={method} label={method} value={count} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && metrics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Average" value={`${metrics.performance.avgResponseTime}ms`} />
                <StatCard label="P50" value={`${metrics.performance.p50}ms`} />
                <StatCard label="P95" value={`${metrics.performance.p95}ms`} tone="amber" />
                <StatCard label="P99" value={`${metrics.performance.p99}ms`} tone="purple" />
              </div>
              <StatCard
                label="Slow requests"
                value={metrics.performance.slowRequestsCount}
                sub="Above threshold since boot"
                tone="amber"
              />
              {metrics.performance.recentSlowRequests?.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-[var(--color-border-tertiary)]">
                  <table className="w-full text-xs">
                    <thead className="bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)]">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold">Endpoint</th>
                        <th className="text-left px-3 py-2 font-semibold">Duration</th>
                        <th className="text-left px-3 py-2 font-semibold">Status</th>
                        <th className="text-left px-3 py-2 font-semibold">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.performance.recentSlowRequests.map((req, idx) => (
                        <tr key={idx} className="border-t border-[var(--color-border-tertiary)]">
                          <td className="px-3 py-2 font-mono text-xs">{req.endpoint}</td>
                          <td className="px-3 py-2 font-semibold text-[var(--color-status-warning)]">{req.duration}ms</td>
                          <td className="px-3 py-2">{req.statusCode}</td>
                          <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                            {new Date(req.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-[var(--color-text-secondary)]">No slow requests recorded yet.</p>
              )}
            </div>
          )}

          {activeTab === 'endpoints' && metrics && (
            <div className="space-y-8">
              {[
                { title: 'Slowest endpoints', rows: metrics.endpoints.slowest, type: 'slow' },
                { title: 'Most used endpoints', rows: metrics.endpoints.mostUsed, type: 'used' },
              ].map(({ title, rows, type }) => (
                <div key={title}>
                  <h3 className="text-sm font-semibold text-brand-navy mb-3">{title}</h3>
                  {rows?.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-[var(--color-border-tertiary)]">
                      <table className="w-full text-xs">
                        <thead className="bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)]">
                          <tr>
                            <th className="text-left px-3 py-2 font-semibold">Endpoint</th>
                            {type === 'slow' ? (
                              <>
                                <th className="text-left px-3 py-2">Avg</th>
                                <th className="text-left px-3 py-2">Min</th>
                                <th className="text-left px-3 py-2">Max</th>
                              </>
                            ) : (
                              <th className="text-left px-3 py-2">Count</th>
                            )}
                            <th className="text-left px-3 py-2">Errors</th>
                            {type === 'used' && <th className="text-left px-3 py-2">Error %</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((ep, idx) => (
                            <tr key={idx} className="border-t border-[var(--color-border-tertiary)]">
                              <td className="px-3 py-2 font-mono text-xs max-w-[280px] truncate">
                                {ep.endpoint}
                              </td>
                              {type === 'slow' ? (
                                <>
                                  <td className="px-3 py-2 font-semibold">
                                    {Math.round(ep.avgResponseTime)}ms
                                  </td>
                                  <td className="px-3 py-2">{Math.round(ep.minResponseTime)}ms</td>
                                  <td className="px-3 py-2">{Math.round(ep.maxResponseTime)}ms</td>
                                </>
                              ) : (
                                <td className="px-3 py-2 font-semibold">{ep.count}</td>
                              )}
                              <td className={`px-3 py-2 ${ep.errors > 0 ? 'text-[var(--color-status-danger)] font-semibold' : ''}`}>
                                {ep.errors}
                              </td>
                              {type === 'used' && (
                                <td className="px-3 py-2">
                                  {ep.count > 0
                                    ? `${((ep.errors / ep.count) * 100).toFixed(1)}%`
                                    : '—'}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--color-text-secondary)]">No endpoint data yet.</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'system' && system && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Heap used"
                  value={`${system.memory.heapUsedMB} MB`}
                  sub={`${system.memory.heapUsedPercent}% of heap`}
                />
                <StatCard label="Heap total" value={`${system.memory.heapTotalMB} MB`} />
                <StatCard
                  label="RSS (process)"
                  value={`${system.memory.rssMB} MB`}
                  sub={`${system.memory.rssPercent}% of ${system.memory.systemTotalMB} MB RAM`}
                  tone="blue"
                />
                <StatCard
                  label="Node uptime"
                  value={formatUptime({
                    hours: Math.floor(system.node.uptime / 3600),
                    minutes: Math.floor((system.node.uptime % 3600) / 60),
                    seconds: Math.floor(system.node.uptime % 60),
                  })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard label="Node version" value={system.node.version} />
                <StatCard
                  label="Platform"
                  value={`${system.node.platform} (${system.node.arch})`}
                />
                <StatCard
                  label="Environment"
                  value={system.environment.nodeEnv}
                  sub={`Port ${system.environment.port}`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
