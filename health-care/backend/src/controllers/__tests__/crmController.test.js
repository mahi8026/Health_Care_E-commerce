/**
 * Phase 4.2 — CRM controller tests (no database required).
 *
 * Covers: lead creation, invalid lead rejection, status transitions,
 * assignment, notes, attribution persistence, RFQ association,
 * dashboard metrics.
 *
 * The real Lead model is used (enums/helpers are real); only the database
 * calls are spied. Synthetic data only.
 */

const Lead = require('../../models/Lead');
const Quote = require('../../models/Quote');
const logger = require('../../utils/logger');

jest.mock('../../utils/logger', () => ({
  error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn(),
}));

const {
  listLeads, getLeadMetrics, getLead, createLead, updateLead, addNote, assignLead, linkQuote,
} = require('../crmController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.locals = {};
  return res;
};
const bodyOf = (res) => res.json.mock.calls[res.json.mock.calls.length - 1][0];

const validLeadPayload = () => ({
  organization: 'Sunrise Diagnostic Centre (synthetic)',
  organization_type: 'diagnostic_centre',
  district: 'Dhaka',
  division: 'Dhaka',
  phone: '01712345678',
  email: 'contact@sunrise.example.com',
  attribution: {
    utm_source: 'google', utm_medium: 'cpc',
    utm_campaign: 'phase42-test', utm_content: 'test-a',
    utm_term: 'must-not-persist', gclid: 'XYZ123',
  },
  landing_page: '/guides/ecg-guide',
  notes: 'Called <script>alert(1)</script> about ICU beds',
});

const leadDoc = (over = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  lead_id: 'LD-2026-0001',
  status: 'new',
  rfq_status: 'none',
  notes: [],
  related_quotes: [],
  assigned_to: null,
  save: jest.fn().mockResolvedValue(true),
  ...over,
});

describe('crmController.createLead', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a lead with derived source and sanitised attribution', async () => {
    const req = { body: validLeadPayload() };
    const res = mockRes();
    const spy = jest.spyOn(Lead, 'create').mockImplementation(async (doc) => ({ ...doc, lead_id: 'LD-2026-0001' }));

    await createLead(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const saved = spy.mock.calls[0][0];
    expect(saved.source).toBe('google_ads');          // UTM → lead_source mapping
    expect(saved.medium).toBe('cpc');
    expect(saved.campaign).toBe('phase42-test');
    expect(saved.content).toBe('test-a');
    expect(saved.landing_page).toBe('/guides/ecg-guide');
    expect(saved.status).toBe('new');
    expect(saved.related_quotes).toEqual([]);
    // No utm_term / gclid persistence (Section E)
    expect(saved.medium).toBe('cpc');
    expect(Object.keys(saved)).not.toContain('utm_term');
    expect(Object.keys(saved)).not.toContain('gclid');
    // Notes sanitised (Section I)
    expect(saved.notes[0].text).not.toContain('<');
    expect(saved.notes[0].text).not.toContain('script>alert');
  });

  it('rejects a lead missing required fields', async () => {
    const res = mockRes();
    const spy = jest.spyOn(Lead, 'create');
    await createLead({ body: { organization: '' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(bodyOf(res).success).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    expect(bodyOf(res).errors.map((e) => e.field).sort()).toEqual(
      ['district', 'division', 'organization', 'organization_type', 'phone'].sort()
    );
  });

  it('rejects invalid enums', async () => {
    const res = mockRes();
    await createLead({
      body: { ...validLeadPayload(), organization_type: 'starship', source: 'not-a-source' },
    }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(bodyOf(res).errors.map((e) => e.field).sort()).toEqual(['organization_type', 'source'].sort());
  });

  it('rejects malformed contact details', async () => {
    const res = mockRes();
    await createLead({ body: { ...validLeadPayload(), email: 'not-an-email' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(bodyOf(res).errors[0].field).toBe('email');
  });
});

describe('crmController.listLeads', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a paginated list and applies typed filters', async () => {
    const filterSpy = jest.spyOn(Lead, 'countDocuments').mockResolvedValue(2);
    const findSpy = jest.spyOn(Lead, 'find').mockReturnValue({
      sort: function () {
 return this; 
},
      skip: function () {
 return this; 
},
      limit: function () {
 return this; 
},
      lean: jest.fn().mockResolvedValue([{ lead_id: 'LD-2026-0001' }, { lead_id: 'LD-2026-0002' }]),
    });
    const res = mockRes();

    await listLeads({ query: { status: 'rfq', organization_type: 'laboratory', district: 'Chattogram', page: 2, limit: 10 } }, res);

    const filter = filterSpy.mock.calls[0][0];
    expect(filter.status).toBe('rfq');
    expect(filter.organization_type).toBe('laboratory');
    expect(filter.district).toBe('Chattogram');
    expect(res.json).toHaveBeenCalled();
    const payload = bodyOf(res);
    expect(payload.success).toBe(true);
    expect(payload.data).toHaveLength(2);
    expect(payload.pagination).toEqual(
      expect.objectContaining({ page: 2, limit: 10, total: 2 })
    );
    expect(findSpy).toHaveBeenCalled();
  });

  it('ignores unknown filter values instead of blocking the query', async () => {
    const filterSpy = jest.spyOn(Lead, 'countDocuments').mockResolvedValue(0);
    jest.spyOn(Lead, 'find').mockReturnValue({
      sort: function () {
 return this; 
}, skip: function () {
 return this; 
},
      limit: function () {
 return this; 
}, lean: jest.fn().mockResolvedValue([]),
    });
    const res = mockRes();
    await listLeads({ query: { status: 'DROP TABLE', source: 'nonsense' } }, res);
    const filter = filterSpy.mock.calls[0][0];
    expect(filter.status).toBeUndefined();
    expect(filter.source).toBeUndefined();
  });
});

describe('crmController.updateLead (status transitions)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects an illegal status transition without saving', async () => {
    const doc = leadDoc({ status: 'new' });
    jest.spyOn(Lead, 'findById').mockResolvedValue(doc);
    const res = mockRes();

    await updateLead({ params: { id: 'x' }, body: { status: 'won' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(bodyOf(res).message).toMatch(/Invalid status transition/);
    expect(bodyOf(res).errors.allowed).toEqual(['verified', 'contacted', 'lost']);
    expect(doc.save).not.toHaveBeenCalled();
    expect(doc.status).toBe('new');
  });

  it('accepts a legal transition and stamps first_contact_at on contacted', async () => {
    const doc = leadDoc({ status: 'new', first_contact_at: null });
    jest.spyOn(Lead, 'findById').mockResolvedValue(doc);
    const res = mockRes();

    await updateLead({ params: { id: 'x' }, body: { status: 'contacted', next_action: 'Call back tomorrow' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(doc.status).toBe('contacted');
    expect(doc.first_contact_at).toBeInstanceOf(Date);
    expect(doc.next_action).toBe('Call back tomorrow');
    expect(doc.save).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid status value outright', async () => {
    const doc = leadDoc();
    jest.spyOn(Lead, 'findById').mockResolvedValue(doc);
    const res = mockRes();
    await updateLead({ params: { id: 'x' }, body: { status: 'nope' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(doc.save).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown lead', async () => {
    jest.spyOn(Lead, 'findById').mockResolvedValue(null);
    const res = mockRes();
    await updateLead({ params: { id: 'missing' }, body: { status: 'contacted' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('crmController.assignLead', () => {
  beforeEach(() => jest.clearAllMocks());

  it('assigns an owner', async () => {
    const doc = leadDoc();
    jest.spyOn(Lead, 'findById').mockResolvedValue(doc);
    const res = mockRes();
    await assignLead({ params: { id: 'x' }, body: { assigned_to: 'Rahim (sales)' } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(doc.assigned_to).toBe('Rahim (sales)');
    expect(doc.save).toHaveBeenCalledTimes(1);
  });

  it('clears an owner with an empty value', async () => {
    const doc = leadDoc({ assigned_to: 'Rahim (sales)' });
    jest.spyOn(Lead, 'findById').mockResolvedValue(doc);
    const res = mockRes();
    await assignLead({ params: { id: 'x' }, body: { assigned_to: '' } }, res);
    expect(doc.assigned_to).toBeNull();
    expect(bodyOf(res).message).toMatch(/unassigned/i);
  });
});

describe('crmController.addNote', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sanitises and appends a note', async () => {
    const doc = leadDoc();
    jest.spyOn(Lead, 'findById').mockResolvedValue(doc);
    const res = mockRes();
    await addNote({ params: { id: 'x' }, body: { text: '  called <b>back</b> about <img src=x onerror=alert(1)> price  ' } }, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(doc.notes).toHaveLength(1);
    expect(doc.notes[0].text).not.toContain('<');
    expect(doc.notes[0].text).toContain('called');
    expect(doc.save).toHaveBeenCalledTimes(1);
  });

  it('rejects an empty or markup-only note', async () => {
    const doc = leadDoc();
    jest.spyOn(Lead, 'findById').mockResolvedValue(doc);
    const res = mockRes();
    await addNote({ params: { id: 'x' }, body: { text: '<b></b>   ' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(doc.save).not.toHaveBeenCalled();
  });
});

describe('crmController.linkQuote (RFQ association, Section F)', () => {
  beforeEach(() => jest.clearAllMocks());

  const quoteLookup = (quote) => jest.spyOn(Quote, 'findOne').mockReturnValue({
    select: function () {
 return this; 
},
    lean: jest.fn().mockResolvedValue(quote),
  });

  it('links an existing quotation by reference only (no quote mutation)', async () => {
    quoteLookup({ _id: 'q1', quoteNumber: 'QT-2026-0007' });
    const doc = leadDoc({ status: 'qualified' });
    jest.spyOn(Lead, 'findById').mockResolvedValue(doc);
    const quoteCreate = jest.spyOn(Quote, 'create');
    const quoteSave = jest.spyOn(Quote.prototype, 'save');
    const res = mockRes();

    await linkQuote({ params: { id: 'x' }, body: { quote_number: 'QT-2026-0007' } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(doc.related_quotes).toHaveLength(1);
    expect(doc.related_quotes[0].quote_number).toBe('QT-2026-0007');
    expect(doc.related_quotes[0].items).toBeUndefined();
    expect(doc.rfq_status).toBe('requested');
    expect(doc.status).toBe('rfq');            // qualified → rfq is legal
    expect(doc.save).toHaveBeenCalledTimes(1);
    expect(quoteCreate).not.toHaveBeenCalled();
    expect(quoteSave).not.toHaveBeenCalled();
  });

  it('does not force an illegal transition when linking', async () => {
    quoteLookup({ _id: 'q1', quoteNumber: 'QT-2026-0008' });
    const doc = leadDoc({ status: 'new' });    // new → rfq is not a legal jump
    jest.spyOn(Lead, 'findById').mockResolvedValue(doc);
    const res = mockRes();

    await linkQuote({ params: { id: 'x' }, body: { quote_number: 'QT-2026-0008' } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(doc.related_quotes).toHaveLength(1);
    expect(doc.status).toBe('new');
    expect(doc.rfq_status).toBe('requested');
  });

  it('is idempotent for an already-linked quote', async () => {
    quoteLookup({ _id: 'q1', quoteNumber: 'QT-2026-0007' });
    const doc = leadDoc({ related_quotes: [{ quote_number: 'QT-2026-0007' }] });
    jest.spyOn(Lead, 'findById').mockResolvedValue(doc);
    const res = mockRes();
    await linkQuote({ params: { id: 'x' }, body: { quote_number: 'QT-2026-0007' } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(doc.related_quotes).toHaveLength(1);
    expect(doc.save).not.toHaveBeenCalled();
  });

  it('404s when the quotation does not exist', async () => {
    quoteLookup(null);
    const doc = leadDoc();
    jest.spyOn(Lead, 'findById').mockResolvedValue(doc);
    const res = mockRes();
    await linkQuote({ params: { id: 'x' }, body: { quote_number: 'QT-404' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(doc.save).not.toHaveBeenCalled();
  });

  it('400s when no quote reference is supplied', async () => {
    const res = mockRes();
    await linkQuote({ params: { id: 'x' }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('crmController.getLeadMetrics', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns counts computed from stored data only', async () => {
    jest.spyOn(Lead, 'countDocuments').mockResolvedValue(12);
    jest.spyOn(Lead, 'aggregate').mockImplementation((pipeline) => {
      const field = pipeline[1].$group._id.replace('$', '');
      const data = {
        status: [{ _id: 'new', count: 5 }, { _id: 'rfq', count: 3 }],
        source: [{ _id: 'google_ads', count: 6 }],
        organization_type: [{ _id: 'clinic', count: 7 }],
        district: [{ _id: 'Dhaka', count: 9 }],
        division: [{ _id: 'Dhaka', count: 9 }],
      };
      return Promise.resolve(data[field] || []);
    });
    const res = mockRes();

    await getLeadMetrics({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const m = bodyOf(res).data;
    expect(m.total).toBe(12);
    expect(m.by_status).toEqual({ new: 5, rfq: 3 });
    expect(m.by_source).toEqual({ google_ads: 6 });
    expect(m.by_organization_type).toEqual({ clinic: 7 });
    expect(m.by_district).toEqual({ Dhaka: 9 });
    expect(m.revenue).toBeUndefined();          // no fabricated metrics
    expect(m.conversion_rate).toBeUndefined();
  });
});


describe('crmController.getLead', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a stored lead', async () => {
    jest.spyOn(Lead, 'findById').mockReturnValue({
      lean: jest.fn().mockResolvedValue({ lead_id: 'LD-2026-0001', status: 'new', organization: 'Test Clinic (synthetic)' }),
    });
    const res = mockRes();
    await getLead({ params: { id: '507f1f77bcf86cd799439011' } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(bodyOf(res).data.lead_id).toBe('LD-2026-0001');
    expect(Lead.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('404s for an unknown lead', async () => {
    jest.spyOn(Lead, 'findById').mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const res = mockRes();
    await getLead({ params: { id: 'does-not-exist' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(bodyOf(res).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Phase 4.2-D §K — malformed ObjectId hardening for GET /api/crm/:id.
// ---------------------------------------------------------------------------
describe('crmController.getLead — malformed ObjectId hardening (§K)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('31. malformed id → standard 404 without touching findById (no CastError)', async () => {
    const findById = jest.spyOn(Lead, 'findById');
    const res = mockRes();
    await getLead({ params: { id: 'not-an-object-id' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(bodyOf(res).success).toBe(false);
    expect(bodyOf(res).message).toMatch(/not found/i);
    expect(JSON.stringify(bodyOf(res))).not.toMatch(/CastError|cast to ObjectId/i);
    expect(findById).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled(); // no 500 path, nothing to log
  });

  it('31b. malformed ids of every shape are rejected before the query', async () => {
    for (const id of ['', '123', 'zzzzzzzzzzzzzzzzzzzzzzzz', '507f1f77bcf86cd79943901', 'not a real id !!']) {
      const findById = jest.spyOn(Lead, 'findById');
      const res = mockRes();
      await getLead({ params: { id } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(findById).not.toHaveBeenCalled();
      jest.restoreAllMocks();
    }
  });

  it('32. valid but nonexistent ObjectId → 404', async () => {
    jest.spyOn(Lead, 'findById').mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const res = mockRes();
    await getLead({ params: { id: '507f1f77bcf86cd799439011' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(bodyOf(res).message).toMatch(/not found/i);
    expect(Lead.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('33. valid existing id → behaviour unchanged (200 + lean document)', async () => {
    const stored = { lead_id: 'LD-2026-0007', status: 'rfq', organization: 'Test Clinic (synthetic)' };
    jest.spyOn(Lead, 'findById').mockReturnValue({ lean: jest.fn().mockResolvedValue(stored) });
    const res = mockRes();
    await getLead({ params: { id: '507f1f77bcf86cd799439011' } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(bodyOf(res).data).toEqual(stored);
    expect(Lead.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });
});

