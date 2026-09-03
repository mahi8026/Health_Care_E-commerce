// health-care/src/components/product/WhatsAppOrderButton.jsx
'use client';

import { FaWhatsapp } from 'react-icons/fa';
import { CONTACT } from '@/constants/api';
import GA4Tracker from '@/services/GA4Tracker';
import MetaPixelTracker from '@/services/MetaPixelTracker';

/**
 * WhatsAppOrderButton — "Order on WhatsApp" CTA for product pages.
 *
 * In Bangladesh, a large share of medical-equipment purchases happen via
 * WhatsApp instead of the cart/checkout funnel. This button opens a chat with
 * a pre-filled, structured order message (product, SKU, price, qty, size) so
 * the customer only adds delivery details and hits send.
 *
 * Also fires `whatsapp_order_click` in GA4 + Meta so it can be measured and
 * retargeted as a high-intent event.
 */
export default function WhatsAppOrderButton({
  product,
  quantity = 1,
  size = null,
  variant = 'primary',
  className = '',
  label = 'Order on WhatsApp',
}) {
  const price = product?.price || 0;

  const buildMessage = () => {
    const lines = [
      'Hi MediportBD! I\u2019d like to place an order:',
      '',
      `\u{1F4E6} Product: ${product?.name || ''}`,
    ];
    if (product?.sku) lines.push(`\u{1F516} SKU: ${product.sku}`);
    if (price > 0) lines.push(`\u{1F4B0} Price: \u09F3${Number(price).toLocaleString()}`);
    lines.push(`\u{1F522} Qty: ${quantity}`);
    if (size?.name) lines.push(`\u{1F4D0} Size: ${size.name}`);
    lines.push(
      '',
      'My delivery details:',
      'Name:',
      'Delivery address:',
      'Phone:',
    );
    return lines.join('\n');
  };

  const handleClick = () => {
    const url = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(buildMessage())}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    // Track high-intent WhatsApp order click (GA4 + Meta Pixel mirror).
    GA4Tracker.trackEvent('whatsapp_order_click', {
      product_id: product?._id || product?.id,
      product_name: product?.name,
      value: price * quantity,
      quantity,
      currency: 'BDT',
    });
    MetaPixelTracker.trackCustomEvent('WhatsAppOrderClick', {
      content_ids: [product?._id || product?.id || product?.sku],
      value: price * quantity,
      currency: 'BDT',
    });
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className={`w-full h-12 px-4 bg-gradient-to-r from-[var(--color-status-success)] to-[#16a34a] hover:from-[#16a34a] hover:to-[var(--color-status-success)] text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2 flex-shrink-0 ${className}`}
        aria-label={`Order ${product?.name || 'this product'} on WhatsApp`}
      >
        <FaWhatsapp size={18} />
        <span className="truncate">{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full py-3.5 px-6 bg-gradient-to-r from-[var(--color-status-success)] to-[#16a34a] hover:from-[#16a34a] hover:to-[var(--color-status-success)] text-white rounded-xl font-semibold text-base transition-all duration-300 hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2.5 ${className}`}
      aria-label={`Order ${product?.name || 'this product'} on WhatsApp`}
    >
      <FaWhatsapp size={20} />
      <span>{label}</span>
    </button>
  );
}