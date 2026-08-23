/**
 * Single source of truth for order statuses and allowed transitions.
 *
 * Consumed by:
 *   - controllers/orderController.js  (updateOrderStatus)
 *   - middleware/validation.js        (validateOrderStatusUpdate)
 *
 * The admin UI mirrors this table in
 * src/components/admin/OrdersManagement.jsx (STATUS_TRANSITIONS).
 */
const ORDER_STATUSES = [
  'pending',
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled'
];

const ORDER_STATUS_TRANSITIONS = {
  placed:           ['confirmed', 'cancelled'],
  // 'confirmed -> shipped' allowed: SteadFast bulk booking happens at
  // 'confirmed', so admins skip straight to shipping without 'processing'
  confirmed:        ['processing', 'shipped', 'cancelled'],
  processing:       ['shipped', 'cancelled'],
  shipped:          ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered:        [],
  cancelled:        [],
  pending:          ['placed', 'cancelled']
};

module.exports = { ORDER_STATUSES, ORDER_STATUS_TRANSITIONS };
