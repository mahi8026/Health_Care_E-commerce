'use client';

import { FaSearch, FaShoppingCart, FaCreditCard, FaTruck } from 'react-icons/fa';

/**
 * HowItWorks Component
 * 
 * Displays the purchasing process in 4 simple steps.
 * Uses a clean, numbered step design with icons.
 */
export default function HowItWorks() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            How It Works
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Purchase medical equipment in 4 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step, index) => (
            <div key={index} className="relative text-center">
              {/* Connecting line (not on last step) */}
              {index < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-teal-500 to-teal-300" />
              )}

              {/* Step number badge */}
              <div className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg">
                {step.step}
              </div>

              {/* Icon */}
              <div className="text-4xl text-teal-600 mb-3 flex justify-center">
                {step.icon}
              </div>

              {/* Title & Description */}
              <h3 className="font-bold text-gray-900 mb-2 text-lg">
                {step.title}
              </h3>
              <p className="text-sm text-gray-600">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Process steps
 */
const STEPS = [
  { 
    step: 1, 
    icon: <FaSearch />, 
    title: 'Browse & Search', 
    desc: 'Find products from 50+ global brands' 
  },
  { 
    step: 2, 
    icon: <FaShoppingCart />, 
    title: 'Add to Cart', 
    desc: 'Get instant quotes and bulk pricing' 
  },
  { 
    step: 3, 
    icon: <FaCreditCard />, 
    title: 'Secure Checkout', 
    desc: 'Multiple payment options available' 
  },
  { 
    step: 4, 
    icon: <FaTruck />, 
    title: 'Fast Delivery', 
    desc: 'Free installation & training included' 
  },
];
