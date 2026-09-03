// health-care/backend/src/models/MarketingEvent.js

/**
 * MarketingEvent — lightweight server-side beacon for marketing funnels.
 *
 * Records high-intent marketing interactions (WhatsApp order clicks, exit
 * popup impressions/leads) so the admin Marketing Dashboard can show real
 * channel numbers without depending on the GA4 Data API.
 */

const mongoose = require('mongoose');

const marketingEventSchema = new mongoose.Schema(
  {
    // Event type — validated against an allowlist in the controller
    type: { type: String, required: true, index: true },

    // Optional context
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    value: { type: Number, default: 0 },          // e.g. cart value at click time
    currency: { type: String, default: 'BDT' },
    path: { type: String, default: '' },          // page the event happened on
  },
  { timestamps: true }
);

marketingEventSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('MarketingEvent', marketingEventSchema);