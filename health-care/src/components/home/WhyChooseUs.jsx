'use client';

import { 
  FaCheckCircle,
  FaTruck,
  FaTools,
  FaPhoneAlt,
  FaCreditCard,
  FaUndo,
} from 'react-icons/fa';

/**
 * WhyChooseUs Component
 * 
 * Displays key value propositions and trust signals.
 * Content is dynamically generated from site settings.
 * 
 * @param {Object} settings - Site settings for dynamic content
 */
export default function WhyChooseUs({ settings }) {
  const features = buildFeatures(settings);

  return (
    <section className="py-16 bg-gradient-to-br from-[var(--color-background-secondary)] to-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-[var(--color-text-primary)] mb-3">
            Why Choose MediportBD?
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Your trusted partner for medical equipment in Bangladesh
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-[var(--color-border-tertiary)]"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-teal-tint flex items-center justify-center text-brand-teal text-xl">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--color-text-primary)] mb-2 text-lg">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Build features array from settings
 */
function buildFeatures(settings) {
  const threshold = settings?.freeDeliveryThreshold
    ? `৳${(settings.freeDeliveryThreshold / 1000).toFixed(0)}K`
    : '৳50K';
  const returnDays = settings?.returnPolicyDays ?? 30;
  const supportHours = settings?.supportHours ?? '24/7';
  const certifications = settings?.certifications?.join(', ') || 'DGDA Registered';

  return [
    { 
      icon: <FaCheckCircle />, 
      title: certifications.split(',')[0]?.trim() || 'DGDA Registered', 
      desc: 'All products are DGDA-cleared and meet Bangladesh regulatory standards.' 
    },
    { 
      icon: <FaTruck />, 
      title: 'Fast Delivery', 
      desc: `Same-day dispatch for orders before 12 PM. Free delivery in Dhaka metro over ${threshold}.` 
    },
    { 
      icon: <FaTools />, 
      title: 'Free Installation', 
      desc: 'Professional installation and staff training included for all equipment.' 
    },
    { 
      icon: <FaPhoneAlt />, 
      title: `${supportHours} Support`, 
      desc: 'Dedicated technical support team available round the clock.' 
    },
    { 
      icon: <FaCreditCard />, 
      title: 'Flexible Payment', 
      desc: 'Bank transfer, bKash, Nagad, and B2B credit terms available.' 
    },
    { 
      icon: <FaUndo />, 
      title: `${returnDays}-Day Returns`, 
      desc: `Hassle-free returns and replacement policy on all products within ${returnDays} days.` 
    },
  ];
}
