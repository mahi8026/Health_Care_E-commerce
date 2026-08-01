"use client";

import { FaCheckCircle, FaClock, FaTimesCircle, FaShieldAlt } from 'react-icons/fa';

/**
 * B2B Status Card Component
 * Shows B2B approval status and pricing eligibility in user account
 */
export default function B2BStatusCard({ user }) {
  // Only show for B2B users
  if (!user?.b2bAccount && user?.b2bApprovalStatus !== 'pending') {
    return null;
  }

  const status = user.b2bApprovalStatus || 'pending';
  
  // Status configuration
  const statusConfig = {
    pending: {
      icon: FaClock,
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700',
      iconColor: 'text-orange-500',
      title: 'B2B Application Pending',
      message: 'Your B2B application is under review. We&apos;ll notify you once it&apos;s approved.',
    },
    approved: {
      icon: FaCheckCircle,
      color: 'green',
      bgColor: 'bg-[var(--color-status-success-tint)]',
      borderColor: 'border-[var(--color-status-success-tint)]',
      textColor: 'text-[var(--color-status-success)]',
      iconColor: 'text-[var(--color-status-success)]',
      title: 'B2B Account Approved',
      message: user.b2bDiscountEnabled 
        ? 'You are eligible for B2B pricing on all products!'
        : 'Your account is approved. B2B pricing will be enabled by our team soon.',
    },
    rejected: {
      icon: FaTimesCircle,
      color: 'red',
      bgColor: 'bg-[var(--color-status-danger-tint)]',
      borderColor: 'border-[var(--color-status-danger-tint)]',
      textColor: 'text-[var(--color-status-danger)]',
      iconColor: 'text-[var(--color-status-danger)]',
      title: 'B2B Application Rejected',
      message: user.b2bRejectionReason || 'Your B2B application was not approved. Please contact support for more information.',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-xl p-6 mb-6`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon className={config.iconColor} size={24} />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${config.textColor} mb-2`}>
            {config.title}
          </h3>
          <p className="text-[var(--color-text-primary)] text-sm mb-4">
            {config.message}
          </p>

          {/* Additional Information */}
          {status === 'approved' && (
            <div className="space-y-2">
              {/* Company Info */}
              {user.companyName && (
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="font-semibold">Company:</span>
                  <span>{user.companyName}</span>
                </div>
              )}

              {/* B2B ID */}
              {user.b2bId && (
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="font-semibold">B2B ID:</span>
                  <span className="font-mono bg-white px-2 py-1 rounded">{user.b2bId}</span>
                </div>
              )}

              {/* Approval Date */}
              {user.b2bApprovedAt && (
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="font-semibold">Approved on:</span>
                  <span>{new Date(user.b2bApprovedAt).toLocaleDateString('en-GB')}</span>
                </div>
              )}

              {/* Pricing Status Badge */}
              {user.b2bDiscountEnabled && (
                <div className="mt-4 inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold">
                  <FaShieldAlt />
                  <span>B2B Pricing Active</span>
                </div>
              )}
            </div>
          )}

          {/* Pending Actions */}
          {status === 'pending' && (
            <div className="mt-4 text-sm text-[var(--color-text-secondary)]">
              <p className="font-semibold mb-1">What happens next?</p>
              <ul className="list-disc list-inside space-y-1 text-[var(--color-text-secondary)]">
                <li>We&apos;ll verify your business documents</li>
                <li>Approval typically takes 1-2 business days</li>
                <li>You&apos;ll receive an email notification</li>
                <li>Once approved, you&apos;ll see B2B prices on all products</li>
              </ul>
            </div>
          )}

          {/* Rejected - Contact Support */}
          {status === 'rejected' && (
            <div className="mt-4">
              <a
                href={`https://wa.me/+8801800000000?text=${encodeURIComponent('Hi, I need help with my B2B application rejection.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[var(--color-status-success-tint)] hover:bg-success text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <FaShieldAlt />
                <span>Contact Support on WhatsApp</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
