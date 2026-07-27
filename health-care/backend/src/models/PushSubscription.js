const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null = anonymous/guest subscriber
  },
  endpoint:   { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth:   { type: String, required: true },
  },
  // User agent info
  browser:  { type: String, default: '' }, // Chrome, Firefox, Safari
  device:   { type: String, default: '' }, // mobile, desktop
  os:       { type: String, default: '' }, // Android, iOS, Windows
  
  // Notification preferences
  preferences: {
    orderUpdates:   { type: Boolean, default: true },
    flashDeals:     { type: Boolean, default: true },
    stockAlerts:    { type: Boolean, default: true },
    refundUpdates:  { type: Boolean, default: true },
    quoteUpdates:   { type: Boolean, default: true },
    b2bAlerts:      { type: Boolean, default: true },
  },
  
  isActive:   { type: Boolean, default: true },
  lastUsed:   { type: Date,    default: Date.now },
  createdAt:  { type: Date,    default: Date.now },
});

pushSubscriptionSchema.index({ user: 1 });
pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });
pushSubscriptionSchema.index({ isActive: 1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
