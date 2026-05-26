/**
 * Category slug mappings
 * Shared between category pages and other components
 */

// ── Slug ↔ Category name mapping ─────────────────────────────────────────────
export const CATEGORY_SLUG_MAP = {
  'diagnostic-equipment':  'Diagnostic Equipment',
  'surgical-instruments':  'Surgical Instruments',
  'laboratory-reagents':   'Laboratory Reagents',
  'hospital-machines':     'Hospital Machines',
  'lab-equipment':         'Lab Equipment',
  'ppe-safety':            'PPE & Safety',
  'dental-equipment':      'Dental Equipment',
  'implants-ortho':        'Implants & Ortho',
};

// Reverse map: category name → slug
export const CATEGORY_NAME_TO_SLUG = Object.fromEntries(
  Object.entries(CATEGORY_SLUG_MAP).map(([slug, name]) => [name, slug])
);
