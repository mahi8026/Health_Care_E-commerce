// health-care/backend/src/routes/crmRoutes.js
//
// Phase 4.2 — CRM lead pipeline API.
//
// SECURITY: every route below requires an authenticated admin. There is NO
// public write path: funnel clicks (GA4/MarketingEvent) never mint leads, and
// lead records (business contact information) are never exposed anonymously.

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { adminApiLimiter } = require('../middleware/enhancedRateLimiter');
const {
  listLeads,
  getLeadMetrics,
  getLead,
  createLead,
  updateLead,
  addNote,
  assignLead,
  linkQuote,
} = require('../controllers/crmController');

// Same guard stack used by /api/admin (protect → role check → rate limit).
router.use(protect, authorize('admin'), adminApiLimiter);

router.get('/', listLeads);
router.get('/metrics', getLeadMetrics);   // must precede /:id
router.post('/', createLead);
router.get('/:id', getLead);
router.patch('/:id', updateLead);
router.post('/:id/notes', addNote);
router.post('/:id/assign', assignLead);
router.post('/:id/quote', linkQuote);     // read-only reference to Quote.js

module.exports = router;
