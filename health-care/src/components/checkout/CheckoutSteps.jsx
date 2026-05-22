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
      className="bg-white rounded-2xl border border-[#E5E7EB] px-4 py-4 sm:px-6 mb-4"
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    done
                      ? 'bg-[#0E8A6E] text-white'
                      : active
                      ? 'bg-[#0B2545] text-white'
                      : 'bg-[#F3F4F6] text-[#9CA3AF]'
                  }`}
                >
                  {done ? <FaCheck size={12} /> : step.num}
                </span>
                <span
                  className={`text-xs font-semibold whitespace-nowrap ${
                    active ? 'text-[#0B2545]' : done ? 'text-[#0E8A6E]' : 'text-[#9CA3AF]'
                  }`}
                >
                  {step.label}
                  {step.num === 1 && itemCount > 0 && (
                    <span className="font-normal text-[#9CA3AF] hidden sm:inline">
                      {' '}
                      ({itemCount})
                    </span>
                  )}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-2 sm:mx-4 min-w-[12px] ${
                    step.num < currentStep ? 'bg-[#0E8A6E]' : 'bg-[#E5E7EB]'
                  }`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
      {STEPS[0].href && currentStep > 1 && (
        <p className="text-[11px] text-[#6B7280] mt-3 mb-0 sm:hidden">
          <Link href="/cart" className="text-[#0E8A6E] font-medium hover:underline">
            ← Edit cart
          </Link>
        </p>
      )}
    </nav>
  );
}
