/**
 * Category slug mappings
 * Slugs must exactly match the 'slug' field in the MongoDB Category collection.
 * DB source of truth: run `node backend/final-verification.js` to verify.
 */

// ── Slug ↔ Category name mapping ─────────────────────────────────────────────
export const CATEGORY_SLUG_MAP = {
  'diagnostic-equipment':            'Diagnostic Equipment',
  'surgical-instruments':            'Surgical Instruments',
  'laboratory-reagents':             'Laboratory Reagents',
  'laboratory-equipment':            'Laboratory Equipment',
  'hospital-machines':               'Hospital Machines',
  'ppe-and-safety':                  'PPE & Safety',
  'orthopedic-supports':             'Orthopedic Supports',
  'surgical-and-wound-care':         'Surgical & Wound Care',
  'consumables':                     'Consumables',
  'diabetes-care':                   'Diabetes Care',
  'ophthalmology-and-ent-equipment': 'Ophthalmology & ENT Equipment',
  'iv-and-infusion-therapy':         'IV & Infusion Therapy',
  'physiotherapy-and-rehabilitation':'Physiotherapy & Rehabilitation',
  'medical-supplies':                'Medical Supplies',
  'blood-bank-supplies':             'Blood Bank Supplies',
  'respiratory-equipment':           'Respiratory Equipment',
  'medical-devices':                 'Medical Devices',
  'compression-garments':            'Compression Garments',
  'diagnostic-devices':              'Diagnostic Devices',
  'mobility-aids':                   'Mobility Aids',
};

// Reverse map: category name → slug
export const CATEGORY_NAME_TO_SLUG = Object.fromEntries(
  Object.entries(CATEGORY_SLUG_MAP).map(([slug, name]) => [name, slug])
);
