"use client";

import { useState } from 'react';
import Spinner, { ButtonLoader, ProductCardSkeleton, LoadingOverlay } from './Spinner';

export default function LoadingDemo() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayVariant, setOverlayVariant] = useState('medical');

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-semibold text-[var(--color-text-primary)] mb-3 font-[family-name:var(--font-lora)]">
          ⚕️ Medical Loading Components
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          Attractive, professional loading states for healthcare e-commerce
        </p>
      </div>

      {/* Loading Overlay Demo */}
      {showOverlay && (
        <LoadingOverlay 
          message="Processing your medical supplies order..." 
          variant={overlayVariant}
        />
      )}

      {/* Spinner Variants */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-[var(--color-text-primary)] font-[family-name:var(--font-lora)]">
          Spinner Variants
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Medical Cross */}
          <div className="bg-gradient-to-br from-white to-[var(--color-background-secondary)] rounded-2xl p-8 shadow-lg border-2 border-brand-teal/20 text-center hover:shadow-lg transition-shadow">
            <Spinner size="xl" variant="medical" />
            <h3 className="mt-6 font-semibold text-[var(--color-text-primary)] mb-1">Medical Cross</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">Pulsing healthcare icon</p>
            <code className="mt-3 text-xs bg-[var(--color-background-tertiary)] px-3 py-1 rounded inline-block">
              variant=&quot;medical&quot;
            </code>
          </div>

          {/* Heartbeat */}
          <div className="bg-gradient-to-br from-white to-[var(--color-background-secondary)] rounded-2xl p-8 shadow-lg border-2 border-brand-teal/20 text-center hover:shadow-lg transition-shadow">
            <Spinner size="xl" variant="heartbeat" />
            <h3 className="mt-6 font-semibold text-[var(--color-text-primary)] mb-1">Heartbeat ECG</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">Animated pulse bars</p>
            <code className="mt-3 text-xs bg-[var(--color-background-tertiary)] px-3 py-1 rounded inline-block">
              variant=&quot;heartbeat&quot;
            </code>
          </div>

          {/* DNA Helix */}
          <div className="bg-gradient-to-br from-white to-[var(--color-background-secondary)] rounded-2xl p-8 shadow-lg border-2 border-brand-teal/20 text-center hover:shadow-lg transition-shadow">
            <Spinner size="xl" variant="dna" />
            <h3 className="mt-6 font-semibold text-[var(--color-text-primary)] mb-1">DNA Helix</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">Rotating strands</p>
            <code className="mt-3 text-xs bg-[var(--color-background-tertiary)] px-3 py-1 rounded inline-block">
              variant=&quot;dna&quot;
            </code>
          </div>

          {/* Pills */}
          <div className="bg-gradient-to-br from-white to-[var(--color-background-secondary)] rounded-2xl p-8 shadow-lg border-2 border-brand-teal/20 text-center hover:shadow-lg transition-shadow">
            <Spinner size="xl" variant="pills" />
            <h3 className="mt-6 font-semibold text-[var(--color-text-primary)] mb-1">Pills</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">Rotating capsule</p>
            <code className="mt-3 text-xs bg-[var(--color-background-tertiary)] px-3 py-1 rounded inline-block">
              variant=&quot;pills&quot;
            </code>
          </div>

          {/* Dots - NEW */}
          <div className="bg-gradient-to-br from-white to-[var(--color-background-secondary)] rounded-2xl p-8 shadow-lg border-2 border-brand-teal/20 text-center hover:shadow-lg transition-shadow">
            <Spinner size="xl" variant="dots" />
            <h3 className="mt-6 font-semibold text-[var(--color-text-primary)] mb-1">Pulsing Dots</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">Bouncing gradient</p>
            <code className="mt-3 text-xs bg-[var(--color-background-tertiary)] px-3 py-1 rounded inline-block">
              variant=&quot;dots&quot;
            </code>
          </div>
        </div>
      </section>

      {/* Size Variants */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-[var(--color-text-primary)] font-[family-name:var(--font-lora)]">
          Size Options
        </h2>
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-[var(--color-border-tertiary)]">
          <div className="flex items-center justify-around gap-8">
            <div className="text-center">
              <Spinner size="sm" variant="medical" />
              <p className="mt-3 text-sm font-medium text-[var(--color-text-secondary)]">Small</p>
              <code className="text-xs bg-[var(--color-background-tertiary)] px-2 py-1 rounded mt-1 inline-block">sm</code>
            </div>
            <div className="text-center">
              <Spinner size="md" variant="medical" />
              <p className="mt-3 text-sm font-medium text-[var(--color-text-secondary)]">Medium</p>
              <code className="text-xs bg-[var(--color-background-tertiary)] px-2 py-1 rounded mt-1 inline-block">md</code>
            </div>
            <div className="text-center">
              <Spinner size="lg" variant="medical" />
              <p className="mt-3 text-sm font-medium text-[var(--color-text-secondary)]">Large</p>
              <code className="text-xs bg-[var(--color-background-tertiary)] px-2 py-1 rounded mt-1 inline-block">lg</code>
            </div>
            <div className="text-center">
              <Spinner size="xl" variant="medical" />
              <p className="mt-3 text-sm font-medium text-[var(--color-text-secondary)]">Extra Large</p>
              <code className="text-xs bg-[var(--color-background-tertiary)] px-2 py-1 rounded mt-1 inline-block">xl</code>
            </div>
          </div>
        </div>
      </section>

      {/* Button Loader */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-[var(--color-text-primary)] font-[family-name:var(--font-lora)]">
          Button Loading States
        </h2>
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-[var(--color-border-tertiary)]">
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-brand-teal text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-[var(--color-brand-teal-hover)] transition-colors">
              <ButtonLoader />
              Processing Order...
            </button>
            <button className="px-6 py-3 bg-brand-navy text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-[var(--color-brand-navy-hover)] transition-colors">
              <ButtonLoader />
              Signing In...
            </button>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors">
              <ButtonLoader />
              Loading Data...
            </button>
            <button className="px-6 py-3 border-2 border-brand-teal text-brand-teal rounded-xl font-semibold flex items-center gap-2 hover:bg-brand-teal hover:text-white transition-colors">
              <ButtonLoader className="text-brand-teal" />
              Downloading...
            </button>
          </div>
        </div>
      </section>

      {/* Product Card Skeletons */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-[var(--color-text-primary)] font-[family-name:var(--font-lora)]">
          Product Card Skeleton
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
        <p className="mt-4 text-sm text-[var(--color-text-secondary)] text-center">
          ✨ Features gradient shimmer animation for smooth loading feel
        </p>
      </section>

      {/* Loading Overlay Demo */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-[var(--color-text-primary)] font-[family-name:var(--font-lora)]">
          Full Screen Overlay
        </h2>
        <div className="bg-gradient-to-br from-[var(--color-background-secondary)] to-white rounded-2xl p-8 shadow-lg border-2 border-[var(--color-border-primary)]">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {['medical', 'heartbeat', 'dna', 'pills', 'dots'].map((variant) => (
              <button
                key={variant}
                onClick={() => {
                  setOverlayVariant(variant);
                  setShowOverlay(true);
                  setTimeout(() => setShowOverlay(false), 3000);
                }}
                className="px-4 py-3 bg-gradient-to-r from-brand-teal to-[var(--color-brand-teal-hover)] text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all capitalize"
              >
                Show {variant}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-[var(--color-text-secondary)] text-center">
            Click any button to see the full-screen loading overlay (auto-closes in 3s)
          </p>
        </div>
      </section>

      {/* Usage Examples */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-[var(--color-text-primary)] font-[family-name:var(--font-lora)]">
          Usage Examples
        </h2>
        <div className="bg-gradient-to-br from-[var(--color-brand-navy)] to-[var(--color-brand-navy)] rounded-2xl p-8 shadow-lg text-white">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-brand-teal mb-2">Basic Spinner</h3>
              <pre className="bg-black/30 rounded-lg p-4 text-sm overflow-x-auto">
{`import Spinner from '@/components/ui/Spinner';

<Spinner size="lg" variant="medical" />`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-brand-teal mb-2">Button Loading</h3>
              <pre className="bg-black/30 rounded-lg p-4 text-sm overflow-x-auto">
{`import { ButtonLoader } from '@/components/ui/Spinner';

<button disabled={loading}>
  {loading ? (
    <>
      <ButtonLoader />
      Processing...
    </>
  ) : 'Submit'}
</button>`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-brand-teal mb-2">Product Grid Loading</h3>
              <pre className="bg-black/30 rounded-lg p-4 text-sm overflow-x-auto">
{`import { ProductCardSkeleton } from '@/components/ui/Spinner';

{loading ? (
  <div className="grid grid-cols-4 gap-4">
    {[...Array(8)].map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
) : (
  // Actual products
)}`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-brand-teal mb-2">Full Screen Overlay</h3>
              <pre className="bg-black/30 rounded-lg p-4 text-sm overflow-x-auto">
{`import { LoadingOverlay } from '@/components/ui/Spinner';

{isProcessing && (
  <LoadingOverlay 
    message="Processing your order..." 
    variant="medical"
  />
)}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl font-semibold mb-6 text-[var(--color-text-primary)] font-[family-name:var(--font-lora)]">
          ✨ Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-brand-teal-tint to-brand-teal-tint rounded-xl p-6 border border-brand-teal-tint">
            <div className="text-2xl mb-2">🎨</div>
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Brand Colors</h3>
            <p className="text-sm text-[var(--color-text-primary)]">
              Uses MediportBD brand colors (var(--color-brand-teal) teal, var(--color-brand-navy) navy) for consistent design
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Smooth Animations</h3>
            <p className="text-sm text-[var(--color-text-primary)]">
              Cubic bezier timing curves and optimized keyframes for professional feel
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="text-2xl mb-2">🏥</div>
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Medical Themed</h3>
            <p className="text-sm text-[var(--color-text-primary)]">
              Healthcare-specific variants (medical cross, ECG, DNA) reinforce brand identity
            </p>
          </div>
          <div className="bg-gradient-to-br from-[var(--color-status-success-tint)] to-[var(--color-status-success-tint)] rounded-xl p-6 border border-[var(--color-status-success-tint)]">
            <div className="text-2xl mb-2">📱</div>
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Responsive</h3>
            <p className="text-sm text-[var(--color-text-primary)]">
              All loaders scale perfectly on mobile, tablet, and desktop viewports
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
