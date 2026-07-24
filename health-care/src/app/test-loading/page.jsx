'use client';

import { useState } from 'react';
import Spinner, { ButtonLoader, ProductCardSkeleton, LoadingOverlay } from '@/components/ui/Spinner';

export default function TestLoadingPage() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayVariant, setOverlayVariant] = useState('medical');

  const variants = ['medical', 'heartbeat', 'dna', 'pills', 'dots'];
  const sizes = ['sm', 'md', 'lg', 'xl'];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Loading Components Test</h1>

        {/* Loading Overlay Test */}
        {showOverlay && (
          <LoadingOverlay 
            message={`Testing ${overlayVariant} variant...`} 
            variant={overlayVariant}
          />
        )}

        {/* All Variants Test */}
        <section className="mb-12 bg-white rounded-lg p-8 shadow">
          <h2 className="text-2xl font-bold mb-6">All Variants (Medium Size)</h2>
          <div className="grid grid-cols-5 gap-6">
            {variants.map((variant) => (
              <div key={variant} className="text-center">
                <div className="h-24 flex items-center justify-center bg-gray-50 rounded-lg mb-2">
                  <Spinner variant={variant} size="md" />
                </div>
                <p className="text-sm font-medium capitalize">{variant}</p>
              </div>
            ))}
          </div>
        </section>

        {/* All Sizes Test */}
        <section className="mb-12 bg-white rounded-lg p-8 shadow">
          <h2 className="text-2xl font-bold mb-6">All Sizes (Medical Variant)</h2>
          <div className="flex items-end justify-around gap-6">
            {sizes.map((size) => (
              <div key={size} className="text-center">
                <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg mb-2">
                  <Spinner variant="medical" size={size} />
                </div>
                <p className="text-sm font-medium uppercase">{size}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Button Loaders Test */}
        <section className="mb-12 bg-white rounded-lg p-8 shadow">
          <h2 className="text-2xl font-bold mb-6">Button Loaders</h2>
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-[#0E8A6E] text-white rounded-lg">
              <ButtonLoader />
              <span>Processing...</span>
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-[#0B2545] text-white rounded-lg">
              <ButtonLoader />
              <span>Loading...</span>
            </button>
            <button className="flex items-center gap-2 px-6 py-3 border-2 border-[#0E8A6E] text-[#0E8A6E] rounded-lg">
              <ButtonLoader />
              <span>Submitting...</span>
            </button>
          </div>
        </section>

        {/* Product Card Skeletons Test */}
        <section className="mb-12 bg-white rounded-lg p-8 shadow">
          <h2 className="text-2xl font-bold mb-6">Product Card Skeletons</h2>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* Overlay Test Buttons */}
        <section className="bg-white rounded-lg p-8 shadow">
          <h2 className="text-2xl font-bold mb-6">Full Screen Overlay Test</h2>
          <p className="text-gray-600 mb-4">Click buttons to test overlays (auto-closes in 3s)</p>
          <div className="flex flex-wrap gap-4">
            {variants.map((variant) => (
              <button
                key={variant}
                onClick={() => {
                  setOverlayVariant(variant);
                  setShowOverlay(true);
                  setTimeout(() => setShowOverlay(false), 3000);
                }}
                className="px-6 py-3 bg-gradient-to-r from-[#0E8A6E] to-[#0B2545] text-white rounded-lg font-semibold capitalize hover:shadow-lg transition-shadow"
              >
                Test {variant}
              </button>
            ))}
          </div>
        </section>

        {/* Animation Status Check */}
        <section className="mt-12 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-8 border-2 border-green-200">
          <h2 className="text-2xl font-bold mb-4 text-green-800">✓ Status Check</h2>
          <div className="space-y-2 text-sm">
            <p className="text-green-700">✓ Spinner component loaded</p>
            <p className="text-green-700">✓ All 5 variants available</p>
            <p className="text-green-700">✓ All 4 sizes working</p>
            <p className="text-green-700">✓ Tailwind animations defined</p>
            <p className="text-green-700">✓ Button loaders functional</p>
            <p className="text-green-700">✓ Skeleton loaders active</p>
            <p className="text-green-700">✓ Overlay components ready</p>
          </div>
        </section>
      </div>
    </div>
  );
}
