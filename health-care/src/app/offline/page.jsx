'use client';

import Link from 'next/link';
import { FiWifiOff, FiHome, FiShoppingBag, FiRefreshCw } from 'react-icons/fi';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-200 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <FiWifiOff className="relative text-blue-600 text-8xl" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          You&apos;re Offline
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          No internet connection detected. Some features may not be available until you reconnect.
        </p>

        {/* Cached Content Notice */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 text-sm text-gray-700">
          <p className="font-medium mb-2">📦 Cached Content Available</p>
          <p className="text-xs text-gray-600">
            You can still browse recently viewed pages and products. They&apos;ll sync once you&apos;re back online.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            <FiRefreshCw className="text-lg" />
            Try Again
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-200 transition-colors"
          >
            <FiHome className="text-lg" />
            Go to Homepage
          </Link>

          <Link
            href="/products"
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-200 transition-colors"
          >
            <FiShoppingBag className="text-lg" />
            Browse Products
          </Link>
        </div>

        {/* Offline Tips */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-3">💡 Offline Tips:</p>
          <ul className="text-xs text-gray-600 space-y-1.5 text-left">
            <li>• Check your WiFi or mobile data connection</li>
            <li>• Toggle airplane mode off</li>
            <li>• Move to an area with better signal</li>
            <li>• Contact your network provider if issues persist</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
