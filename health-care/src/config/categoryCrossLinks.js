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
