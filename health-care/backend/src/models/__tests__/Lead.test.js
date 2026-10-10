/**
 * Phase 4.2 — CRM Lead model tests (no database required).
 *
 * Covers: schema validation, enum rejection, status transitions,
 * attribution persistence (4 UTM keys only), note sanitisation,
 * source derivation from the Phase 4.1 UTM tuple.
 *
 * All data is synthetic and clearly marked.
 */

const Lead = require('../Lead');

const baseLead = () => ({
  organization: 'Test Diagnostic Centre (synthetic)',
  organization_type: 'diagnostic_centre',
  district: 'Dhaka',
  division: 'Dhaka',
  phone: '01712345678',
  contact_name: 'Synthetic Contact',
  source: 'organic',
});

describe('Lead schema validation', () => {
  it('accepts a minimal valid lead', () => {
    const lead = new Lead(baseLead());
    const err = lead.validateSync();
    expect(err).toBeUndefined();
    expect(lead.status).toBe('new');
    expect(lead.rfq_status).toBe('none');
    expect(lead.customer_status).toBe('prospect');
    expect(lead.lead_quality).toBe('unrated');
    expect(lead.related_quotes).toEqual([]);
    expect(lead.notes).toEqual([]);
  });

  it('rejects a lead missing required business fields', () => {
    const err = new Lead({}).validateSync();
    expect(err).toBeDefined();
    expect(Object.keys(err.errors).sort()).toEqual(
      ['district', 'division', 'organization', 'organization_type', 'phone', 'source'].sort()
    );
  });

  it('rejects an invalid organization_type', () => {
    const err = new Lead({ ...baseLead(), organization_type: 'spaceship' }).validateSync();
    expect(err.errors.organization_type).toBeDefined();
    expect(err.errors.organization_type.message).toMatch(/is not a valid enum value/);
  });

  it('rejects an invalid status', () => {
    expect(new Lead({ ...baseLead(), status: 'qualified-ish' }).validateSync().errors.status).toBeDefined();
  });

  it('rejects an invalid source (Phase 4.1 lead_source enum only)', () => {
    expect(new Lead({ ...baseLead(), source: 'paid-search' }).validateSync().errors.source).toBeDefined();
  });

  it('rejects an over-long note', () => {
    const err = new Lead({ ...baseLead(), notes: [{ text: 'x'.repeat(2001) }] }).validateSync();
    expect(err.errors['notes.0.text']).toBeDefined();
  });

  it('does not persist arbitrary CRM fields outside the contract', () => {
    // strict:true is the Mongoose default for this schema, so non-contract
    // keys (utm_term, gclid, etc.) are dropped rather than stored.
    const lead = new Lead({ ...baseLead(), gclid: 'ABCD-1234', utm_term: 'nope', _internal: 1 });
    expect(lead.toObject().gclid).toBeUndefined();
    expect(lead.toObject().utm_term).toBeUndefined();
    expect(lead.toObject()._internal).toBeUndefined();
    expect(lead.validateSync()).toBeUndefined();
  });
});

describe('Lead status lifecycle', () => {
  it('allows the documented forward path', () => {
    expect(Lead.canTransition('new', 'contacted')).toBe(true);
    expect(Lead.canTransition('contacted', 'qualified')).toBe(true);
    expect(Lead.canTransition('qualified', 'rfq')).toBe(true);
    expect(Lead.canTransition('rfq', 'quoted')).toBe(true);
    expect(Lead.canTransition('quoted', 'won')).toBe(true);
    expect(Lead.canTransition('lost', 'dormant')).toBe(true);
    expect(Lead.canTransition('dormant', 'contacted')).toBe(true);
  });

  it('rejects illegal jumps (new → won, terminal won)', () => {
    expect(Lead.canTransition('new', 'won')).toBe(false);
    expect(Lead.canTransition('contacted', 'won')).toBe(false);
    expect(Lead.canTransition('won', 'rfq')).toBe(false);
    expect(Lead.canTransition('won', 'lost')).toBe(false);
  });

  it('treats same-state as a no-op and rejects missing inputs', () => {
    expect(Lead.canTransition('rfq', 'rfq')).toBe(true);
    expect(Lead.canTransition(null, 'rfq')).toBe(false);
    expect(Lead.canTransition('rfq', undefined)).toBe(false);
  });

  it('exposes exactly the contract status vocabulary', () => {
    expect(Lead.LEAD_STATUSES).toEqual([
      'new', 'verified', 'contacted', 'qualified', 'rfq', 'quoted', 'won', 'lost', 'dormant',
    ]);
  });
});

describe('Lead attribution persistence (Phase 4.1 integration)', () => {
  it('keeps only the four allowlisted UTM keys', () => {
    expect(Lead.sanitizeAttribution({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'phase42-test',
      utm_content: 'test-a',
      utm_term: 'SHOULD_NOT_PERSIST',
      gclid: 'ABCDEF',
      phone: '01712345678',
    })).toEqual({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'phase42-test',
      utm_content: 'test-a',
    });
  });

  it('trims and caps values at 64 chars, dropping empties', () => {
    const out = Lead.sanitizeAttribution({ utm_source: `  ${'x'.repeat(200)}  `, utm_medium: '   ' });
    expect(out.utm_source).toHaveLength(64);
    expect(out.utm_medium).toBeUndefined();
    expect(out.utm_term).toBeUndefined();
  });

  it('derives lead_source from the documented UTM mapping', () => {
    expect(Lead.deriveLeadSource({ utm_source: 'google', utm_medium: 'cpc' })).toBe('google_ads');
    expect(Lead.deriveLeadSource({ utm_source: 'facebook', utm_medium: 'paid_social' })).toBe('meta');
    expect(Lead.deriveLeadSource({ utm_source: 'instagram' })).toBe('meta');
    expect(Lead.deriveLeadSource({ utm_source: 'partner-biomed', utm_medium: 'referral' })).toBe('referral');
    expect(Lead.deriveLeadSource({})).toBe('organic');
    expect(Lead.deriveLeadSource({}, { whatsappDirect: true })).toBe('whatsapp_direct');
    expect(Lead.deriveLeadSource({}, { isRepeatCustomer: true })).toBe('existing_customer');
  });

  it('persists attribution onto the document as first-touch fields', () => {
    const utm = Lead.sanitizeAttribution({ utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'q3' });
    const lead = new Lead({
      ...baseLead(),
      source: Lead.deriveLeadSource(utm),
      medium: utm.utm_medium,
      campaign: utm.utm_campaign,
      content: utm.utm_content,
      landing_page: '/guides/ecg-guide',
      first_touch_at: new Date('2026-10-01T10:00:00Z'),
    });
    expect(lead.validateSync()).toBeUndefined();
    expect(lead.source).toBe('google_ads');
    expect(lead.medium).toBe('cpc');
    expect(lead.campaign).toBe('q3');
    expect(lead.landing_page).toBe('/guides/ecg-guide');
    expect(lead.first_touch_at.toISOString()).toBe('2026-10-01T10:00:00.000Z');
  });
});

describe('Lead note sanitisation', () => {
  it('strips markup and control characters', () => {
    const out = Lead.sanitizeNote('  Call <script>alert(1)</script> back\u0000 tomorrow  ');
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
    expect(out).not.toContain('\u0000');
    expect(out).toContain('Call');
    expect(out.trim()).toBe(out);
  });

  it('caps length at 2000 and returns empty for non-strings', () => {
    expect(Lead.sanitizeNote('y'.repeat(5000))).toHaveLength(2000);
    expect(Lead.sanitizeNote(null)).toBe('');
    expect(Lead.sanitizeNote(undefined)).toBe('');
    expect(Lead.sanitizeNote({ text: 'x' })).toBe('');
  });
});

describe('Lead quote association shape (no quote duplication)', () => {
  it('stores only a reference, never quotation payload', () => {
    const lead = new Lead({
      ...baseLead(),
      related_quotes: [{ quote_number: 'QT-2026-0001' }],
      rfq_status: 'requested',
    });
    expect(lead.validateSync()).toBeUndefined();
    const stored = lead.toObject().related_quotes[0];
    expect(stored).toEqual(expect.objectContaining({ quote_number: 'QT-2026-0001' }));
    expect(stored.items).toBeUndefined();
    expect(stored.finalAmount).toBeUndefined();
    expect(stored.paymentTerms).toBeUndefined();
    expect(stored.subtotal).toBeUndefined();
  });
});


// ═══ Phase 4.2-B additions — data-foundation coverage (synthetic data) ═════

const runPreSave = (doc) =>
  new Promise((resolve, reject) => {
    Lead.schema.s.hooks.execPre('save', doc, [], (err) => (err ? reject(err) : resolve()));
  });

describe('Lead field validation (Phase 4.2-B)', () => {
  it.each(['organization', 'organization_type', 'district', 'division', 'phone'])(
    'rejects a lead missing %s',
    (field) => {
      const payload = { ...baseLead() };
      delete payload[field];
      const err = new Lead(payload).validateSync();
      expect(err).toBeDefined();
      expect(err.errors[field]).toBeDefined();
    }
  );

  it('rejects an organisation shorter than 2 characters', () => {
    const err = new Lead({ ...baseLead(), organization: 'A' }).validateSync();
    expect(err.errors.organization).toBeDefined();
  });

  it.each([
    ['phone', 'call-me-maybe'], // not the approved phone shape
    ['phone', '12'], // shorter than 6 chars
    ['email', 'not-an-email'],
    ['email', 'missing@tld'],
    ['website', 'mediportbd.com'], // must use http:// or https://
    ['website', 'ftp://mediportbd.com'],
    ['lead_quality', 'lukewarm'],
  ])('rejects an invalid %s value (%s)', (field, value) => {
    expect(new Lead({ ...baseLead(), [field]: value }).validateSync().errors[field]).toBeDefined();
  });

  it('accepts approved phone/email/website shapes and lowercases email', () => {
    const lead = new Lead({
      ...baseLead(),
      phone: '+880-17-123456',
      email: 'Contact@Sunrise.Example.com',
      website: 'https://www.mediportbd.com',
    });
    expect(lead.validateSync()).toBeUndefined();
    expect(lead.email).toBe('contact@sunrise.example.com');
  });

  it('treats empty optional email/website as absent', () => {
    expect(new Lead({ ...baseLead(), email: '', website: '' }).validateSync()).toBeUndefined();
  });

  it('caps medium/campaign/content at 64 chars at the schema level', () => {
    const err = new Lead({
      ...baseLead(),
      medium: 'x'.repeat(65),
      campaign: 'x'.repeat(65),
      content: 'x'.repeat(65),
    }).validateSync();
    expect(err.errors.medium).toBeDefined();
    expect(err.errors.campaign).toBeDefined();
    expect(err.errors.content).toBeDefined();
  });
});

describe('Lead id generation & uniqueness (offline, no database)', () => {
  it('declares a unique database index on lead_id and lead_id only', () => {
    expect(Lead.schema.path('lead_id').options.unique).toBe(true);
    const uniqueKeys = Lead.schema
      .indexes()
      .filter(([, opts]) => opts && opts.unique)
      .map(([key]) => Object.keys(key));
    expect(uniqueKeys).toEqual([['lead_id']]);
  });

  it('generates LD-YYYY-NNNN via the pre-save hook and retries on collision', async () => {
    const lead = new Lead(baseLead()); // fixture carries no lead_id — generator owns it
    expect(lead.lead_id).toBeUndefined();
    const chainFor = (value) => ({
      sort: () => chainFor(value),
      select: () => chainFor(value),
      lean: async () => value,
    });
    let existsCalls = 0;
    const spy = jest.spyOn(Lead, 'findOne').mockImplementation((query) => {
      if (typeof query.lead_id === 'string') {
        existsCalls += 1;
        return chainFor(existsCalls <= 2 ? { _id: 'collision' } : null); // first two taken
      }
      return chainFor(null); // no lead recorded this year yet
    });
    await runPreSave(lead);
    spy.mockRestore();
    expect(lead.lead_id).toBe(`LD-${new Date().getFullYear()}-0003`);
    expect(existsCalls).toBe(3);
  });

  it('leaves an explicitly provided lead_id untouched (hook skips)', async () => {
    const lead = new Lead({ ...baseLead(), lead_id: 'LD-2026-0042' });
    const spy = jest.spyOn(Lead, 'findOne');
    await runPreSave(lead);
    expect(spy).not.toHaveBeenCalled();
    expect(lead.lead_id).toBe('LD-2026-0042');
    spy.mockRestore();
  });

  it('accepts only the LD-YYYY-NNNN format', () => {
    expect(new Lead({ ...baseLead(), lead_id: 'LD-2026-0001' }).validateSync()).toBeUndefined();
    expect(new Lead({ ...baseLead(), lead_id: 'LEAD-1' }).validateSync().errors.lead_id).toBeDefined();
    expect(new Lead({ ...baseLead(), lead_id: 'LD-2026-1' }).validateSync().errors.lead_id).toBeDefined();
    expect(new Lead({ ...baseLead(), lead_id: '507f1f77bcf86cd799439011' }).validateSync().errors.lead_id).toBeDefined();
  });
});

describe('Note data quality (Phase 4.2A O-5)', () => {
  it('rejects markup-only and whitespace-only input at the helper level', () => {
    expect(Lead.sanitizeNote('<b></b>')).toBe('');
    expect(Lead.sanitizeNote('<script></script>')).toBe('');
    expect(Lead.sanitizeNote('<script>alert(1)</script>')).toBe('');
    expect(Lead.sanitizeNote('<>')).toBe('');
    expect(Lead.sanitizeNote('   \n  ')).toBe('');
    expect(Lead.sanitizeNote('')).toBe('');
  });

  it('accepts a normal business note unchanged', () => {
    expect(Lead.sanitizeNote('Need quotation for 3 ECG machines')).toBe('Need quotation for 3 ECG machines');
  });

  it('strips embedded markup from mixed content', () => {
    const out = Lead.sanitizeNote('Quotation for <b>3 ECG</b> machines <img src=x onerror=alert(1)>');
    expect(out).toBe('Quotation for 3 ECG machines');
    expect(out).not.toContain('<');
  });

  it('rejects raw markup at the schema level (defence in depth)', () => {
    const err = new Lead({ ...baseLead(), notes: [{ text: '<b></b>' }] }).validateSync();
    expect(err.errors['notes.0.text']).toBeDefined();
  });

  it('accepts a normal note on the document', () => {
    const lead = new Lead({ ...baseLead(), notes: [{ text: 'Need quotation for 3 ECG machines' }] });
    expect(lead.validateSync()).toBeUndefined();
    expect(lead.notes[0].by).toBe('admin');
  });

  it('caps notes at 100 entries (100 ok, 101 rejected)', () => {
    const many = (n) => Array.from({ length: n }, (_, i) => ({ text: `note ${i}` }));
    expect(new Lead({ ...baseLead(), notes: many(100) }).validateSync()).toBeUndefined();
    expect(new Lead({ ...baseLead(), notes: many(101) }).validateSync().errors.notes).toBeDefined();
  });
});

describe('Customer reference (Section G — optional by design)', () => {
  it('permits a prospect lead with no customer reference', () => {
    const lead = new Lead(baseLead());
    expect(lead.validateSync()).toBeUndefined();
    expect(lead.customer).toBe(null);
  });

  it('accepts a syntactically valid ObjectId reference', () => {
    expect(new Lead({ ...baseLead(), customer: '507f1f77bcf86cd799439011' }).validateSync()).toBeUndefined();
  });

  it('rejects a malformed customer id', () => {
    expect(new Lead({ ...baseLead(), customer: 'not-an-objectid' }).validateSync().errors.customer).toBeDefined();
  });
  // O-4 boundary: referential EXISTENCE is validated in the 4.2-C API layer —
  // never by hidden model hooks (the schema layer stays free of DB side effects).
});

describe('Reference integrity & non-duplication (Sections D/H, O-1/O-2/O-3)', () => {
  it('exposes exactly the quote reference fields inside related_quotes', () => {
    expect(Object.keys(Lead.schema.path('related_quotes').schema.paths).sort()).toEqual([
      'linked_at',
      'quote',
      'quote_number',
    ]);
  });

  it('has no quotation pricing or order payload paths on the lead document', () => {
    ['items', 'prices', 'subtotal', 'total', 'finalAmount', 'unitPrice', 'paymentTerms', 'deliveryAddress', 'quote_number'].forEach(
      (path) => expect(Lead.schema.path(path)).toBeUndefined()
    );
  });

  it('does NOT impose DB uniqueness on organization/phone/email (O-3)', () => {
    expect(Lead.schema.path('organization').options.unique).toBeFalsy();
    expect(Lead.schema.path('phone').options.unique).toBeFalsy();
    expect(Lead.schema.path('email').options.unique).toBeFalsy();
    const uniqueKeys = Lead.schema
      .indexes()
      .filter(([, opts]) => opts && opts.unique)
      .map(([key]) => Object.keys(key));
    expect(uniqueKeys).toEqual([['lead_id']]); // lead_id is the only unique key
  });
});

describe('Attribution boundaries, timestamps & lifecycle separation', () => {
  it('has no schema path for utm_term or gclid (4 UTM keys only)', () => {
    expect(Lead.schema.path('utm_term')).toBeUndefined();
    expect(Lead.schema.path('gclid')).toBeUndefined();
    expect(Lead.UTM_KEYS).toEqual(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']);
    ['source', 'medium', 'campaign', 'content', 'landing_page'].forEach((p) =>
      expect(Lead.schema.path(p)).toBeDefined()
    );
  });

  it('enables timestamps with created_at/updated_at keys', () => {
    expect(Lead.schema.options.timestamps).toEqual({ createdAt: 'created_at', updatedAt: 'updated_at' });
  });

  it('rejects impossible (future) client touch timestamps, accepts past ones', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(new Lead({ ...baseLead(), first_touch_at: future }).validateSync().errors.first_touch_at).toBeDefined();
    expect(new Lead({ ...baseLead(), last_touch_at: future }).validateSync().errors.last_touch_at).toBeDefined();
    const past = new Date('2026-01-01T00:00:00Z');
    expect(new Lead({ ...baseLead(), first_touch_at: past, last_touch_at: past }).validateSync()).toBeUndefined();
  });

  it('keeps lead status, rfq_status and customer_status strictly separate', () => {
    const lead = new Lead({ ...baseLead(), status: 'quoted', rfq_status: 'negotiating', customer_status: 'first_order' });
    expect(lead.validateSync()).toBeUndefined();
    // rfq_status='negotiating' is NOT a lead status:
    expect(new Lead({ ...baseLead(), status: 'negotiating' }).validateSync().errors.status).toBeDefined();
    expect(new Lead({ ...baseLead(), rfq_status: 'negotiation' }).validateSync().errors.rfq_status).toBeDefined();
    expect(new Lead({ ...baseLead(), customer_status: 'negotiating' }).validateSync().errors.customer_status).toBeDefined();
  });

  it('locks lead_status to the authoritative contract enum (NEGOTIATION/NURTURE pending contract decision — see 4.2-B report)', () => {
    expect(Lead.LEAD_STATUSES).toEqual([
      'new', 'verified', 'contacted', 'qualified', 'rfq', 'quoted', 'won', 'lost', 'dormant',
    ]);
    expect(Lead.LEAD_STATUSES).not.toContain('negotiation');
    expect(Lead.LEAD_STATUSES).not.toContain('nurture');
  });
});

describe('Duplicate-lead strategy helpers (O-3 — application level, never auto-reject)', () => {
  it('normalises phone spellings to one digit key', () => {
    expect(Lead.normalizePhoneKey('01712345678')).toBe('1712345678');
    expect(Lead.normalizePhoneKey('+880-17-12345678')).toBe('1712345678');
    expect(Lead.normalizePhoneKey('880 17 12345678')).toBe('1712345678');
    expect(Lead.normalizePhoneKey('')).toBe('');
    expect(Lead.normalizePhoneKey(null)).toBe('');
  });

  it('normalises organisation and email keys (case/spacing-insensitive)', () => {
    expect(Lead.normalizeOrgKey('  Sunrise   Diagnostic CENTRE ')).toBe('sunrise diagnostic centre');
    expect(Lead.normalizeEmailKey(' Contact@Sunrise.Example.COM ')).toBe('contact@sunrise.example.com');
    expect(Lead.normalizeOrgKey(undefined)).toBe('');
  });

  it('builds a narrow candidate $or query for future API dedupe lookups', () => {
    expect(Lead.buildDuplicateCandidateQuery({})).toBeNull();
    const q = Lead.buildDuplicateCandidateQuery({
      organization: 'Sunrise Diagnostic Centre',
      phone: '01712345678',
      email: 'contact@sunrise.example.com',
    });
    expect(q.$or).toHaveLength(3);
    expect(q.$or[0].organization.$options).toBe('i');
    expect(q.$or[1]).toEqual({ email: 'contact@sunrise.example.com' });
    expect(new RegExp(q.$or[2].phone.$regex).test('01712345678')).toBe(true);
    expect(new RegExp(q.$or[2].phone.$regex).test('+880 17 12345678')).toBe(true);
    expect(new RegExp(q.$or[2].phone.$regex).test('01799999999')).toBe(false);
  });

  it('flags potential duplicates without ever merging or rejecting records', () => {
    const existing = {
      organization: 'Sunrise Diagnostic Centre',
      district: 'Dhaka',
      phone: '01712345678',
      email: 'contact@sunrise.example.com',
    };
    // same facility, case/spacing differences → potential duplicate
    expect(Lead.isPotentialDuplicate(existing, { organization: 'sunrise  diagnostic centre', district: 'dhaka' })).toBe(true);
    // same organisation but a different district → a different branch, NOT a duplicate
    expect(Lead.isPotentialDuplicate(existing, { organization: 'Sunrise Diagnostic Centre', district: 'Chattogram' })).toBe(false);
    // shared switchboard, different formatting → potential duplicate
    expect(Lead.isPotentialDuplicate(existing, { phone: '+880 17 12345678' })).toBe(true);
    // same inbox, different case → potential duplicate
    expect(Lead.isPotentialDuplicate(existing, { email: 'CONTACT@SUNRISE.EXAMPLE.COM' })).toBe(true);
    expect(Lead.isPotentialDuplicate(existing, { organization: 'Other Centre', district: 'Dhaka' })).toBe(false);
    expect(Lead.isPotentialDuplicate({}, {})).toBe(false);
  });
});




