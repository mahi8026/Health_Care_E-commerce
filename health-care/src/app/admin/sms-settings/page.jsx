'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import api from '@/utils/api';

export default function SMSSettingsPage() {
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchConfig = async () => {
    try {
      const data = await api.get('/sms/config');
      if (data.success) {
        setConfig(data.config);
      }
    } catch (error) {
      setError(error.message || 'Failed to fetch SMS config');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.get('/sms/stats');
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      setError(error.message || 'Failed to fetch SMS stats');
    }
  };

  useEffect(() => {
    (async () => {
      await Promise.all([fetchConfig(), fetchStats()]);
    })();
     
  }, []);

  const handleTestSMS = async (e) => {
    e.preventDefault();
    setTestLoading(true);
    setTestResult(null);

    try {
      const data = await api.post('/sms/test', { phone: testPhone });
      setTestResult(data);

      if (data.success) {
        setTestPhone('');
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || 'Failed to send test SMS'
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminShell title="SMS Settings">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="SMS Settings">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">SMS Configuration</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Manage SMS service settings and send test messages</p>
        </div>

        {error && (
          <div className="mb-6 bg-[var(--color-status-danger-tint)] border border-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] px-4 py-3 rounded-lg flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Configuration Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">Current Configuration</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-primary)]">
              <div>
                <div className="text-sm font-medium text-[var(--color-text-primary)]">SMS Provider</div>
                <div className="text-sm text-[var(--color-text-secondary)]">Current SMS gateway provider</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-[var(--color-text-primary)]">{config?.provider || 'Not configured'}</div>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-primary)]">
              <div>
                <div className="text-sm font-medium text-[var(--color-text-primary)]">Sender ID</div>
                <div className="text-sm text-[var(--color-text-secondary)]">SMS sender identification</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-[var(--color-text-primary)]">{config?.senderId || 'Not set'}</div>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-primary)]">
              <div>
                <div className="text-sm font-medium text-[var(--color-text-primary)]">Status</div>
                <div className="text-sm text-[var(--color-text-secondary)]">Service configuration status</div>
              </div>
              <div className="text-right">
                {config?.isConfigured ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]">
                    ✓ Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]">
                    ✗ Not Configured
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-medium text-[var(--color-text-primary)]">Admin Phone</div>
                <div className="text-sm text-[var(--color-text-secondary)]">Phone for admin alerts</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-[var(--color-text-primary)]">{config?.adminPhone || 'Not set'}</div>
              </div>
            </div>
          </div>

          {!config?.isConfigured && (
            <div className="mt-6 p-4 bg-[var(--color-status-warning-tint)] border border-[var(--color-status-warning-tint)] rounded-lg">
              <div className="flex items-start">
                <span className="text-[var(--color-status-warning)] text-xl mr-3">⚠️</span>
                <div>
                  <h3 className="font-semibold text-[var(--color-status-warning)]">SMS Service Not Configured</h3>
                  <p className="text-sm text-[var(--color-status-warning)] mt-1">
                    Please add {config?.missingEnvVars?.length ? config.missingEnvVars.join(', ') : 'the provider credentials'} to your environment variables to enable SMS functionality.
                  </p>
                  {config?.provider === 'SSL Wireless' && (
                    <p className="text-sm text-[var(--color-status-warning)] mt-2">
                      Get your API key from <a href="https://sslwireless.com" target="_blank" rel="noopener noreferrer" className="underline">SSL Wireless</a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Card */}
        {stats && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">SMS Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">Total Sent</div>
                <div className="text-2xl font-semibold text-blue-900 mt-1">{stats.totalSent || 0}</div>
              </div>
              
              <div className="bg-[var(--color-status-danger-tint)] rounded-lg p-4">
                <div className="text-sm text-[var(--color-status-danger)] font-medium">Failed</div>
                <div className="text-2xl font-semibold text-[var(--color-status-danger)] mt-1">{stats.totalFailed || 0}</div>
              </div>
              
              <div className="bg-[var(--color-status-success-tint)] rounded-lg p-4">
                <div className="text-sm text-[var(--color-status-success)] font-medium">Success Rate</div>
                <div className="text-2xl font-semibold text-[var(--color-status-success)] mt-1">
                  {stats.totalSent > 0 
                    ? `${Math.round(((stats.totalSent - stats.totalFailed) / stats.totalSent) * 100)}%`
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test SMS Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">Send Test SMS</h2>
          
          <form onSubmit={handleTestSMS} className="space-y-4">
            <div>
              <label htmlFor="testPhone" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="testPhone"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+8801XXXXXXXXX or 01XXXXXXXXX"
                className="w-full px-4 py-2 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Enter a Bangladesh phone number (e.g., +8801712345678 or 01712345678)
              </p>
            </div>

            <button
              type="submit"
              disabled={testLoading || !config?.isConfigured}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {testLoading ? 'Sending...' : 'Send Test SMS'}
            </button>
          </form>

          {testResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              testResult.success 
                ? 'bg-[var(--color-status-success-tint)] border border-[var(--color-status-success-tint)]' 
                : 'bg-[var(--color-status-danger-tint)] border border-[var(--color-status-danger-tint)]'
            }`}>
              <div className="flex items-start">
                <span className={`text-xl mr-3 ${testResult.success ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-danger)]'}`}>
                  {testResult.success ? '✓' : '✗'}
                </span>
                <div>
                  <h3 className={`font-semibold ${testResult.success ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-danger)]'}`}>
                    {testResult.success ? 'Success' : 'Failed'}
                  </h3>
                  <p className={`text-sm mt-1 ${testResult.success ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-danger)]'}`}>
                    {testResult.message}
                  </p>
                  {testResult.phone && (
                    <p className={`text-xs mt-1 ${testResult.success ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-danger)]'}`}>
                      Sent to: {testResult.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Information Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-blue-600 text-xl mr-3">ℹ️</span>
            <div>
              <h3 className="font-semibold text-blue-900">SMS Features</h3>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>OTP verification for phone numbers</li>
                <li>Order confirmation SMS to customers</li>
                <li>Order status update notifications</li>
                <li>Low stock alerts to admin</li>
                <li>All SMS sends are non-blocking and logged</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
