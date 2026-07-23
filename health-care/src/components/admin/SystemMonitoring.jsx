'use client';

import { useState, useEffect, useCallback } from 'react';
import { API } from '@/constants/api';

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
    banner: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    dot: 'bg-emerald-500',
    label: 'Healthy',
  },
  warning: {
    banner: 'bg-amber-50 border-amber-200 text-amber-900',
    dot: 'bg-amber-500',
    label: 'Warning',
  },
  critical: {
    banner: 'bg-red-50 border-red-200 text-red-900',
    dot: 'bg-red-500',
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
    up ? 'bg-emerald-100 text-emerald-800' :
    connecting ? 'bg-blue-100 text-blue-800' :
    degraded ? 'bg-red-100 text-red-800' :
    'bg-gray-100 text-gray-700';

  const label =
    up ? 'Operational' :
    connecting ? 'Connecting' :
    status === 'degraded' ? 'Degraded' :
    'Down';

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-[13px] font-semibold text-[#0B2545]">{SERVICE_LABELS[name] || name}</p>
        <p className="text-[11px] text-gray-500 mt-0.5 capitalize">{name}</p>
      </div>
      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${pill}`}>
        {label}
      </span>
    </div>
  );
}

function MetricTile({ label, value, hint }) {
  return (
    <div className="bg-white/80 rounded-lg px-4 py-3 min-w-[120px]">
      <p className="text-[10px] uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-[18px] font-bold mt-0.5">{value}</p>
      {hint && <p className="text-[10px] opacity-60 mt-0.5">{hint}</p>}
    </div>
  );
}

function StatCard({ label, value, sub, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-gray-50 border-gray-100',
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-emerald-50 border-emerald-100',
    red: 'bg-red-50 border-red-100',
    amber: 'bg-amber-50 border-amber-100',
    purple: 'bg-purple-50 border-purple-100',
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-[11px] text-gray-600">{label}</p>
      <p className="text-[22px] font-bold text-[#0B2545] mt-1">{value}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
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
    fetchDashboard(false, controller.signal);
    if (!autoRefresh) return () => controller.abort();
    const interval = setInterval(() => fetchDashboard(true, controller.signal), 30_000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [autoRefresh, fetchDashboard]);

  const handleResetMetrics = async () => {
    if (!confirm('Reset all performance counters? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/monitoring/metrics/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) fetchDashboard(true);
      else alert(json.message || 'Reset failed');
    } catch {
      alert('Failed to reset metrics');
    }
  };

  if (loading && !data) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#0B2545] border-t-transparent mx-auto mb-3" />
          <p className="text-[13px] text-gray-600">Loading monitoring data…</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-red-100">
        <p className="text-[14px] text-red-800 mb-3">{error}</p>
        <button
          type="button"
          onClick={() => fetchDashboard()}
          className="px-4 py-2 bg-[#0B2545] text-white rounded-lg text-[13px] font-semibold"
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
        <p className="text-[13px] text-gray-600">
          Real-time API health and performance
          {data?.fetchedAt && (
            <span className="text-gray-400">
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
            className={`px-3 py-2 md:py-1.5 rounded-lg text-[12px] font-semibold border transition-colors min-h-[44px] md:min-h-0 ${
              autoRefresh
                ? 'bg-[#0E8A6E] text-white border-[#0E8A6E]'
                : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            {autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
          </button>
          <button
            type="button"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="px-3 py-2 md:py-1.5 bg-[#0B2545] text-white rounded-lg text-[12px] font-semibold hover:bg-[#0a1f3a] disabled:opacity-60 min-h-[44px] md:min-h-0"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleResetMetrics}
            className="px-3 py-2 md:py-1.5 bg-white text-red-700 border border-red-200 rounded-lg text-[12px] font-semibold hover:bg-red-50 min-h-[44px] md:min-h-0"
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
                <p className="text-[18px] font-bold">{statusStyle.label}</p>
                <p className="text-[12px] opacity-80">Overall system status</p>
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
            <ul className="mt-4 pt-4 border-t border-current/15 space-y-1 text-[12px] list-disc list-inside">
              {health.issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 pt-4 border-t border-current/15 text-[12px] opacity-80">
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
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto" style={{WebkitOverflowScrolling: 'touch'}}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 md:px-5 py-4 md:py-3 text-[12px] font-semibold whitespace-nowrap border-b-2 transition-colors min-h-[44px] ${
                activeTab === tab.id
                  ? 'text-[#0E8A6E] border-[#0E8A6E]'
                  : 'text-gray-500 border-transparent hover:text-gray-800'
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
                <h3 className="text-[13px] font-semibold text-[#0B2545] mb-3">Server uptime</h3>
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
                <h3 className="text-[13px] font-semibold text-[#0B2545] mb-3">By HTTP method</h3>
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
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full text-[12px]">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold">Endpoint</th>
                        <th className="text-left px-3 py-2 font-semibold">Duration</th>
                        <th className="text-left px-3 py-2 font-semibold">Status</th>
                        <th className="text-left px-3 py-2 font-semibold">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.performance.recentSlowRequests.map((req, idx) => (
                        <tr key={idx} className="border-t border-gray-50">
                          <td className="px-3 py-2 font-mono text-[11px]">{req.endpoint}</td>
                          <td className="px-3 py-2 font-semibold text-amber-700">{req.duration}ms</td>
                          <td className="px-3 py-2">{req.statusCode}</td>
                          <td className="px-3 py-2 text-gray-500">
                            {new Date(req.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[12px] text-gray-500">No slow requests recorded yet.</p>
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
                  <h3 className="text-[13px] font-semibold text-[#0B2545] mb-3">{title}</h3>
                  {rows?.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-gray-100">
                      <table className="w-full text-[12px]">
                        <thead className="bg-gray-50 text-gray-600">
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
                            <tr key={idx} className="border-t border-gray-50">
                              <td className="px-3 py-2 font-mono text-[11px] max-w-[280px] truncate">
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
                              <td className={`px-3 py-2 ${ep.errors > 0 ? 'text-red-600 font-semibold' : ''}`}>
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
                    <p className="text-[12px] text-gray-500">No endpoint data yet.</p>
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
