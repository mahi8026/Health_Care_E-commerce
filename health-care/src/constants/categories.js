/**
 * Category slug mappings
 * Shared between category pages and other components
 */

// ── Slug ↔ Category name mapping ─────────────────────────────────────────────
export const CATEGORY_SLUG_MAP = {
  // Original 8 categories
  'diagnostic-equipment':  'Diagnostic Equipment',
  'surgical-instruments':  'Surgical Instruments',
  'laboratory-reagents':   'Laboratory Reagents',
  'hospital-machines':     'Hospital Machines',
  'lab-equipment':         'Lab Equipment',
  'laboratory-equipment':  'Laboratory Equipment',
  'ppe-safety':            'PPE & Safety',
  'dental-equipment':      'Dental Equipment',
  'implants-ortho':        'Implants & Ortho',
  
  // Additional categories (18 total in database)
  'orthopedic-supports':   'Orthopedic Supports',
  'surgical-wound-care':   'Surgical & Wound Care',
  'consumables':           'Consumables',
  'diabetes-care':         'Diabetes Care',
  'ophthalmology-ent-equipment': 'Ophthalmology & ENT Equipment',
  'iv-infusion-therapy':   'IV & Infusion Therapy',
  'physiotherapy-rehabilitation': 'Physiotherapy & Rehabilitation',
  'medical-supplies':      'Medical Supplies',
  'blood-bank-supplies':   'Blood Bank Supplies',
  'respiratory-equipment': 'Respiratory Equipment',
  'medical-devices':       'Medical Devices',
  'compression-garments':  'Compression Garments',
  'diagnostic-devices':    'Diagnostic Devices',
};

// Reverse map: category name → slug
export const CATEGORY_NAME_TO_SLUG = Object.fromEntries(
  Object.entries(CATEGORY_SLUG_MAP).map(([slug, name]) => [name, slug])
);
