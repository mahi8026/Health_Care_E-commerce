'use client';
import { showToast } from '@/components/ui/Toast';
import { confirmAction } from '@/components/ui/ConfirmDialog';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { API } from '@/constants/api';

const STATUS_COLORS = {
  pending: 'bg-[var(--color-status-warning-tint)] text-warning-ink border-[var(--color-status-warning-tint)]',
  approved: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)] border-[var(--color-status-success-tint)]',
  rejected: 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] border-[var(--color-status-danger-tint)]',
  refunded: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)] border-[var(--color-border-primary)]',
};

export default function ReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [returnRequest, setReturnRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchReturnDetails = async () => {
    try {
      const token = localStorage.getItem('Mediport_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${API}/returns/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReturnRequest(data.data);
      } else {
        showToast.error(data.message || 'Return request not found');
        router.push('/returns/my-returns');
      }
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error(err);
      showToast.error('Failed to load return details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchReturnDetails();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleCancelReturn = async () => {
    if (!await confirmAction('Are you sure you want to cancel this return request?')) {
      return;
    }

    setCancelling(true);
    try {
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/returns/${params.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        showToast.success('Return request cancelled successfully');
        router.push('/returns/my-returns');
      } else {
        showToast.error(data.message || 'Failed to cancel return request');
      }
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error(err);
      showToast.error('Error cancelling return request');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">Loading return details...</p>
        </div>
      </div>
    );
  }

  if (!returnRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--color-text-secondary)] mb-4">Return request not found</p>
          <Link href="/returns/my-returns" className="text-brand-teal hover:underline">
            View My Returns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to My Returns
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg border border-[var(--color-border-primary)] p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-2">Return Request Details</h1>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Return ID: {returnRequest._id.slice(-8).toUpperCase()}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${STATUS_COLORS[returnRequest.status]}`}>
              {returnRequest.status.charAt(0).toUpperCase() + returnRequest.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">Order Number</p>
              <p className="font-semibold text-brand-navy">#{returnRequest.order?.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">Requested On</p>
              <p className="font-semibold text-brand-navy">
                {new Date(returnRequest.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">Refund Amount</p>
              <p className="font-semibold text-brand-teal">৳{returnRequest.refundAmount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">Refund Method</p>
              <p className="font-semibold text-brand-navy">
                {returnRequest.refundMethod?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Pending'}
              </p>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="bg-white rounded-lg border border-[var(--color-border-primary)] p-6 mb-6">
          <h2 className="font-semibold text-lg text-brand-navy mb-4">Returned Products</h2>
          <div className="space-y-4">
            {returnRequest.products?.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-center pb-4 border-b last:border-b-0 last:pb-0">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <Image 
                    src={item.product?.images?.[0]?.url || '/placeholder.png'} 
                    alt={`${item.product?.name} — Return request #${returnRequest._id?.slice(-6)} — MediportBD Bangladesh`}
                    fill
                    sizes="96px"
                    style={{ objectFit: 'cover' }}
                    className="rounded-lg border"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-brand-navy mb-1">{item.product?.name}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-1">SKU: {item.product?.sku}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-brand-navy">৳{(item.quantity * (item.price || 0)).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Return Details */}
        <div className="bg-white rounded-lg border border-[var(--color-border-primary)] p-6 mb-6">
          <h2 className="font-semibold text-lg text-brand-navy mb-4">Return Information</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Reason for Return</p>
              <p className="text-[var(--color-text-primary)]">
                {returnRequest.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Detailed Description</p>
              <p className="text-[var(--color-text-primary)] whitespace-pre-wrap">{returnRequest.description}</p>
            </div>

            {returnRequest.images && returnRequest.images.length > 0 && (
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Uploaded Images</p>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {returnRequest.images.map((img, idx) => (
                    <a
                      key={idx}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative h-24"
                    >
                      <Image
                        src={img.url}
                        alt={`${returnRequest.products?.[0]?.product?.name || 'Product'} — Return evidence photo ${idx + 1} `}
                        fill
                        sizes="(max-width: 768px) 33vw, 20vw"
                        style={{ objectFit: 'cover' }}
                        className="rounded-lg border hover:opacity-75 transition-opacity cursor-pointer"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Admin Response */}
        {returnRequest.adminNotes && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-6">
            <h2 className="font-semibold text-lg text-brand-navy mb-2 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Admin Response
            </h2>
            <p className="text-[var(--color-text-primary)]">{returnRequest.adminNotes}</p>
            {returnRequest.approvedBy && (
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                Reviewed by: {returnRequest.approvedBy.name}
              </p>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-lg border border-[var(--color-border-primary)] p-6 mb-6">
          <h2 className="font-semibold text-lg text-brand-navy mb-4">Status Timeline</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-brand-teal flex items-center justify-center text-white">
                  ✓
                </div>
                <div className="w-0.5 h-full bg-[var(--color-background-muted)] mt-2"></div>
              </div>
              <div className="flex-1 pb-4">
                <p className="font-medium text-brand-navy">Return Requested</p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {new Date(returnRequest.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {returnRequest.approvedAt && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-brand-teal flex items-center justify-center text-white">
                    ✓
                  </div>
                  {returnRequest.refundedAt && <div className="w-0.5 h-full bg-[var(--color-background-muted)] mt-2"></div>}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium text-brand-navy">
                    {returnRequest.status === 'approved' ? 'Approved' : 'Reviewed'}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {new Date(returnRequest.approvedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {returnRequest.refundedAt && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-brand-teal flex items-center justify-center text-white">
                    ✓
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-brand-navy">Refunded</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {new Date(returnRequest.refundedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {returnRequest.status === 'pending' && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-background-muted)] flex items-center justify-center text-[var(--color-text-secondary)]">
                    ⏳
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[var(--color-text-secondary)]">Under Review</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">We&apos;ll review your request within 24-48 hours</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {returnRequest.status === 'pending' && (
          <div className="bg-white rounded-lg border border-[var(--color-border-primary)] p-6">
            <h2 className="font-semibold text-lg text-brand-navy mb-4">Actions</h2>
            <button
              onClick={handleCancelReturn}
              disabled={cancelling}
              className="px-6 py-3 border border-[var(--color-status-danger)] text-[var(--color-status-danger)] rounded-lg font-medium hover:bg-[var(--color-status-danger-tint)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Return Request'}
            </button>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              You can only cancel pending return requests
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
