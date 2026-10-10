/**
 * Category cross-link map for MediportBD
 *
 * Maps each category slug to related topic hubs (/topics/<slug>) and
 * equipment price pages (/equipment/<slug>).
 *
 * Used by the category landing page to inject server-rendered internal links
 * that pass authority from category pages to topic and equipment pages —
 * helping Google index and rank the full content hierarchy.
 */

import { CATEGORY_SLUG_MAP } from '@/constants/categories';

export const CATEGORY_CROSS_LINKS = {
  'diagnostic-equipment': {
    topics: [
      { slug: 'ecg-machines', label: 'ECG Machines in Bangladesh' },
      { slug: 'blood-pressure-monitors', label: 'Blood Pressure Monitors' },
      { slug: 'ultrasound-machines', label: 'Ultrasound Machines' },
    ],
    equipment: [
      { slug: 'ecg-machine-price-bangladesh', label: 'ECG Machine Prices 2026' },
      { slug: 'blood-pressure-monitor-price-bangladesh', label: 'BP Monitor Prices' },
      { slug: 'ultrasound-machine-price-bangladesh', label: 'Ultrasound Prices' },
      { slug: 'pulse-oximeter-price-bangladesh', label: 'Pulse Oximeter Prices' },
      { slug: 'patient-monitor-price-bangladesh', label: 'Patient Monitor Prices' },
    ],
  },
  'surgical-instruments': {
    topics: [
      { slug: 'surgical-instruments', label: 'Surgical Instruments Guide' },
    ],
    equipment: [
      { slug: 'surgical-instruments-price-bangladesh', label: 'Surgical Instruments Prices 2026' },
    ],
  },
  'laboratory-reagents': {
    topics: [
      { slug: 'laboratory-equipment-reagents', label: 'Laboratory Equipment & Reagents' },
    ],
    equipment: [
      { slug: 'microscope-price-bangladesh', label: 'Microscope Prices' },
      { slug: 'autoclave-price-bangladesh', label: 'Autoclave Prices' },
    ],
  },
  'laboratory-equipment': {
    topics: [
      { slug: 'laboratory-equipment-reagents', label: 'Laboratory Equipment & Reagents' },
    ],
    equipment: [
      { slug: 'microscope-price-bangladesh', label: 'Microscope Prices 2026' },
      { slug: 'autoclave-price-bangladesh', label: 'Autoclave Prices 2026' },
    ],
  },
  'hospital-machines': {
    topics: [
      { slug: 'hospital-icu-equipment', label: 'Hospital & ICU Equipment' },
    ],
    equipment: [
      { slug: 'patient-monitor-price-bangladesh', label: 'Patient Monitor Prices 2026' },
      { slug: 'ventilator-price-bangladesh', label: 'Ventilator Prices 2026' },
      { slug: 'infusion-pump-price-bangladesh', label: 'Infusion Pump Prices 2026' },
    ],
  },
  'diabetes-care': {
    topics: [
      { slug: 'diabetes-care', label: 'Diabetes Care Products' },
    ],
    equipment: [
      { slug: 'glucose-meter-price-bangladesh', label: 'Glucose Meter Prices 2026' },
    ],
  },
  'respiratory-equipment': {
    topics: [
      { slug: 'hospital-icu-equipment', label: 'Hospital & ICU Equipment' },
    ],
    equipment: [
      { slug: 'nebulizer-price-bangladesh', label: 'Nebulizer Prices 2026' },
      { slug: 'ventilator-price-bangladesh', label: 'Ventilator Prices 2026' },
    ],
  },
  'orthopedic-supports': {
    topics: [],
    equipment: [],
  },
  'surgical-and-wound-care': {
    topics: [
      { slug: 'surgical-instruments', label: 'Surgical Instruments Guide' },
    ],
    equipment: [
      { slug: 'surgical-instruments-price-bangladesh', label: 'Surgical Instruments Prices' },
    ],
  },
  'consumables': {
    topics: [
      { slug: 'hospital-icu-equipment', label: 'Hospital & ICU Equipment' },
    ],
    equipment: [
      { slug: 'infusion-pump-price-bangladesh', label: 'Infusion Pump Prices' },
    ],
  },
  'iv-and-infusion-therapy': {
    topics: [
      { slug: 'hospital-icu-equipment', label: 'Hospital & ICU Equipment' },
    ],
    equipment: [
      { slug: 'infusion-pump-price-bangladesh', label: 'Infusion Pump Prices 2026' },
    ],
  },
  'ppe-and-safety': {
    topics: [],
    equipment: [],
  },
  'blood-bank-supplies': {
    topics: [
      { slug: 'hospital-icu-equipment', label: 'Hospital & ICU Equipment' },
    ],
    equipment: [],
  },
  'physiotherapy-and-rehabilitation': {
    topics: [],
    equipment: [],
  },
  'ophthalmology-and-ent-equipment': {
    topics: [],
    equipment: [],
  },
  'compression-garments': {
    topics: [],
    equipment: [],
  },
  'medical-supplies': {
    topics: [],
    equipment: [],
  },
  'medical-devices': {
    topics: [
      { slug: 'ecg-machines', label: 'ECG Machines Guide' },
      { slug: 'blood-pressure-monitors', label: 'BP Monitors Guide' },
    ],
    equipment: [
      { slug: 'ecg-machine-price-bangladesh', label: 'ECG Machine Prices' },
      { slug: 'blood-pressure-monitor-price-bangladesh', label: 'BP Monitor Prices' },
    ],
  },
  'diagnostic-devices': {
    topics: [
      { slug: 'blood-pressure-monitors', label: 'BP Monitors Guide' },
      { slug: 'diabetes-care', label: 'Diabetes Care Products' },
    ],
    equipment: [
      { slug: 'blood-pressure-monitor-price-bangladesh', label: 'BP Monitor Prices' },
      { slug: 'glucose-meter-price-bangladesh', label: 'Glucose Meter Prices' },
      { slug: 'pulse-oximeter-price-bangladesh', label: 'Pulse Oximeter Prices' },
    ],
  },
  'mobility-aids': {
    topics: [],
    equipment: [],
  },
};

/**
 * Get cross-links for a given category slug.
 * Returns { topics, equipment } arrays or empty arrays if not mapped.
 */
export function getCategoryCrossLinks(slug) {
  return CATEGORY_CROSS_LINKS[slug] || { topics: [], equipment: [] };
}

// ── WS-3D2-C (Phase 3D.2-C) — contextual reverse-category edges ─────────────
//
// CATEGORY_CROSS_LINKS above is the single relationship source. Category pages
// render its forward edges (category → topic / equipment); topic and equipment
// pages need the reverse edge (topic / equipment → approved category). These
// accessors only invert what the registry already declares — no category, slug,
// or relationship is added here. Massager and Baby & Mom Care stay absent because
// they are deliberately not keys in this registry (approved registration does
// not imply a cross-link).

/** Maximum contextual category links rendered on any single source page. */
export const MAX_RELATED_CATEGORIES = 4;

/**
 * Category hrefs the site chrome already renders in first-byte HTML on every
 * page — the footer "Products" column (layout/Footer.jsx: Diagnostic
 * Equipment, Surgical Instruments, Hospital Machines; its Laboratory Reagents
 * item links /reagent-store, not a category URL). Excluding them upholds the
 * URL-safety rule "must not duplicate another rendered link" for every page
 * this workstream touches.
 */
const CHROME_LINKED_CATEGORIES = new Set([
  'diagnostic-equipment',
  'surgical-instruments',
  'hospital-machines',
]);

function buildReverseIndex(field) {
  const index = new Map();
  for (const [categorySlug, links] of Object.entries(CATEGORY_CROSS_LINKS)) {
    // URL safety: only approved taxonomy slugs become linkable categories, so
    // every generated href is an existing canonical /products/category/<slug> URL.
    if (!Object.prototype.hasOwnProperty.call(CATEGORY_SLUG_MAP, categorySlug)) continue;
    for (const entry of links[field] || []) {
      if (!entry || typeof entry.slug !== 'string') continue;
      if (!index.has(entry.slug)) index.set(entry.slug, []);
      const list = index.get(entry.slug);
      if (!list.some((cat) => cat.slug === categorySlug)) {
        list.push({ slug: categorySlug, name: CATEGORY_SLUG_MAP[categorySlug] });
      }
    }
  }
  return index;
}

const REVERSE_TOPIC_INDEX = buildReverseIndex('topics');
const REVERSE_EQUIPMENT_INDEX = buildReverseIndex('equipment');

/**
 * Reverse edges for a topic hub (/topics/<slug>): the approved categories that
 * already declare this topic. Registry order is preserved; `excludeSlug` drops
 * the category the source page already links and the footer-chrome categories
 * are always dropped (no duplicate rendered links); the result is capped at
 * MAX_RELATED_CATEGORIES. Returns [] when no reverse relationship exists so
 * the caller renders no block at all.
 */
export function getRelatedCategoriesForTopic(topicSlug, excludeSlug) {
  return (REVERSE_TOPIC_INDEX.get(topicSlug) || [])
    .filter((cat) => cat.slug !== excludeSlug && !CHROME_LINKED_CATEGORIES.has(cat.slug))
    .slice(0, MAX_RELATED_CATEGORIES);
}

/** Same contract for equipment price guides (/equipment/<slug>). */
export function getRelatedCategoriesForEquipment(equipmentSlug, excludeSlug) {
  return (REVERSE_EQUIPMENT_INDEX.get(equipmentSlug) || [])
    .filter((cat) => cat.slug !== excludeSlug && !CHROME_LINKED_CATEGORIES.has(cat.slug))
    .slice(0, MAX_RELATED_CATEGORIES);
}
