'use client';

import { useState, useEffect } from 'react';
import { API } from '@/constants/api';

export default function SystemMonitoring() {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchAllData();

    // Auto-refresh every 30 seconds
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchAllData, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchHealth(),
      fetchMetrics(),
      fetchSystemInfo()
    ]);
    setLoading(false);
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API}/monitoring/health`);
      const data = await res.json();
      if (data.success) {
        setHealth(data.data);
      }
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error('Health fetch error:', err);
    }
  };

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/monitoring/metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error('Metrics fetch error:', err);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/monitoring/system`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSystemInfo(data.data);
      }
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error('System info fetch error:', err);
    }
  };

  const handleResetMetrics = async () => {
    if (!confirm('Are you sure you want to reset all metrics?')) return;

    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/monitoring/metrics/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Metrics reset successfully');
        fetchAllData();
      }
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error('Reset error:', err);
      alert('Failed to reset metrics');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '✓';
      case 'warning': return '⚠';
      case 'critical': return '✗';
      default: return '?';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B2545] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#0B2545] mb-2">System Monitoring</h2>
          <p className="text-gray-600">Real-time system health and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              autoRefresh
                ? 'bg-[#0E8A6E] text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {autoRefresh ? '🔄 Auto-refresh ON' : '⏸ Auto-refresh OFF'}
          </button>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 bg-[#0B2545] text-white rounded-lg text-sm font-medium hover:bg-[#0a1f3a]"
          >
            🔄 Refresh Now
          </button>
          <button
            onClick={handleResetMetrics}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Reset Metrics
          </button>
        </div>
      </div>

      {/* Health Status Card */}
      {health && (
        <div className={`mb-6 p-6 rounded-lg border-2 ${getStatusColor(health.status)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{getStatusIcon(health.status)}</div>
              <div>
                <h3 className="text-xl font-bold capitalize">{health.status}</h3>
                <p className="text-sm">System Status</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-xs opacity-75">Memory Usage</p>
                <p className="text-lg font-bold">{health.metrics.memoryUsage}</p>
              </div>
              <div>
                <p className="text-xs opacity-75">Error Rate</p>
                <p className="text-lg font-bold">{health.metrics.errorRate}</p>
              </div>
              <div>
                <p className="text-xs opacity-75">Avg Response</p>
                <p className="text-lg font-bold">{health.metrics.avgResponseTime}</p>
              </div>
              <div>
                <p className="text-xs opacity-75">Total Requests</p>
                <p className="text-lg font-bold">{health.metrics.totalRequests}</p>
              </div>
            </div>
          </div>
          {health.issues && health.issues.length > 0 && (
            <div className="mt-4 pt-4 border-t border-current/20">
              <p className="font-semibold mb-2">Issues Detected:</p>
              <ul className="list-disc list-inside space-y-1">
                {health.issues.map((issue, idx) => (
                  <li key={idx} className="text-sm">{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg border mb-6">
        <div className="flex border-b">
          {['overview', 'performance', 'endpoints', 'system'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize ${
                activeTab === tab
                  ? 'text-[#0E8A6E] border-b-2 border-[#0E8A6E]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && metrics && (
            <div className="space-y-6">
              {/* Uptime */}
              <div>
                <h3 className="text-lg font-bold text-[#0B2545] mb-3">Uptime</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Hours</p>
                    <p className="text-2xl font-bold text-[#0B2545]">{metrics.uptime.hours}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Minutes</p>
                    <p className="text-2xl font-bold text-[#0B2545]">{metrics.uptime.minutes}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Seconds</p>
                    <p className="text-2xl font-bold text-[#0B2545]">{metrics.uptime.seconds}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Milliseconds</p>
                    <p className="text-2xl font-bold text-[#0B2545]">{metrics.uptime.milliseconds}</p>
                  </div>
                </div>
              </div>

              {/* Requests */}
              <div>
                <h3 className="text-lg font-bold text-[#0B2545] mb-3">Requests</h3>
                <div className="grid grid-cols-5 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">Total</p>
                    <p className="text-2xl font-bold text-blue-900">{metrics.requests.total}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">Success</p>
                    <p className="text-2xl font-bold text-green-900">{metrics.requests.success}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-sm text-red-800">Errors</p>
                    <p className="text-2xl font-bold text-red-900">{metrics.requests.errors}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">Error Rate</p>
                    <p className="text-2xl font-bold text-yellow-900">{metrics.requests.errorRate}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-800">Slow Requests</p>
                    <p className="text-2xl font-bold text-purple-900">{metrics.performance.slowRequestsCount}</p>
                  </div>
                </div>
              </div>

              {/* Methods */}
              <div>
                <h3 className="text-lg font-bold text-[#0B2545] mb-3">Requests by Method</h3>
                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(metrics.requests.byMethod).map(([method, count]) => (
                    <div key={method} className="bg-gray-50 p-4 rounded-lg border">
                      <p className="text-sm text-gray-600">{method}</p>
                      <p className="text-2xl font-bold text-[#0B2545]">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && metrics && (
            <div className="space-y-6">
              {/* Response Times */}
              <div>
                <h3 className="text-lg font-bold text-[#0B2545] mb-3">Response Times</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Average</p>
                    <p className="text-2xl font-bold text-[#0B2545]">{metrics.performance.avgResponseTime}ms</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">P50 (Median)</p>
                    <p className="text-2xl font-bold text-[#0B2545]">{metrics.performance.p50}ms</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">P95</p>
                    <p className="text-2xl font-bold text-[#0B2545]">{metrics.performance.p95}ms</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">P99</p>
                    <p className="text-2xl font-bold text-[#0B2545]">{metrics.performance.p99}ms</p>
                  </div>
                </div>
              </div>

              {/* Recent Slow Requests */}
              {metrics.performance.recentSlowRequests && metrics.performance.recentSlowRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-[#0B2545] mb-3">Recent Slow Requests</h3>
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Endpoint</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Duration</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.performance.recentSlowRequests.map((req, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-mono">{req.endpoint}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`font-bold ${
                                req.duration > 5000 ? 'text-red-600' :
                                req.duration > 3000 ? 'text-orange-600' :
                                'text-yellow-600'
                              }`}>
                                {req.duration}ms
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">{req.statusCode}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(req.timestamp).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Endpoints Tab */}
          {activeTab === 'endpoints' && metrics && (
            <div className="space-y-6">
              {/* Slowest Endpoints */}
              <div>
                <h3 className="text-lg font-bold text-[#0B2545] mb-3">Slowest Endpoints</h3>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Endpoint</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Avg Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Min</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Max</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Count</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.endpoints.slowest.map((endpoint, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono">{endpoint.endpoint}</td>
                          <td className="px-4 py-3 text-sm font-bold">{Math.round(endpoint.avgResponseTime)}ms</td>
                          <td className="px-4 py-3 text-sm">{Math.round(endpoint.minResponseTime)}ms</td>
                          <td className="px-4 py-3 text-sm">{Math.round(endpoint.maxResponseTime)}ms</td>
                          <td className="px-4 py-3 text-sm">{endpoint.count}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={endpoint.errors > 0 ? 'text-red-600 font-bold' : ''}>
                              {endpoint.errors}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Most Used Endpoints */}
              <div>
                <h3 className="text-lg font-bold text-[#0B2545] mb-3">Most Used Endpoints</h3>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Endpoint</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Count</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Avg Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Errors</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Error Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.endpoints.mostUsed.map((endpoint, idx) => {
                        const errorRate = ((endpoint.errors / endpoint.count) * 100).toFixed(2);
                        return (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-mono">{endpoint.endpoint}</td>
                            <td className="px-4 py-3 text-sm font-bold">{endpoint.count}</td>
                            <td className="px-4 py-3 text-sm">{Math.round(endpoint.avgResponseTime)}ms</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={endpoint.errors > 0 ? 'text-red-600 font-bold' : ''}>
                                {endpoint.errors}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={parseFloat(errorRate) > 5 ? 'text-red-600 font-bold' : ''}>
                                {errorRate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && systemInfo && (
            <div className="space-y-6">
              {/* Memory */}
              <div>
                <h3 className="text-lg font-bold text-[#0B2545] mb-3">Memory Usage</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Heap Used</p>
                    <p className="text-2xl font-bold text-[#0B2545]">{systemInfo.memory.heapUsedMB}MB</p>
                    <p className="text-xs text-gray-500 mt-1">{systemInfo.memory.heapUsedPercent}%</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Heap Total</p>
                    <p className="text-2xl font-bold text-[#0B2545]">{systemInfo.memory.heapTotalMB}MB</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">External</p>
                    <p className="text-2xl font-bold text-[#0B2545]">
                      {Math.round(systemInfo.memory.external / 1024 / 1024)}MB
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">RSS</p>
                    <p className="text-2xl font-bold text-[#0B2545]">
                      {Math.round(systemInfo.memory.rss / 1024 / 1024)}MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Node Info */}
              <div>
                <h3 className="text-lg font-bold text-[#0B2545] mb-3">Node.js Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Version</p>
                    <p className="text-lg font-bold text-[#0B2545]">{systemInfo.node.version}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Platform</p>
                    <p className="text-lg font-bold text-[#0B2545]">{systemInfo.node.platform} ({systemInfo.node.arch})</p>
                  </div>
                </div>
              </div>

              {/* Environment */}
              <div>
                <h3 className="text-lg font-bold text-[#0B2545] mb-3">Environment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">NODE_ENV</p>
                    <p className="text-lg font-bold text-[#0B2545]">{systemInfo.environment.nodeEnv}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Port</p>
                    <p className="text-lg font-bold text-[#0B2545]">{systemInfo.environment.port}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
