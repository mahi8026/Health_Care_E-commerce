// health-care/backend/src/services/leadAssociation.js
//
// Phase 4.2-D — RFQ → Lead / customer / attribution association.
//
// Implements the deterministic contract resolved by Phase 4.2-D0
// (docs/growth/crm-field-contract.md § "Automatic RFQ → Lead association"):
//
//   R1 eligibility gate  — admin-approved B2B only (b2bAccount + approved)
//   R3 lookup            — Lead.customer ONLY (never phone/email/organization)
//   R4 existing lead     — idempotent quote reference, rfq_status none→requested,
//                          status→rfq only when Lead.canTransition allows,
//                          last_touch_at = server time; business fields untouched
//   R5 new lead          — complete business profile required (contract §2-§4)
//   R6 skip              — any missing requirement ⇒ skip; RFQ is never affected
//   R8/R9 attribution    — existing Lead.sanitizeAttribution (4 keys ≤64) +
//                          Lead.deriveLeadSource (single mapping table)
//
// This service NEVER writes to Quote or User, never creates a User, never
// merges Leads, and never invents fallback matching. It is called
// fire-and-forget from quoteController AFTER Quote.create has persisted; a
// failure here must never fail an already-successful RFQ (the caller isolates
// it). Expected business outcomes are returned as result objects (skipped),
// not thrown — only genuine infrastructure failures propagate.

const User = require('../models/User');
const Lead = require('../models/Lead');
const logger = require('../utils/logger');

// R5 / contract §4 — EXACT, case-sensitive institutionType → ORG_TYPES map.
// Vocabulary source: views/B2BRegisterPage.jsx (institutionTypes). Values not
// listed here (Medical Store, Nursing Home, Veterinary Clinic, any other or
// API-injected string) are ambiguous and MUST block creation — never guessed,
// never fuzzy-matched, never extended without contract evidence.
const INSTITUTION_TYPE_TO_ORG_TYPE = {
  Hospital: 'hospital',
  Clinic: 'clinic',
  'Diagnostic Center': 'diagnostic_centre',
  Laboratory: 'laboratory',
  Pharmacy: 'pharmacy',
  'Research Institute': 'institution',
  Other: 'other',
};

/**
 * Map institutionType → organization_type by exact case-sensitive match.
 * Returns null for every unmapped / non-string / prototype-chain value.
 */
function mapInstitutionType(value) {
  if (typeof value !== 'string') {
    return null;
  }
  if (!Object.prototype.hasOwnProperty.call(INSTITUTION_TYPE_TO_ORG_TYPE, value)) {
    return null;
  }
  return INSTITUTION_TYPE_TO_ORG_TYPE[value];
}

// R5 / contract §2 — the repository has NO approved per-user business-phone
// field (exhaustively verified in Phase 4.2-D0). Until a future phase
// introduces an authoritative source this always resolves to null, which
// makes automatic NEW Lead creation impossible. User.phone and User.bkashPhone
// are contractually forbidden as substitutes (published business number only).
function resolveApprovedBusinessPhone() {
  return null;
}

// R5 / contract §3 — division must come from an explicit authoritative source.
// User records store district only, and division is NEVER derived from
// district. Always null until such a source exists.
function resolveExplicitDivision() {
  return null;
}

/**
 * Evaluate every R5 requirement for creating a NEW Lead from a User.
 * Returns the derived business fields plus the list of missing requirements
 * (empty ⇒ creation allowed). Pure — no I/O, no side effects.
 */
function evaluateNewLeadRequirements(user) {
  const missing = [];

  // organization — legitimate business name only (never email domain, notes…).
  const organization = String((user && (user.companyName || user.company)) || '').trim();
  if (organization.length < 2) {
    missing.push('organization_missing');
  }

  // organization_type — exact contract mapping only.
  const organization_type = mapInstitutionType(user && user.institutionType);
  if (!organization_type) {
    missing.push('organization_type_unmapped');
  }

  // approved business phone — no source exists today (contract §2).
  const businessPhone = resolveApprovedBusinessPhone();
  if (!businessPhone) {
    missing.push('business_phone_missing');
  }

  // district — ONLY from the user's default address when actually present.
  const defaultAddress = ((user && user.addresses) || []).find((a) => a && a.isDefault);
  const district = defaultAddress && defaultAddress.district ? String(defaultAddress.district).trim() : '';
  if (!district) {
    missing.push('district_missing');
  }

  // division — explicitly supplied only; never derived (contract §3).
  const division = resolveExplicitDivision();
  if (!division) {
    missing.push('division_missing');
  }

  return { missing, organization, organization_type, district, division, businessPhone };
}

/**
 * Build the attribution block for a NEW Lead from an untrusted RFQ payload.
 * Sanitisation is delegated to the existing Phase 4.1/4.2 helpers — no second
 * parser: Lead.sanitizeAttribution allowlists the four UTM keys (≤64 chars) so
 * utm_term / gclid can never enter, and deriveLeadSource is the single source
 * mapping. landing_page follows the existing controller convention (≤300).
 */
function buildLeadAttribution(attribution) {
  const raw = attribution && typeof attribution === 'object' ? attribution : {};
  const clean = Lead.sanitizeAttribution(raw);
  const landing = typeof raw.landing_page === 'string' ? raw.landing_page.trim().slice(0, 300) : '';
  return {
    source: Lead.deriveLeadSource(clean),
    medium: clean.utm_medium || undefined,
    campaign: clean.utm_campaign || undefined,
    content: clean.utm_content || undefined,
    landing_page: landing || undefined,
  };
}

/**
 * Associate a successfully persisted Quote with the CRM Lead pipeline (R2).
 *
 * @param {Object}  input
 * @param {*}       input.userId        authenticated req.user._id (NEVER client-supplied)
 * @param {*}       input.quoteId       persisted Quote._id
 * @param {string}  input.quoteNumber   persisted Quote.quoteNumber
 * @param {Object}  [input.attribution] untrusted {utm_*, landing_page} from the RFQ body
 * @returns {Promise<Object>} { ok, action, reason?, missing?, leadId?, linked? }
 */
async function associateRfq({ userId, quoteId, quoteNumber, attribution } = {}) {
  if (!userId || !quoteId || !quoteNumber) {
    logger.info('[leadAssociation] skipped: invalid_input');
    return { ok: false, action: 'skipped', reason: 'invalid_input' };
  }

  const user = await User.findById(userId);
  if (!user) {
    // Safe, non-PII log — identifiers of people are never echoed.
    logger.info('[leadAssociation] skipped: user_missing');
    return { ok: false, action: 'skipped', reason: 'user_missing' };
  }

  // R1/R7 — eligibility gate. Ineligible users get ZERO Lead reads and writes.
  if (!(user.b2bAccount === true && user.b2bApprovalStatus === 'approved')) {
    logger.info('[leadAssociation] skipped: not_eligible');
    return { ok: false, action: 'skipped', reason: 'not_eligible' };
  }

  // R3 — lookup by customer reference ONLY. No phone/email/organization
  // matching, no merge, no Organization lookup.
  const existing = await Lead.findOne({ customer: userId });

  if (existing) {
    // R4/F — an existing admin-created Lead receives the RFQ reference even
    // when automatic-create prerequisites (business phone, division) are absent.
    const alreadyLinked = (existing.related_quotes || []).some(
      (r) => String(r.quote_number) === String(quoteNumber)
    );
    if (!alreadyLinked) {
      existing.related_quotes = existing.related_quotes || [];
      existing.related_quotes.push({
        quote: quoteId,
        quote_number: quoteNumber,
        linked_at: new Date(), // server time — client timestamps never trusted
      });
    }
    // R4/J — status fields stay independent; only allowed moves are made.
    if (existing.rfq_status === 'none') {
      existing.rfq_status = 'requested';
    }
    if (Lead.canTransition(existing.status, 'rfq')) {
      existing.status = 'rfq';
    }
    existing.last_touch_at = new Date(); // first-touch/source NEVER rewritten here

    await existing.save();

    logger.info(`[leadAssociation] linked ${quoteNumber} -> ${existing.lead_id}${alreadyLinked ? ' (already linked)' : ''}`);
    return { ok: true, action: 'linked', leadId: existing.lead_id, linked: !alreadyLinked };
  }

  // R5 — a NEW Lead requires the complete contract profile.
  const requirements = evaluateNewLeadRequirements(user);
  if (requirements.missing.length > 0) {
    // R6 — skip with a safe, non-PII reason; the RFQ remains successful.
    logger.info(`[leadAssociation] skipped: new_lead_incomplete (${requirements.missing.join(',')})`);
    return { ok: false, action: 'skipped', reason: 'new_lead_incomplete', missing: requirements.missing };
  }

  // Unreachable with today's repository state (business phone + division have
  // no source) — kept as the single, contract-complete creation path so a
  // future phase only has to provide those two resolvers.
  const now = new Date();
  const lead = await Lead.create({
    organization: requirements.organization,
    organization_type: requirements.organization_type,
    district: requirements.district,
    division: requirements.division,
    phone: requirements.businessPhone,
    customer: user._id, // authenticated identity only (R1/G)
    status: 'new',
    lead_quality: 'unrated',
    customer_status: 'prospect',
    rfq_status: 'requested',
    related_quotes: [{ quote: quoteId, quote_number: quoteNumber, linked_at: now }],
    first_touch_at: now,
    last_touch_at: now,
    ...buildLeadAttribution(attribution),
  });

  logger.info(`[leadAssociation] created ${lead.lead_id} for ${quoteNumber}`);
  return { ok: true, action: 'created', leadId: lead.lead_id, linked: true };
}

module.exports = {
  associateRfq,
  // Pure contract helpers — exported for focused unit tests (Phase 4.2-D §M).
  mapInstitutionType,
  evaluateNewLeadRequirements,
  buildLeadAttribution,
  INSTITUTION_TYPE_TO_ORG_TYPE,
};
