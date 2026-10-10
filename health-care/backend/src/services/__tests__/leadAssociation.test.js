/**
 * Phase 4.2-D — leadAssociation service tests (no database required).
 *
 * Covers the deterministic Phase 4.2-D0 contract: R1 eligibility gate,
 * R3 customer-only lookup, R4 idempotent RFQ linking + status safety,
 * R5/R6 new-lead requirement skipping, R8/R9 attribution allowlist.
 *
 * The real Lead/User models are used (enums/helpers are real — the same
 * convention as crmController.test.js); only the database calls are spied.
 * Synthetic data only.
 */

const Lead = require('../../models/Lead');
const User = require('../../models/User');

jest.mock('../../utils/logger', () => ({
  error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn(),
}));

const {
  associateRfq, mapInstitutionType, evaluateNewLeadRequirements, buildLeadAttribution,
} = require('../leadAssociation');

const RFQ = {
  userId: 'user-1',
  quoteId: 'quote-1',
  quoteNumber: 'QT-2026-0042',
  attribution: {
    utm_source: 'google', utm_medium: 'cpc',
    utm_campaign: 'phase42-test', utm_content: 'test-a',
  },
};

const userDoc = (over = {}) => ({
  _id: 'user-1',
  accountType: 'B2B',
  role: 'b2b_customer',
  b2bAccount: true,
  b2bApprovalStatus: 'approved',
  companyName: 'Sunrise Hospital',
  institutionType: 'Hospital',
  phone: '01711111111',
  bkashPhone: '01722222222',
  addresses: [{ label: 'Main', district: 'Dhaka', isDefault: true }],
  ...over,
});

const leadDoc = (over = {}) => ({
  _id: 'lead-1',
  lead_id: 'LD-2026-0001',
  status: 'qualified',
  rfq_status: 'none',
  organization: 'Sunrise Hospital',
  organization_type: 'hospital',
  district: 'Dhaka',
  division: 'Dhaka',
  phone: '02-98765432',
  source: 'organic',
  customer: 'user-1',
  related_quotes: [],
  first_touch_at: new Date('2026-01-01T00:00:00.000Z'),
  save: jest.fn().mockResolvedValue(true),
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(User, 'findById').mockResolvedValue(userDoc());
  jest.spyOn(Lead, 'findOne').mockResolvedValue(null);
  jest.spyOn(Lead, 'create').mockResolvedValue({ lead_id: 'LD-2026-9999' });
});

// ---------------------------------------------------------------------------
// R1/R7 — eligibility gate: ineligible users get ZERO CRM reads and writes.
// ---------------------------------------------------------------------------
describe('associateRfq — R1 eligibility gate', () => {
  it('1. retail user → no CRM read/write', async () => {
    jest.spyOn(User, 'findById').mockResolvedValue(
      userDoc({ accountType: 'Retail', role: 'customer', b2bAccount: false, b2bApprovalStatus: 'pending' })
    );
    const res = await associateRfq(RFQ);
    expect(res).toEqual({ ok: false, action: 'skipped', reason: 'not_eligible' });
    expect(Lead.findOne).not.toHaveBeenCalled();
    expect(Lead.create).not.toHaveBeenCalled();
  });

  it('2. approved-flagged but unapproved B2B (pending) → no CRM read/write', async () => {
    jest.spyOn(User, 'findById').mockResolvedValue(userDoc({ b2bApprovalStatus: 'pending' }));
    const res = await associateRfq(RFQ);
    expect(res.reason).toBe('not_eligible');
    expect(Lead.findOne).not.toHaveBeenCalled();
    expect(Lead.create).not.toHaveBeenCalled();
  });

  it('2b. rejected B2B → not eligible', async () => {
    jest.spyOn(User, 'findById').mockResolvedValue(userDoc({ b2bApprovalStatus: 'rejected' }));
    const res = await associateRfq(RFQ);
    expect(res.reason).toBe('not_eligible');
    expect(Lead.findOne).not.toHaveBeenCalled();
  });

  it('2c. b2bAccount true but approval missing → not eligible', async () => {
    jest.spyOn(User, 'findById').mockResolvedValue(userDoc({ b2bApprovalStatus: undefined }));
    const res = await associateRfq(RFQ);
    expect(res.reason).toBe('not_eligible');
    expect(Lead.findOne).not.toHaveBeenCalled();
  });

  it('13b. authenticated User missing → safe non-throwing skip', async () => {
    jest.spyOn(User, 'findById').mockResolvedValue(null);
    const res = await associateRfq(RFQ);
    expect(res).toEqual({ ok: false, action: 'skipped', reason: 'user_missing' });
    expect(Lead.findOne).not.toHaveBeenCalled();
    expect(Lead.create).not.toHaveBeenCalled();
  });

  it('17. lookup key is exactly { customer: userId } — never phone/email/org', async () => {
    await associateRfq(RFQ);
    expect(Lead.findOne).toHaveBeenCalledTimes(1);
    expect(Lead.findOne).toHaveBeenCalledWith({ customer: 'user-1' });
    expect(Object.keys(Lead.findOne.mock.calls[0][0])).toEqual(['customer']);
  });
});

// ---------------------------------------------------------------------------
// R4/F — existing admin-created Lead receives the RFQ reference (F: this is
// allowed even though automatic CREATE prerequisites are missing).
// ---------------------------------------------------------------------------
describe('associateRfq — existing Lead linking (R4)', () => {
  it('4. approved B2B with existing Lead → links the quote reference', async () => {
    const doc = leadDoc({ status: 'qualified' });
    jest.spyOn(Lead, 'findOne').mockResolvedValue(doc);
    const res = await associateRfq(RFQ);
    expect(res).toEqual({ ok: true, action: 'linked', leadId: 'LD-2026-0001', linked: true });
    expect(doc.related_quotes).toHaveLength(1);
    expect(doc.related_quotes[0].quote).toBe('quote-1');
    expect(doc.related_quotes[0].quote_number).toBe('QT-2026-0042');
    expect(doc.related_quotes[0].linked_at).toBeInstanceOf(Date);
    expect(doc.save).toHaveBeenCalledTimes(1);
  });

  it('5. duplicate quote reference → never duplicated (quote_number guard)', async () => {
    const doc = leadDoc({
      status: 'rfq',
      rfq_status: 'requested',
      related_quotes: [{ quote_number: 'QT-2026-0042', linked_at: new Date('2026-01-02T00:00:00.000Z') }],
    });
    jest.spyOn(Lead, 'findOne').mockResolvedValue(doc);
    const res = await associateRfq(RFQ);
    expect(res).toEqual({ ok: true, action: 'linked', leadId: 'LD-2026-0001', linked: false });
    expect(doc.related_quotes).toHaveLength(1);
    expect(doc.related_quotes[0].quote_number).toBe('QT-2026-0042');
  });

  it('6. rfq_status none → requested; requested stays requested (never regresses)', async () => {
    const fresh = leadDoc({ rfq_status: 'none' });
    jest.spyOn(Lead, 'findOne').mockResolvedValue(fresh);
    await associateRfq(RFQ);
    expect(fresh.rfq_status).toBe('requested');

    const again = leadDoc({ rfq_status: 'requested' });
    jest.spyOn(Lead, 'findOne').mockResolvedValue(again);
    await associateRfq({ ...RFQ, quoteNumber: 'QT-2026-0099' });
    expect(again.rfq_status).toBe('requested');
  });

  it('7. illegal status transition → no downgrade (new stays new)', async () => {
    const doc = leadDoc({ status: 'new' }); // new → rfq is not a legal jump
    jest.spyOn(Lead, 'findOne').mockResolvedValue(doc);
    await associateRfq(RFQ);
    expect(doc.status).toBe('new');
    expect(doc.rfq_status).toBe('requested');
    expect(doc.save).toHaveBeenCalledTimes(1);
  });

  it('7b. verified → rfq is also illegal and must not be forced', async () => {
    const doc = leadDoc({ status: 'verified' });
    jest.spyOn(Lead, 'findOne').mockResolvedValue(doc);
    await associateRfq(RFQ);
    expect(doc.status).toBe('verified');
  });

  it('7c. terminal / later states are never downgraded (quoted, won, lost, dormant)', async () => {
    for (const status of ['quoted', 'won', 'lost', 'dormant']) {
      const doc = leadDoc({ status, rfq_status: 'quoted' });
      jest.spyOn(Lead, 'findOne').mockResolvedValue(doc);
      await associateRfq({ ...RFQ, quoteNumber: `QT-2026-${status}` });
      expect(doc.status).toBe(status); // unchanged
      expect(doc.rfq_status).toBe('quoted'); // none→requested only; untouched here
    }
  });

  it('8. legal status transition → rfq (contacted and qualified)', async () => {
    for (const status of ['contacted', 'qualified']) {
      const doc = leadDoc({ status });
      jest.spyOn(Lead, 'findOne').mockResolvedValue(doc);
      await associateRfq({ ...RFQ, quoteNumber: `QT-2026-${status}` });
      expect(doc.status).toBe('rfq');
    }
  });

  it('9. business fields are never overwritten by association', async () => {
    const doc = leadDoc({ organization: 'Admin Entered Facility', organization_type: 'clinic', district: 'Sylhet', division: 'Sylhet', phone: '01999887766', customer: 'someone-else' });
    jest.spyOn(Lead, 'findOne').mockResolvedValue(doc);
    await associateRfq(RFQ);
    expect(doc.organization).toBe('Admin Entered Facility');
    expect(doc.organization_type).toBe('clinic');
    expect(doc.district).toBe('Sylhet');
    expect(doc.division).toBe('Sylhet');
    expect(doc.phone).toBe('01999887766');
    expect(doc.customer).toBe('someone-else');
  });

  it('10/11. User.phone and User.bkashPhone are never copied into Lead.phone', async () => {
    const doc = leadDoc({ phone: '02-12345678' });
    jest.spyOn(Lead, 'findOne').mockResolvedValue(doc);
    await associateRfq(RFQ); // userDoc carries phone 01711111111, bkashPhone 01722222222
    expect(doc.phone).toBe('02-12345678');
    expect(doc.phone).not.toBe('01711111111');
    expect(doc.phone).not.toBe('01722222222');
    expect(Lead.create).not.toHaveBeenCalled();
  });

  it('H. first_touch_at and source are preserved; only last_touch_at advances', async () => {
    const doc = leadDoc();
    const originalFirstTouch = doc.first_touch_at;
    jest.spyOn(Lead, 'findOne').mockResolvedValue(doc);
    await associateRfq(RFQ);
    expect(doc.first_touch_at).toBe(originalFirstTouch);
    expect(doc.source).toBe('organic');
    expect(doc.last_touch_at).toBeInstanceOf(Date);
    expect(doc.last_touch_at.getTime()).toBeGreaterThanOrEqual(originalFirstTouch.getTime());
  });

  it('23. repeated RFQ for the same quote stays idempotent', async () => {
    const doc = leadDoc({ status: 'qualified' });
    jest.spyOn(Lead, 'findOne').mockResolvedValue(doc);
    const first = await associateRfq(RFQ);
    const second = await associateRfq(RFQ);
    expect(first.linked).toBe(true);
    expect(second.linked).toBe(false);
    expect(doc.related_quotes).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// R5/R6 — automatic NEW Lead creation requires the complete profile; with
// today's repository state (no business-phone source, no division source) it
// always skips safely and never fabricates data.
// ---------------------------------------------------------------------------
describe('associateRfq — new Lead requirements (R5/R6)', () => {
  it('3. approved B2B without existing Lead → skips safely, creates nothing', async () => {
    jest.spyOn(Lead, 'findOne').mockResolvedValue(null);
    const res = await associateRfq(RFQ);
    expect(res.ok).toBe(false);
    expect(res.action).toBe('skipped');
    expect(res.reason).toBe('new_lead_incomplete');
    expect(Array.isArray(res.missing)).toBe(true);
    expect(res.missing.length).toBeGreaterThan(0);
    expect(Lead.create).not.toHaveBeenCalled();
  });

  it('12. missing approved business phone blocks new Lead creation', async () => {
    const req = evaluateNewLeadRequirements(userDoc());
    expect(req.missing).toContain('business_phone_missing');
    expect(req.businessPhone).toBeNull();
  });

  it('12b. User.phone / bkashPhone can never satisfy the business-phone rule', async () => {
    const user = userDoc({ phone: '01711111111', bkashPhone: '01722222222' });
    const req = evaluateNewLeadRequirements(user);
    expect(req.missing).toContain('business_phone_missing');
    expect(req.businessPhone).not.toBe(user.phone);
    expect(req.businessPhone).not.toBe(user.bkashPhone);
  });

  it('13. missing explicit division blocks new Lead creation (never derived)', async () => {
    const user = userDoc({ addresses: [{ label: 'Main', district: 'Dhaka', isDefault: true }] });
    const req = evaluateNewLeadRequirements(user);
    expect(req.missing).toContain('division_missing');
    expect(req.division).toBeNull();
    expect(req.division).not.toBe(req.district); // no district→division guessing
  });

  it('14. ambiguous institutionType blocks new Lead creation', async () => {
    const req = evaluateNewLeadRequirements(userDoc({ institutionType: 'Medical Store' }));
    expect(req.missing).toContain('organization_type_unmapped');
    expect(req.organization_type).toBeNull();
  });

  it('14b. missing/short organization blocks creation', async () => {
    expect(evaluateNewLeadRequirements(userDoc({ companyName: '', company: '' })).missing)
      .toContain('organization_missing');
    expect(evaluateNewLeadRequirements(userDoc({ companyName: 'A', company: undefined })).missing)
      .toContain('organization_missing');
  });

  it('16. district comes ONLY from the default address when present', () => {
    const withDefault = evaluateNewLeadRequirements(userDoc());
    expect(withDefault.district).toBe('Dhaka');
    expect(withDefault.missing).not.toContain('district_missing');

    const noDefault = evaluateNewLeadRequirements(
      userDoc({ addresses: [{ label: 'Other', district: 'Khulna', isDefault: false }] })
    );
    expect(noDefault.missing).toContain('district_missing');

    const noAddresses = evaluateNewLeadRequirements(userDoc({ addresses: [] }));
    expect(noAddresses.missing).toContain('district_missing');
  });

  it('16b. a non-default address never leaks into the Lead', () => {
    const req = evaluateNewLeadRequirements(
      userDoc({ addresses: [{ label: 'Office', district: 'Chattogram' }] }) // no isDefault
    );
    expect(req.district).toBe('');
    expect(req.missing).toContain('district_missing');
  });
});

// ---------------------------------------------------------------------------
// R5 — exact, case-sensitive institutionType → organization_type mapping.
// ---------------------------------------------------------------------------
describe('mapInstitutionType — exact contract mapping (test 15)', () => {
  it.each([
    ['Hospital', 'hospital'],
    ['Clinic', 'clinic'],
    ['Diagnostic Center', 'diagnostic_centre'],
    ['Laboratory', 'laboratory'],
    ['Pharmacy', 'pharmacy'],
    ['Research Institute', 'institution'],
    ['Other', 'other'],
  ])('maps %s → %s', (input, expected) => {
    expect(mapInstitutionType(input)).toBe(expected);
  });

  it.each(['Medical Store', 'Nursing Home', 'Veterinary Clinic', 'Clinic and Hospital', 'UNKNOWN', ''])(
    'refuses ambiguous/unknown value %s',
    (input) => {
      expect(mapInstitutionType(input)).toBeNull();
    }
  );

  it('is case-sensitive (no fuzzy matching)', () => {
    expect(mapInstitutionType('hospital')).toBeNull();
    expect(mapInstitutionType('diagnostic center')).toBeNull();
  });

  it('never resolves prototype-chain keys', () => {
    expect(mapInstitutionType('constructor')).toBeNull();
    expect(mapInstitutionType('__proto__')).toBeNull();
    expect(mapInstitutionType('toString')).toBeNull();
    expect(mapInstitutionType(undefined)).toBeNull();
    expect(mapInstitutionType({ name: 'Hospital' })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// R8/R9 — attribution allowlist and single source mapping.
// ---------------------------------------------------------------------------
describe('buildLeadAttribution — R8/R9 (tests 18-20)', () => {
  it('18. persists source/medium/campaign/content/landing_page', () => {
    const out = buildLeadAttribution({
      utm_source: 'google', utm_medium: 'cpc',
      utm_campaign: 'phase42-test', utm_content: 'test-a',
      landing_page: '  /guides/ecg-guide  ',
    });
    expect(out).toEqual({
      source: 'google_ads', // Lead.deriveLeadSource — the single mapping table
      medium: 'cpc',
      campaign: 'phase42-test',
      content: 'test-a',
      landing_page: '/guides/ecg-guide',
    });
  });

  it('19. utm_term is rejected / never present', () => {
    const out = buildLeadAttribution({ utm_source: 'google', utm_medium: 'cpc', utm_term: 'secret-term' });
    expect(Object.keys(out)).not.toContain('utm_term');
    expect(JSON.stringify(out)).not.toContain('secret-term');
  });

  it('20. gclid is rejected / never present', () => {
    const out = buildLeadAttribution({ utm_source: 'google', utm_medium: 'cpc', gclid: 'XYZ123' });
    expect(Object.keys(out)).not.toContain('gclid');
    expect(JSON.stringify(out)).not.toContain('XYZ123');
  });

  it('enforces the 64-char UTM cap and 300-char landing_page cap', () => {
    const out = buildLeadAttribution({
      utm_source: 'g'.repeat(100),
      landing_page: '/' + 'a'.repeat(400),
    });
    expect(out.landing_page).toHaveLength(300);
    expect(out.campaign === undefined || out.campaign.length <= 64).toBe(true);
  });

  it('derives sources through Lead.deriveLeadSource (no second map)', () => {
    expect(buildLeadAttribution({ utm_source: 'facebook', utm_medium: 'paid_social' }).source).toBe('meta');
    expect(buildLeadAttribution({}).source).toBe('organic');
    expect(buildLeadAttribution(null).source).toBe('organic');
    expect(buildLeadAttribution('not-an-object').source).toBe('organic');
  });
});
