// health-care/src/utils/emailCampaigns.js

/**
 * Ready-to-send email campaign templates for the admin newsletter broadcast.
 *
 * Each template produces the *body* HTML only — the backend wraps it with the
 * branded MediportBD layout (navy header + footer + unsubscribe link) via
 * `emailLayout()`. All styling is inline so it survives Gmail/Outlook.
 *
 * Vars let the admin fill in campaign specifics (discount %, coupon code…)
 * without touching HTML. `{{SITE_URL}}` in links is replaced by the backend
 * wrapper's own knowledge of links — actually kept as a marker the admin can
 * leave; the backend emailLayout footer carries the canonical site link.
 */

const CTA_STYLE =
  'display:inline-block;background:#0E8A6E;color:#ffffff;font-size:14px;font-weight:600;padding:13px 28px;border-radius:8px;text-decoration:none;';

const heading = (text) =>
  `<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0B2545;">${text}</h2>`;

const paragraph = (text) =>
  `<p style="margin:0 0 14px;font-size:14px;color:#6B7280;line-height:1.6;">${text}</p>`;

const couponBlock = (code, note) => `
  <div style="text-align:center;margin:20px 0;">
    <div style="display:inline-block;border:2px dashed #0E8A6E;background:#E6F4F0;border-radius:10px;padding:14px 28px;">
      <span style="font-family:monospace;font-size:22px;font-weight:800;letter-spacing:3px;color:#0E8A6E;">${code}</span>
    </div>
    ${note ? `<p style="margin:8px 0 0;font-size:12px;color:#9CA3AF;">${note}</p>` : ''}
  </div>`;

export const CAMPAIGN_TEMPLATES = [
  {
    id: 'flash-sale',
    name: 'Flash Sale',
    icon: '⚡',
    description: 'Time-limited discount push with a coupon code. Best for moving stock fast.',
    vars: [
      { key: 'discount', label: 'Discount %', default: '10' },
      { key: 'couponCode', label: 'Coupon code', default: 'FLASH10' },
      { key: 'endDate', label: 'Ends on', default: 'this Sunday' },
    ],
    buildSubject: (v) => `⚡ Flash Sale: ${v.discount}% OFF Everything — Ends ${v.endDate}!`,
    buildHtml: (v) => `
      ${heading(`⚡ ${v.discount}% OFF — Flash Sale!`)}
      ${paragraph(`For a very limited time, enjoy <strong>${v.discount}% OFF</strong> on DGDA-registered
        medical equipment, surgical instruments and laboratory reagents. Stocks are limited —
        once they're gone, they're gone.`)}
      ${couponBlock(v.couponCode, `Apply this code at checkout · Valid until ${v.endDate}`)}
      <div style="text-align:center;margin:24px 0;">
        <a href="{{SITE_URL}}/products" style="${CTA_STYLE}">Shop the Flash Sale</a>
      </div>
      ${paragraph('Free delivery in Dhaka metro on orders over ৳50,000. Cash on delivery, bKash, Nagad and card accepted.')}
      <p style="margin:0;font-size:12px;color:#9CA3AF;">
        *Discount applies to eligible products. Cannot be combined with other offers.
      </p>`,
  },

  {
    id: 'new-arrivals',
    name: 'New Arrivals',
    icon: '🆕',
    description: 'Announce new products with links. Fill in up to 3 products.',
    vars: [
      { key: 'headline', label: 'Headline', default: 'Just Landed: New Medical Equipment' },
      { key: 'product1', label: 'Product 1 (name — link)', default: '' },
      { key: 'product2', label: 'Product 2 (name — link)', default: '' },
      { key: 'product3', label: 'Product 3 (name — link)', default: '' },
    ],
    buildSubject: (v) => `🆕 New at MediportBD: ${v.headline}`,
    buildHtml: (v) => {
      const products = [v.product1, v.product2, v.product3]
        .map((p) => String(p || '').trim())
        .filter(Boolean)
        .map((p) => {
          const [name, link] = p.split('—').map((s) => s.trim());
          const url = link || '{{SITE_URL}}/products';
          return `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;font-size:14px;color:#0B2545;">
              &#128230; <a href="${url}" style="color:#0E8A6E;font-weight:600;text-decoration:none;">${name}</a>
            </td>
          </tr>`;
        })
        .join('');
      return `
        ${heading(`🆕 ${v.headline}`)}
        ${paragraph('Fresh stock has arrived at MediportBD — DGDA-registered, warranty-backed, and ready to ship with free installation in Dhaka.')}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">${products || ''}
        </table>
        <div style="text-align:center;margin:24px 0;">
          <a href="{{SITE_URL}}/products" style="${CTA_STYLE}">View All New Arrivals</a>
        </div>`;
    },
  },

  {
    id: 'b2b-special',
    name: 'B2B Special',
    icon: '🏢',
    description: 'Bulk-pricing pitch for hospitals, clinics and diagnostic centers.',
    vars: [
      { key: 'bulkDiscount', label: 'Bulk discount (up to %)', default: '30' },
      { key: 'creditTerms', label: 'Credit terms (days)', default: '90' },
    ],
    buildSubject: (v) => `🏢 For Hospitals & Clinics: Up to ${v.bulkDiscount}% Bulk Discount + ${v.creditTerms}-Day Credit`,
    buildHtml: (v) => `
      ${heading('Equip Your Facility for Less')}
      ${paragraph(`MediportBD's B2B program gives hospitals, clinics and diagnostic centers
        <strong>up to ${v.bulkDiscount}% bulk discounts</strong>, <strong>${v.creditTerms}-day credit terms</strong>,
        a dedicated account manager and priority order processing.`)}
      <div style="background:#E6F4F0;border-radius:8px;padding:16px 18px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-size:13px;color:#374151;">&#9989; DGDA-registered equipment with warranty</p>
        <p style="margin:0 0 6px;font-size:13px;color:#374151;">&#128666; Free installation &amp; staff training (Dhaka)</p>
        <p style="margin:0 0 6px;font-size:13px;color:#374151;">&#10052;&#65039; Cold-chain delivery for reagents</p>
        <p style="margin:0;font-size:13px;color:#374151;">&#128179; Custom quotations within 24 hours</p>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="{{SITE_URL}}/b2b" style="${CTA_STYLE}">Apply for a B2B Account</a>
      </div>
      ${paragraph('Already purchasing regularly? Reply to this email and we will review your account for a better tier.')}`,
  },

  {
    id: 'we-miss-you',
    name: 'We Miss You',
    icon: '💌',
    description: 'Re-engagement offer for subscribers who have not ordered recently.',
    vars: [
      { key: 'discount', label: 'Comeback discount %', default: '5' },
      { key: 'couponCode', label: 'Coupon code', default: 'COMEBACK5' },
    ],
    buildSubject: (v) => `💌 We miss you! Here's ${v.discount}% OFF your next order`,
    buildHtml: (v) => `
      ${heading('It\u2019s been a while…')}
      ${paragraph(`You haven't ordered in a while, so we saved something for you:
        <strong>${v.discount}% OFF</strong> your next order — no minimum spend.`)}
      ${couponBlock(v.couponCode, 'Works on everything in stock')}
      <div style="text-align:center;margin:24px 0;">
        <a href="{{SITE_URL}}/products" style="${CTA_STYLE}">Claim My Discount</a>
      </div>
      ${paragraph('Need new equipment for your practice? Our team can recommend the right device for your budget — just reply or WhatsApp us.')}`,
  },

  {
    id: 'price-drop',
    name: 'Price Drop',
    icon: '📉',
    description: 'Announce a price reduction on a specific product.',
    vars: [
      { key: 'productName', label: 'Product name', default: '' },
      { key: 'oldPrice', label: 'Old price (৳)', default: '' },
      { key: 'newPrice', label: 'New price (৳)', default: '' },
      { key: 'productLink', label: 'Product link (optional)', default: '' },
    ],
    buildSubject: (v) => `📉 Price Drop: ${v.productName} now ৳${v.newPrice} (was ৳${v.oldPrice})`,
    buildHtml: (v) => `
      ${heading('📉 Price Drop Alert!')}
      ${paragraph(`<strong>${v.productName}</strong> just got more affordable:`)}
      <div style="text-align:center;margin:20px 0;">
        <span style="font-size:18px;color:#9CA3AF;text-decoration:line-through;">&#2547;${v.oldPrice}</span>
        &nbsp;&rarr;&nbsp;
        <span style="font-size:28px;font-weight:800;color:#0E8A6E;">&#2547;${v.newPrice}</span>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${v.productLink || '{{SITE_URL}}/products'}" style="${CTA_STYLE}">Buy Now — Limited Stock</a>
      </div>
      ${paragraph('Includes warranty, free installation (Dhaka) and cash-on-delivery. Order before 12 PM for same-day dispatch.')}`,
  },
];

export function buildCampaign(templateId, vars) {
  const tpl = CAMPAIGN_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return null;
  return {
    subject: tpl.buildSubject(vars),
    htmlContent: tpl.buildHtml(vars),
  };
}