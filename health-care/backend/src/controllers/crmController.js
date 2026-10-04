// health-care/backend/src/controllers/crmController.js
//
// Phase 4.2 — CRM lead pipeline API (admin only).
//
// Scope: leads are the pipeline record. Quotations stay in Quote.js and are
// only ever *referenced* here (related_quotes[].quote_number) — this controller
// never writes to the Quote collection and never recomputes pricing.
//
// Leads are created only from supplied/verified business information (admin
// entry or a customer-submitted RFQ context). A funnel *click* is never enough
// to mint a lead: analytics stay in GA4 + MarketingEvent.

const Lead = require('../models/Lead');
const Quote = require('../models/Quote');
const logger = require('../utils/logger');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');
const { parsePaginationParams, generatePaginationMetadata } = require('../utils/pagination');

// Published business numbers may be landlines, so keep this permissive; the
// delivery-address mobile regex (middleware/validation.js) is intentionally
// not reused here.
const CONTACT_PHONE = /^[0-9+\-().\s]{6,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_LIKE = /^https?:\/\/[^\s]+$/i;

/** Escape user text for a safe partial/anchored regex search. */
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Build the shared list/search filter from validated query params. */
function buildListFilter(query = {}) {
  const filter = {};
  const inEnum = (value, allowed) => value && allowed.includes(value) ? value : null;

  const status = inEnum(query.status, Lead.LEAD_STATUSES);
  if (status) {
filter.status = status;
}
  const orgType = inEnum(query.organization_type, Lead.ORG_TYPES);
  if (orgType) {
filter.organization_type = orgType;
}
  const source = inEnum(query.source, Lead.LEAD_SOURCES);
  if (source) {
filter.source = source;
}
  const rfq = inEnum(query.rfq_status, Lead.RFQ_STATUSES);
  if (rfq) {
filter.rfq_status = rfq;
}
  if (query.district) {
filter.district = String(query.district).trim();
}
  if (query.division) {
filter.division = String(query.division).trim();
}
  if (query.assigned_to) {
filter.assigned_to = String(query.assigned_to).trim();
}

  const term = String(query.search || '').trim();
  if (term) {
    const rx = new RegExp(escapeRegex(term), 'i');
    filter.$or = [
      { organization: rx }, { contact_name: rx }, { city: rx },
      { district: rx }, { phone: rx }, { email: rx }, { lead_id: rx },
      { 'related_quotes.quote_number': rx },
    ];
  }
  return filter;
}

// ── GET /api/crm ───────────────────────────────────────────────────────────
exports.listLeads = async (req, res) => {
  try {
    const { page, limit } = parsePaginationParams(req.query);
    const filter = buildListFilter(req.query);
    const [total, leads] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    return paginatedResponse(res, leads, generatePaginationMetadata(page, limit, total));
  } catch (error) {
    logger.error(`[crm.listLeads] ${error.message}`);
    return errorResponse(res, 'Failed to load leads', null, 500);
  }
};

// ── GET /api/crm/metrics ───────────────────────────────────────────────────
exports.getLeadMetrics = async (req, res) => {
  try {
    const group = (field) => Lead.aggregate([
      { $match: {} },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const [total, byStatus, bySource, byOrgType, byDistrict, byDivision] = await Promise.all([
      Lead.countDocuments({}),
      group('status'),
      group('source'),
      group('organization_type'),
      group('district'),
      group('division'),
    ]);
    const toMap = (rows) => rows.reduce((acc, row) => {
      if (row && row._id !== null && row._id !== undefined) {
acc[row._id] = row.count;
}
      return acc;
    }, {});
    return successResponse(res, {
      total,
      by_status: toMap(byStatus),
      by_source: toMap(bySource),
      by_organization_type: toMap(byOrgType),
      by_district: toMap(byDistrict),
      by_division: toMap(byDivision),
    });
  } catch (error) {
    logger.error(`[crm.getLeadMetrics] ${error.message}`);
    return errorResponse(res, 'Failed to load CRM metrics', null, 500);
  }
};

// ── GET /api/crm/:id ───────────────────────────────────────────────────────
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).lean();
    if (!lead) {
return errorResponse(res, 'Lead not found', null, 404);
}
    return successResponse(res, lead);
  } catch (error) {
    logger.error(`[crm.getLead] ${error.message}`);
    return errorResponse(res, 'Failed to load lead', null, 500);
  }
};

function validateContact(body) {
  const errors = [];
  if (body.phone !== undefined && body.phone !== null && !CONTACT_PHONE.test(String(body.phone).trim())) {
    errors.push({ field: 'phone', message: 'Invalid contact phone number' });
  }
  if (body.email && !EMAIL.test(String(body.email).trim())) {
    errors.push({ field: 'email', message: 'Invalid email address' });
  }
  for (const key of ['website', 'facebook_url', 'linkedin_url']) {
    if (body[key] && !URL_LIKE.test(String(body[key]).trim())) {
      errors.push({ field: key, message: `${key} must start with http:// or https://` });
    }
  }
  if (body.organization && String(body.organization).trim().length < 2) {
    errors.push({ field: 'organization', message: 'Organization must be at least 2 characters' });
  }
  return errors;
}

// ── POST /api/crm ──────────────────────────────────────────────────────────
exports.createLead = async (req, res) => {
  try {
    const body = req.body || {};
    const errors = validateContact(body);

    for (const field of ['organization', 'organization_type', 'district', 'division', 'phone']) {
      if (!body[field] || !String(body[field]).trim()) {
        errors.push({ field, message: `${field} is required` });
      }
    }
    if (body.organization_type && !Lead.ORG_TYPES.includes(body.organization_type)) {
      errors.push({ field: 'organization_type', message: 'Invalid organization_type' });
    }

    const attribution = Lead.sanitizeAttribution(body.attribution || {});
    const source = body.source && Lead.LEAD_SOURCES.includes(body.source)
      ? body.source
      : Lead.deriveLeadSource(attribution, body.source_hints || {});
    if (body.source && !Lead.LEAD_SOURCES.includes(body.source)) {
      errors.push({ field: 'source', message: 'Invalid source' });
    }
    if (body.status && !Lead.LEAD_STATUSES.includes(body.status)) {
      errors.push({ field: 'status', message: 'Invalid status' });
    }
    if (errors.length) {
return errorResponse(res, 'Validation failed', errors, 400);
}

    const noteText = Lead.sanitizeNote(body.notes);
    const lead = await Lead.create({
      organization: String(body.organization).trim(),
      organization_type: body.organization_type,
      city: body.city ? String(body.city).trim() : undefined,
      district: String(body.district).trim(),
      division: String(body.division).trim(),
      contact_name: body.contact_name ? String(body.contact_name).trim() : undefined,
      contact_role: body.contact_role ? String(body.contact_role).trim() : undefined,
      phone: String(body.phone).trim(),
      email: body.email ? String(body.email).trim().toLowerCase() : undefined,
      website: body.website ? String(body.website).trim() : undefined,
      facebook_url: body.facebook_url ? String(body.facebook_url).trim() : undefined,
      linkedin_url: body.linkedin_url ? String(body.linkedin_url).trim() : undefined,
      likely_product_category: body.likely_product_category ? String(body.likely_product_category).trim() : undefined,
      source,
      medium: attribution.utm_medium,
      campaign: attribution.utm_campaign,
      content: attribution.utm_content,
      landing_page: body.landing_page ? String(body.landing_page).trim().slice(0, 300) : undefined,
      first_touch_at: body.first_touch_at ? new Date(body.first_touch_at) : new Date(),
      last_touch_at: new Date(),
      status: body.status && Lead.LEAD_STATUSES.includes(body.status) ? body.status : 'new',
      lead_quality: body.lead_quality && Lead.LEAD_QUALITIES.includes(body.lead_quality) ? body.lead_quality : 'unrated',
      assigned_to: body.assigned_to ? String(body.assigned_to).trim().slice(0, 120) : null,
      notes: noteText ? [{ text: noteText, at: new Date(), by: 'admin' }] : [],
      customer: body.customer || null,
      customer_status: body.customer_status && Lead.CUSTOMER_STATUSES.includes(body.customer_status)
        ? body.customer_status : 'prospect',
      rfq_status: 'none',
      related_quotes: [],
    });

    logger.info(`[crm.createLead] ${lead.lead_id} (${lead.organization}) status=${lead.status}`);
    return successResponse(res, lead, 'Lead created', 201);
  } catch (error) {
    if (error && error.name === 'ValidationError') {
      const errs = Object.keys(error.errors || {}).map((f) => ({ field: f, message: error.errors[f].message }));
      return errorResponse(res, 'Validation failed', errs, 400);
    }
    logger.error(`[crm.createLead] ${error.message}`);
    return errorResponse(res, 'Failed to create lead', null, 500);
  }
};

// ── PATCH /api/crm/:id ─────────────────────────────────────────────────────
exports.updateLead = async (req, res) => {
  try {
    const body = req.body || {};
    const errors = validateContact(body);
    if (body.status && !Lead.LEAD_STATUSES.includes(body.status)) {
      errors.push({ field: 'status', message: 'Invalid status' });
    }
    if (body.lead_quality && !Lead.LEAD_QUALITIES.includes(body.lead_quality)) {
      errors.push({ field: 'lead_quality', message: 'Invalid lead_quality' });
    }
    if (body.customer_status && !Lead.CUSTOMER_STATUSES.includes(body.customer_status)) {
      errors.push({ field: 'customer_status', message: 'Invalid customer_status' });
    }
    if (errors.length) {
return errorResponse(res, 'Validation failed', errors, 400);
}

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
return errorResponse(res, 'Lead not found', null, 404);
}

    // Deterministic status lifecycle — reject illegal jumps instead of storing them.
    if (body.status && body.status !== lead.status) {
      if (!Lead.canTransition(lead.status, body.status)) {
        return errorResponse(res,
          `Invalid status transition from '${lead.status}' to '${body.status}'`,
          { allowed: Lead.TRANSITIONS[lead.status] || [] }, 400);
      }
      lead.status = body.status;
      if (body.status === 'contacted' && !lead.first_contact_at) {
        lead.first_contact_at = new Date();
      }
      lead.last_contact = new Date();
    }

    const updatable = [
      'city', 'district', 'division', 'contact_name', 'contact_role', 'phone', 'email',
      'website', 'facebook_url', 'linkedin_url', 'likely_product_category',
      'landing_page', 'lead_quality', 'next_action', 'customer_status',
    ];
    for (const key of updatable) {
      if (body[key] !== undefined && body[key] !== null) {
lead[key] = String(body[key]).trim() || undefined;
}
    }
    if (body.assigned_to !== undefined) {
      lead.assigned_to = body.assigned_to ? String(body.assigned_to).trim().slice(0, 120) : null;
    }
    if (body.next_action_date !== undefined) {
      lead.next_action_date = body.next_action_date ? new Date(body.next_action_date) : null;
    }
    lead.last_touch_at = new Date();

    if (body.notes) {
      const text = Lead.sanitizeNote(body.notes);
      if (!text) {
return errorResponse(res, 'Note text is empty', null, 400);
}
      if ((lead.notes || []).length >= 100) {
return errorResponse(res, 'Note limit reached', null, 400);
}
      lead.notes.push({ text, at: new Date(), by: 'admin' });
    }

    await lead.save();
    return successResponse(res, lead, 'Lead updated');
  } catch (error) {
    if (error && error.name === 'ValidationError') {
      const errs = Object.keys(error.errors || {}).map((f) => ({ field: f, message: error.errors[f].message }));
      return errorResponse(res, 'Validation failed', errs, 400);
    }
    logger.error(`[crm.updateLead] ${error.message}`);
    return errorResponse(res, 'Failed to update lead', null, 500);
  }
};

// ── POST /api/crm/:id/assign ───────────────────────────────────────────────
exports.assignLead = async (req, res) => {
  try {
    const assigned = req.body && req.body.assigned_to;
    if (assigned !== null && assigned !== undefined && assigned !== '' && String(assigned).trim().length > 120) {
      return errorResponse(res, 'Owner name is too long', null, 400);
    }
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
return errorResponse(res, 'Lead not found', null, 404);
}
    lead.assigned_to = assigned ? String(assigned).trim() : null;
    lead.last_touch_at = new Date();
    await lead.save();
    return successResponse(res, lead, assigned ? 'Lead assigned' : 'Lead unassigned');
  } catch (error) {
    logger.error(`[crm.assignLead] ${error.message}`);
    return errorResponse(res, 'Failed to assign lead', null, 500);
  }
};

// ── POST /api/crm/:id/quote ────────────────────────────────────────────────
// Section F — associate an existing quotation with a lead.
//
// This is a READ-ONLY lookup of models/Quote.js: the quotation remains the
// source of truth, is never copied or mutated here, and pricing/payment terms
// are never touched. Only a reference (quote id + quote_number) is stored on
// the lead. See docs/growth/crm-architecture.md → "RFQ → lead association".
// -- POST /api/crm/:id/notes ------------------------------------------------
exports.addNote = async (req, res) => {
  try {
    const text = Lead.sanitizeNote(req.body && req.body.text);
    if (!text) {
return errorResponse(res, 'Note text is required', null, 400);
}
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
return errorResponse(res, 'Lead not found', null, 404);
}
    if ((lead.notes || []).length >= 100) {
return errorResponse(res, 'Note limit reached', null, 400);
}
    lead.notes.push({ text, at: new Date(), by: 'admin' });
    lead.last_touch_at = new Date();
    await lead.save();
    return successResponse(res, lead, 'Note added', 201);
  } catch (error) {
    logger.error(`[crm.addNote] ${error.message}`);
    return errorResponse(res, 'Failed to add note', null, 500);
  }
};

exports.linkQuote = async (req, res) => {
  try {
    const body = req.body || {};
    const quoteNumber = body.quote_number ? String(body.quote_number).trim() : '';
    const quoteId = body.quote_id ? String(body.quote_id).trim() : '';
    if (!quoteNumber && !quoteId) {
      return errorResponse(res, 'quote_number or quote_id is required', null, 400);
    }

    const quote = quoteNumber
      ? await Quote.findOne({ quoteNumber }).select('quoteNumber quoteId user status createdAt').lean()
      : await Quote.findById(quoteId).select('quoteNumber quoteId user status createdAt').lean();
    if (!quote || !quote.quoteNumber) {
      return errorResponse(res, 'Quote not found in the quotation system', null, 404);
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
return errorResponse(res, 'Lead not found', null, 404);
}

    const already = (lead.related_quotes || []).some(
      (r) => String(r.quote_number) === String(quote.quoteNumber)
    );
    if (already) {
      return successResponse(res, lead, 'Quote already linked to this lead');
    }

    lead.related_quotes = lead.related_quotes || [];
    lead.related_quotes.push({ quote: quote._id, quote_number: quote.quoteNumber, linked_at: new Date() });
    if (lead.rfq_status === 'none') {
lead.rfq_status = 'requested';
}

    // Advance the pipeline only when the transition is legal for the current
    // state — linking never forces an invalid jump (documented behaviour).
    if (lead.status !== 'rfq' && Lead.canTransition(lead.status, 'rfq')) {
      lead.status = 'rfq';
    }
    lead.last_touch_at = new Date();
    await lead.save();

    logger.info(`[crm.linkQuote] ${lead.lead_id} ← ${quote.quoteNumber}`);
    return successResponse(res, lead, `Linked quote ${quote.quoteNumber}`, 201);
  } catch (error) {
    logger.error(`[crm.linkQuote] ${error.message}`);
    return errorResponse(res, 'Failed to link quote', null, 500);
  }
};

module.exports = exports;



