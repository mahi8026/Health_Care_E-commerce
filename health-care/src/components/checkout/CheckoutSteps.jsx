'use client';

import Link from 'next/link';
import { FaCheck } from 'react-icons/fa';

const STEPS = [
  { num: 1, label: 'Cart', href: '/cart' },
  { num: 2, label: 'Delivery' },
  { num: 3, label: 'Payment' },
  { num: 4, label: 'Confirm' },
];

export default function CheckoutSteps({ currentStep = 2, itemCount = 0 }) {
  return (
    <nav
      aria-label="Checkout progress"
      className="bg-white rounded-2xl border border-[var(--color-border-primary)] px-4 py-3 sm:px-6 mb-3"
    >
      <ol className="flex items-center m-0 p-0 list-none">
        {STEPS.map((step, idx) => {
          const done = step.num < currentStep;
          const active = step.num === currentStep;

          return (
            <li
              key={step.num}
              className={`flex items-center ${idx < STEPS.length - 1 ? 'flex-1' : ''}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    done
                      ? 'bg-brand-teal text-white'
                      : active
                      ? 'bg-brand-navy text-white'
                      : 'bg-[var(--color-background-tertiary)] text-[var(--color-text-tertiary)]'
                  }`}
                >
                  {done ? <FaCheck size={12} /> : step.num}
                </span>
                <span
                  className={`text-xs font-semibold whitespace-nowrap ${
                    active ? 'text-brand-navy' : done ? 'text-brand-teal' : 'text-[var(--color-text-tertiary)]'
                  }`}
                >
                  {step.label}
                  {step.num === 1 && itemCount > 0 && (
                    <span className="font-normal text-[var(--color-text-tertiary)] hidden sm:inline">
                      {' '}
                      ({itemCount})
                    </span>
                  )}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-2 sm:mx-4 min-w-[12px] ${
                    step.num < currentStep ? 'bg-brand-teal' : 'bg-[var(--color-background-muted)]'
                  }`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
      {STEPS[0].href && currentStep > 1 && (
        <p className="text-xs text-[var(--color-text-secondary)] mt-3 mb-0 sm:hidden">
          <Link href="/cart" className="text-brand-teal font-medium hover:underline">
            ← Edit cart
          </Link>
        </p>
      )}
    </nav>
  );
}
