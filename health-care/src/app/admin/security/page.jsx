'use client';
import { confirmAction } from '@/components/ui/ConfirmDialog';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import { useAuth } from '@/context/AuthContext';
import api, { getToken } from '@/utils/api';
import { API as API_BASE_URL } from '@/constants/api';

async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
}

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  return data;
}

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [twoFactorStatus, setTwoFactorStatus] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [setupStep, setSetupStep] = useState('check'); // check, setup, verify, complete
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTwoFactorStatus = async () => {
    try {
      const token = getToken();
      
      if (!token) {
        setError('Please login to access this page');
        setLoading(false);
        return;
      }
      
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await handleResponse(response);
      
      if (data.success) {
        setTwoFactorStatus(data.status);
        setSetupStep(data.status?.isEnabled ? 'complete' : 'check');
      } else {
        setError(data.message || 'Failed to fetch 2FA status');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchTwoFactorStatus();
    })();
     
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSetup2FA = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await api.post('/auth/2fa/setup', {});
      
      if (data.success) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setSetupStep('verify');
      } else {
        setError(data.message || 'Failed to setup 2FA');
      }
    } catch (err) {
      setError(err.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const data = await api.post('/auth/2fa/enable', { token: verificationCode });
      
      if (data.success) {
        setSuccess('Two-factor authentication enabled successfully!');
        setSetupStep('complete');
        setVerificationCode('');
        fetchTwoFactorStatus();
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (err) {
      setError(err.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!await confirmAction('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const data = await api.post('/auth/2fa/disable', {});
      
      if (data.success) {
        setSuccess('Two-factor authentication disabled');
        setSetupStep('check');
        setQrCode(null);
        setSecret(null);
        fetchTwoFactorStatus();
      } else {
        setError(data.message || 'Failed to disable 2FA');
      }
    } catch (err) {
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  if (loading && setupStep === 'check') {
    return (
      <AdminShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">Security Settings</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Manage your account security and two-factor authentication</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-[var(--color-status-danger-tint)] border border-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] px-4 py-3 rounded-lg flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-[var(--color-status-success-tint)] border border-[var(--color-status-success-tint)] text-[var(--color-status-success)] px-4 py-3 rounded-lg flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Two-Factor Authentication Card */}
        <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border-primary)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border-primary)] bg-[var(--color-background-secondary)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Two-Factor Authentication (2FA)</h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">Add an extra layer of security to your account</p>
                </div>
              </div>
              {setupStep === 'complete' && (
                <span className="px-3 py-1 bg-[var(--color-status-success-tint)] text-[var(--color-status-success)] text-sm font-medium rounded-full">
                  ✓ Enabled
                </span>
              )}
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Step 1: Check Status */}
            {setupStep === 'check' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-[var(--color-text-primary)] mb-2">What is Two-Factor Authentication?</h3>
                  <p className="text-[var(--color-text-secondary)] mb-4">
                    Two-factor authentication (2FA) adds an extra layer of security to your account. After entering your password, 
                    you&apos;ll need to enter a 6-digit code from your authenticator app.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">You&apos;ll need:</h4>
                    <ul className="list-disc list-inside text-blue-800 space-y-1">
                      <li>An authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)</li>
                      <li>Your smartphone or tablet</li>
                      <li>A few minutes to complete the setup</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={handleSetup2FA}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
                </button>
              </div>
            )}

            {/* Step 2: Scan QR Code */}
            {setupStep === 'verify' && qrCode && (
              <div>
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-[var(--color-text-primary)] mb-4">Step 1: Scan QR Code</h3>
                  <p className="text-[var(--color-text-secondary)] mb-4">
                    Open your authenticator app and scan this QR code:
                  </p>
                  <div className="flex justify-center mb-4">
                    <div className="bg-white p-4 rounded-lg border-2 border-[var(--color-border-primary)]">
                      <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" loading="lazy" />
                    </div>
                  </div>
                  <div className="bg-[var(--color-background-secondary)] border border-[var(--color-border-primary)] rounded-lg p-4">
                    <p className="text-sm text-[var(--color-text-primary)] mb-2">
                      <strong>Can&apos;t scan the QR code?</strong> Enter this code manually:
                    </p>
                    <code className="block bg-white px-3 py-2 rounded border border-[var(--color-border-primary)] text-center font-mono text-sm break-all">
                      {secret}
                    </code>
                  </div>
                </div>

                <form onSubmit={handleEnable2FA}>
                  <div className="mb-6">
                    <h3 className="text-md font-semibold text-[var(--color-text-primary)] mb-4">Step 2: Enter Verification Code</h3>
                    <p className="text-[var(--color-text-secondary)] mb-4">
                      Enter the 6-digit code from your authenticator app:
                    </p>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSetupStep('check');
                        setQrCode(null);
                        setSecret(null);
                        setVerificationCode('');
                        setError('');
                      }}
                      className="px-6 py-3 border border-[var(--color-border-primary)] text-[var(--color-text-primary)] font-medium rounded-lg hover:bg-[var(--color-background-secondary)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || verificationCode.length !== 6}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Verifying...' : 'Verify and Enable'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Enabled */}
            {setupStep === 'complete' && twoFactorStatus?.isEnabled && (
              <div>
                <div className="mb-6 bg-[var(--color-status-success-tint)] border border-[var(--color-status-success-tint)] rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-[var(--color-status-success)] mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-[var(--color-status-success)] mb-1">Two-Factor Authentication is Active</h3>
                      <p className="text-[var(--color-status-success)] text-sm">
                        Your account is protected with 2FA. You&apos;ll need to enter a code from your authenticator app when logging in.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-md font-semibold text-[var(--color-text-primary)] mb-2">Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-[var(--color-border-tertiary)]">
                      <span className="text-[var(--color-text-secondary)]">Enabled on:</span>
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {new Date(twoFactorStatus.enabledAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[var(--color-border-tertiary)]">
                      <span className="text-[var(--color-text-secondary)]">Last verified:</span>
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {twoFactorStatus.lastVerifiedAt 
                          ? new Date(twoFactorStatus.lastVerifiedAt).toLocaleString()
                          : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--color-status-warning-tint)] border border-[var(--color-status-warning-tint)] rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-[var(--color-status-warning)] mb-2">⚠️ Important</h4>
                  <p className="text-[var(--color-status-warning)] text-sm">
                    If you lose access to your authenticator app, you won&apos;t be able to log in. 
                    Make sure to keep backup codes in a safe place or contact support if you lose access.
                  </p>
                </div>

                <button
                  onClick={handleDisable2FA}
                  disabled={loading}
                  className="px-6 py-3 border border-[var(--color-status-danger)] text-[var(--color-status-danger)] font-medium rounded-lg hover:bg-[var(--color-status-danger-tint)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Disabling...' : 'Disable Two-Factor Authentication'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">🛡️ Security Tips</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Use a strong, unique password for your account</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Never share your 2FA codes with anyone</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Keep your authenticator app updated</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Log out from shared or public devices</span>
            </li>
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
