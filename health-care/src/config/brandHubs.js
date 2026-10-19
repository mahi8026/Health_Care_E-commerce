/**
 * Brand hub registry — every `/brands/<slug>` hub published on the storefront.
 *
 * WHY THIS EXISTS
 * `utils/productSeoLinks.js` runs inside a client component, so it cannot call
 * the `/manufacturers` API that powers `/brands` and `sitemap-brands.xml`. It
 * validates a product's brand against static registries instead
 * (`LANDING_PAGES[].brandSlugs`, `TOPICAL_CLUSTERS[].brandSlugs`, `BRAND_GEO`).
 * Brands whose hubs exist but which appeared in none of those registries were
 * silently getting no brand link — including Tynor, the largest family in the
 * catalog (63 SKUs).
 *
 * PROVENANCE / HOW TO REFRESH
 * Every slug below was verified on 2026-10-12 against production:
 *   (a) present in https://www.mediportbd.com/sitemap-brands.xml, and
 *   (b) HTTP 200 at https://www.mediportbd.com/brands/<slug>.
 * Refresh with:
 *   curl -s https://www.mediportbd.com/sitemap-brands.xml
 * Update 2026-10-18: added biohermes, mediron, savlon, sritrang and
 * united-medicare — each verified in sitemap-brands.xml and HTTP 200 at
 * /brands/<slug> on 2026-10-18 (hub product counts 1, 6, 1, 1 and 20).
 *
 * Rules: lowercase, hyphenated, byte-identical to the hub path, and NEVER add a
 * slug whose hub does not exist — the resolver would emit a 404 link.
 *
 * The pseudo-brand hub `non-brand` (unbranded consumables) is deliberately
 * EXCLUDED: linking hundreds of unrelated products under a "non-brand" label is
 * not a useful internal link and reads as noise to crawlers.
 */
export const BRAND_HUB_SLUGS = new Set([
  '3m-littmann',
  'abbott',
  'accu-chek',
  'acon',
  'aeonmed',
  'alpk2',
  'b-braun',
  'beurer',
  'bio-max',
  'biohermes',
  'blueidea',
  'bsmi',
  'comen',
  'comfy',
  'contec',
  'convatec',
  'cromatest-linear',
  'ebcare',
  'edan',
  'excel',
  'finecare',
  'gpl',
  'heine',
  'human',
  'irish',
  'jmi',
  'jms',
  'jumper',
  'labkit',
  'mediron',
  'microlife',
  'mindray',
  'mmd',
  'nichiban',
  'omron',
  'pcl',
  'romsons',
  'rossmax',
  'savlon',
  'secure',
  'sritrang',
  'tanita',
  'tynor',
  'united-medicare',
  'vigor',
  'yamasu',
  'yuwell',
]);

/**
 * True when `slug` is a published brand hub. Shape is validated by callers
 * (`SAFE_SLUG` in productSeoLinks) before this is consulted.
 *
 * @param {string} slug - Candidate brand slug (e.g. 'tynor')
 * @returns {boolean}
 */
export function isRegisteredBrandHub(slug) {
  return typeof slug === 'string' && BRAND_HUB_SLUGS.has(slug.toLowerCase());
}
