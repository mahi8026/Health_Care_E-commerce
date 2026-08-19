'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowRight, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { API } from '@/constants/api';

export default function B2BPendingAlert() {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingB2B = async () => {
      try {
        const token = localStorage.getItem('Mediport_token');
        const res = await fetch(`${API}/admin/b2b/users?status=pending&limit=1`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (data.success && data.pagination) {
          setPendingCount(data.pagination.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch pending B2B count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingB2B();
  }, []);

  if (loading || pendingCount === 0) {
    return null;
  }

  return (
    <div className="mb-6 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl flex-shrink-0 shadow-md">
              🛡️
            </div>
            <div>
              <h3 className="text-white font-bold text-xl mb-1">
                {pendingCount} B2B Application{pendingCount > 1 ? 's' : ''} Awaiting Review
              </h3>
              <p className="text-purple-100 text-sm mb-3">
                New business customers are waiting for approval to access B2B pricing and credit terms
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                  <FaCheckCircle className="text-green-300" />
                  <span className="text-xs text-white font-medium">Approve for B2B access</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                  <FaTimesCircle className="text-red-300" />
                  <span className="text-xs text-white font-medium">Reject with reason</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/admin/b2b')}
            className="flex-shrink-0 px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-purple-50 font-semibold shadow-md transition-all hover:shadow-xl hover:scale-105 flex items-center gap-2 group"
          >
            Review Applications
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
      
      {/* Animated Progress Bar */}
      <div className="h-1 bg-purple-800">
        <div 
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 animate-pulse"
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}
