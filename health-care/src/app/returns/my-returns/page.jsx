'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
};

const STATUS_ICONS = {
  pending: '⏳',
  approved: '✅',
  rejected: '❌',
  refunded: '💰',
  cancelled: '🚫',
};

export default function MyReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const token = localStorage.getItem('medcore_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${API}/returns/my-returns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReturns(data.data);
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReturns = filter === 'all' 
    ? returns 
    : returns.filter(r => r.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B2545] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your returns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0B2545] mb-2">My Return Requests</h1>
          <p className="text-gray-600">Track and manage your product return requests</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 p-2 mb-6 flex gap-2 overflow-x-auto">
          {['all', 'pending', 'approved', 'rejected', 'refunded'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-[#0E8A6E] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-2 text-xs">
                  ({returns.filter(r => r.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Returns List */}
        {filteredReturns.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-[#0B2545] mb-2">
              {filter === 'all' ? 'No return requests yet' : `No ${filter} returns`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'When you request a return, it will appear here'
                : `You don't have any ${filter} return requests`
              }
            </p>
            <Link 
              href="/orders"
              className="inline-block px-6 py-3 bg-[#0E8A6E] text-white rounded-lg font-medium hover:bg-[#0c7359] transition-colors"
            >
              View Orders
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReturns.map(returnRequest => (
              <div key={returnRequest._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg text-[#0B2545]">
                        Order #{returnRequest.order?.orderNumber}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[returnRequest.status]}`}>
                        {STATUS_ICONS[returnRequest.status]} {returnRequest.status.charAt(0).toUpperCase() + returnRequest.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Requested on {new Date(returnRequest.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Refund Amount</p>
                    <p className="text-xl font-semibold text-[#0E8A6E]">
                      ৳{returnRequest.refundAmount?.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Products */}
                <div className="border-t border-b py-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {returnRequest.products?.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <img 
                          src={item.product?.images?.[0]?.url || '/placeholder.png'} 
                          alt={item.product?.name}
                          className="w-16 h-16 object-cover rounded-lg border"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-[#0B2545] truncate">
                            {item.product?.name}
                          </h4>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {returnRequest.products?.length > 2 && (
                    <p className="text-sm text-gray-600 mt-2">
                      +{returnRequest.products.length - 2} more item(s)
                    </p>
                  )}
                </div>

                {/* Reason */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                  <p className="text-sm text-gray-600">
                    {returnRequest.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Description:</p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {returnRequest.description}
                  </p>
                </div>

                {/* Admin Notes */}
                {returnRequest.adminNotes && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Admin Response:</p>
                    <p className="text-sm text-gray-600">{returnRequest.adminNotes}</p>
                  </div>
                )}

                {/* Status Timeline */}
                {returnRequest.status !== 'pending' && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
                    <div className="flex items-center gap-2 text-sm">
                      {returnRequest.approvedAt && (
                        <span className="text-gray-700">
                          ✓ Reviewed on {new Date(returnRequest.approvedAt).toLocaleDateString()}
                        </span>
                      )}
                      {returnRequest.refundedAt && (
                        <span className="text-gray-700">
                          • Refunded on {new Date(returnRequest.refundedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Return ID: {returnRequest._id.slice(-8).toUpperCase()}
                  </div>
                  <Link 
                    href={`/returns/${returnRequest._id}`}
                    className="text-[#0E8A6E] hover:text-[#0c7359] font-medium text-sm flex items-center gap-1"
                  >
                    View Details
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-[#0B2545] mb-3">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700 mb-1">📧 Email Support</p>
              <a href="mailto:support@medcorebd.com" className="text-[#0E8A6E] hover:underline">
                support@medcorebd.com
              </a>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">📞 Phone Support</p>
              <a href="tel:+8801234567890" className="text-[#0E8A6E] hover:underline">
                +880 1234-567890
              </a>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">⏰ Business Hours</p>
              <p className="text-gray-600">Sun-Thu: 9 AM - 6 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
