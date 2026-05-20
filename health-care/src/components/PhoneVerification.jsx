'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function PhoneVerification({ onVerified }) {
  const { user, refreshUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [canResend, setCanResend] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputRefs = useRef([]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [resendCountdown, canResend]);

  const handleSendOTP = async () => {
    try {
      setSending(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('medcore_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-phone-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setShowModal(true);
        setCanResend(false);
        setResendCountdown(60); // 60 second cooldown
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.error('Send OTP error:', error);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleOTPChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp([...newOtp, ...Array(6 - newOtp.length).fill('')]);
      
      // Focus last filled input or first empty
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    try {
      setLoading(true);
      setError('');

      const otpString = otp.join('');
      
      if (otpString.length !== 6) {
        setError('Please enter all 6 digits');
        return;
      }

      const token = localStorage.getItem('medcore_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-phone-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp: otpString })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Phone verified successfully!');
        setTimeout(() => {
          setShowModal(false);
          if (refreshUser) refreshUser();
          if (onVerified) onVerified();
        }, 1500);
      } else {
        setError(data.message || 'Invalid OTP');
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }
        // Clear OTP inputs on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.error('Verify OTP error:', error);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.phoneVerified) {
    return null;
  }

  if (!user.phone) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-yellow-600 text-xl mr-3">⚠️</span>
          <div>
            <h3 className="font-semibold text-yellow-900">Phone Number Required</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Please add a phone number to your profile to enable phone verification.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <span className="text-orange-600 text-xl mr-3">⚠️</span>
            <div>
              <h3 className="font-semibold text-orange-900">Phone Not Verified</h3>
              <p className="text-sm text-orange-700 mt-1">
                Verify your phone number to receive order updates via SMS.
              </p>
            </div>
          </div>
          <button
            onClick={handleSendOTP}
            disabled={sending}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {sending ? 'Sending...' : 'Verify Now'}
          </button>
        </div>
        
        {error && (
          <div className="mt-3 text-sm text-red-600">
            {error}
          </div>
        )}
        
        {success && !showModal && (
          <div className="mt-3 text-sm text-green-600">
            {success}
          </div>
        )}
      </div>

      {/* OTP Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Verify Phone Number</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Enter the 6-digit code sent to your phone
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* OTP Input */}
            <div className="flex justify-center gap-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
                {attemptsRemaining > 0 && attemptsRemaining < 5 && (
                  <p className="text-xs text-red-500 mt-1">
                    {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining
                  </p>
                )}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.join('').length !== 6}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="mt-4 text-center">
              <button
                onClick={handleSendOTP}
                disabled={!canResend || sending}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {!canResend ? `Resend OTP in ${resendCountdown}s` : sending ? 'Sending...' : 'Resend OTP'}
              </button>
            </div>

            <p className="mt-4 text-xs text-gray-500 text-center">
              OTP is valid for 5 minutes. Maximum 3 requests per hour.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
