/**
 * WS-03 — deterministic product → SEO-cluster link resolver.
 *
 * Single source of truth for the product page's related SEO destinations.
 * It reuses ONLY existing repository registries and never invents a
 * relationship:
 *
 *  1. Equipment — a product whose slug (or name) contains an equipment key
 *     derived from a REGISTERED landing page slug (e.g. `nebulizer` ->
 *     `/equipment/nebulizer-price-bangladesh`). Keys are matched as whole
 *     hyphen-delimited token sequences, so `ecg-electrode` does NOT match
 *     `ecg-machine`.
 *  2. Topics — only clusters that explicitly list a matched equipment landing
 *     slug in their `landingSlugs` (`TOPICAL_CLUSTERS` registry relationship).
 *     Broad category membership is deliberately NOT used: categories such as
 *     "Diagnostic Equipment" span several unrelated clusters, so a category
 *     match alone yields no links.
 *  3. Guides — only guides explicitly listed in the matched clusters'
 *     `guideSlugs` and present in the `GUIDES` registry.
 *  4. Brand — the product's own brand, and only when validated against an
 *     existing brand registry (`LANDING_PAGES[].brandSlugs`,
 *     `TOPICAL_CLUSTERS[].brandSlugs`, or `BRAND_GEO` keys via `getBrandGeo`).
 *     A `brand.slug` that is pattern-valid but unregistered (e.g. `generic`,
 *     which 404s in production) is never emitted. Normalized products expose
 *     `brand` as a plain string (see `useProductDetail.normalizeProduct`, which
 *     drops the slug before SSR) — in that case a candidate slug is derived via
 *     slugify(name) and must still pass the same registry membership check.
 *
 * Every destination is validated (registered slug + safe path shape), self
 * links and duplicates are removed, ordering is registry-driven and stable,
 * and zero verified relationships returns zero links.
 */

import { LANDING_PAGES } from '@/config/landingPages';
import { TOPICAL_CLUSTERS } from '@/config/topicalClusters';
import { GUIDES } from '@/config/guides';
import { getBrandGeo } from '@/config/brandGEO';

const MAX_EQUIPMENT = 2;
const MAX_TOPICS = 2;
const MAX_GUIDES = 2;

const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DESTINATION_PATTERN = /^\/(?:equipment|topics|guides|brands)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

const EMPTY_RESULT = { equipment: [], topics: [], guides: [], brand: null, all: [] };

/** Lowercase, hyphen-delimited slug used for token matching. */
function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Registry titles sometimes carry the layout brand suffix — trim it for labels. */
function stripBrandSuffix(title) {
  return String(title || '').replace(/\s*\|\s*MediportBD\s*$/i, '').trim();
}

// Equipment keys in LANDING_PAGES registry order (deterministic).
const EQUIPMENT_MATCHERS = LANDING_PAGES
  .map((page) => ({ key: String(page.slug || '').replace(/-price-bangladesh$/, ''), page }))
  .filter((entry) => entry.key && SAFE_SLUG.test(entry.key) && entry.key !== String(entry.page.slug));

// Explicit cluster membership by landing slug, preserving TOPICAL_CLUSTERS order.
const CLUSTERS_BY_LANDING = (() => {
  const index = new Map();
  TOPICAL_CLUSTERS.forEach((cluster) => {
    (cluster.landingSlugs || []).forEach((landingSlug) => {
      if (!index.has(landingSlug)) index.set(landingSlug, []);
      index.get(landingSlug).push(cluster);
    });
  });
  return index;
})();

const GUIDE_BY_SLUG = new Map(GUIDES.map((guide) => [guide.slug, guide]));

// Brand slugs that exist in an explicit repository registry.
const REGISTERED_BRAND_SLUGS = (() => {
  const slugs = new Set();
  const addAll = (list) => (Array.isArray(list) ? list : []).forEach((slug) => {
    if (typeof slug === 'string' && SAFE_SLUG.test(slug)) slugs.add(slug);
  });
  LANDING_PAGES.forEach((page) => addAll(page.brandSlugs));
  TOPICAL_CLUSTERS.forEach((cluster) => addAll(cluster.brandSlugs));
  return slugs;
})();

function isRegisteredBrand(slug, name) {
  // Authoritative slug provided -> only it decides; unregistered slugs (even
  // pattern-valid ones like `generic`) are rejected outright.
  if (slug) {
    if (!SAFE_SLUG.test(slug)) return false;
    if (REGISTERED_BRAND_SLUGS.has(slug)) return true;
    return getBrandGeo(slug, name) !== null;
  }
  // Normalized products expose `brand` as a string (slug dropped before SSR):
  // derive a candidate from the brand name and require registry membership —
  // a guessed/unregistered candidate is never emitted.
  const candidate = slugify(name);
  if (!candidate) return false;
  if (REGISTERED_BRAND_SLUGS.has(candidate)) return true;
  return getBrandGeo(candidate, name) !== null;
}

/**
 * Keep only safe, registered-shape, non-self, unique destinations while
 * preserving the incoming (registry-driven) order.
 */
export function sanitizeDestinations(destinations, productSlug) {
  const self = productSlug ? `/products/${productSlug}` : null;
  const seen = new Set();
  return (Array.isArray(destinations) ? destinations : []).filter((destination) => {
    if (!destination || typeof destination.url !== 'string') return false;
    if (!DESTINATION_PATTERN.test(destination.url)) return false;
    if (self && destination.url === self) return false;
    if (seen.has(destination.url)) return false;
    seen.add(destination.url);
    return true;
  });
}

/**
 * Resolve the verified SEO-cluster destinations for a product.
 * @returns {{equipment: Array, topics: Array, guides: Array, brand: Object|null, all: Array}}
 */
export function resolveProductSeoLinks(product) {
  if (!product || typeof product !== 'object') return { ...EMPTY_RESULT };

  const productSlug = typeof product.slug === 'string' ? product.slug : '';
  const nameSlug = slugify(product.name);
  const haystacks = [];
  if (productSlug) haystacks.push(`-${productSlug}-`);
  if (nameSlug) haystacks.push(`-${nameSlug}-`);
  if (haystacks.length === 0) return { ...EMPTY_RESULT };

  // 1. equipment — registry-key token match (whole hyphen-delimited sequence)
  const matchedEquipment = [];
  for (const { key, page } of EQUIPMENT_MATCHERS) {
    if (matchedEquipment.length >= MAX_EQUIPMENT) break;
    const needle = `-${key}-`;
    if (haystacks.some((haystack) => haystack.includes(needle))) {
      matchedEquipment.push({ slug: page.slug, url: `/equipment/${page.slug}`, label: stripBrandSuffix(page.title) });
    }
  }

  // 2. topics — clusters that explicitly list a matched equipment landing slug
  const clusters = [];
  matchedEquipment.forEach((entry) => {
    (CLUSTERS_BY_LANDING.get(entry.slug) || []).forEach((cluster) => {
      if (!clusters.some((existing) => existing.slug === cluster.slug)) clusters.push(cluster);
    });
  });

  const topics = [];
  const guides = [];
  clusters.forEach((cluster) => {
    if (topics.length < MAX_TOPICS) {
      topics.push({ url: `/topics/${cluster.slug}`, label: cluster.title || cluster.slug });
    }
    (cluster.guideSlugs || []).forEach((guideSlug) => {
      if (guides.length >= MAX_GUIDES) return;
      if (guides.some((entry) => entry.url === `/guides/${guideSlug}`)) return;
      const guide = GUIDE_BY_SLUG.get(guideSlug);
      if (guide) guides.push({ url: `/guides/${guideSlug}`, label: guide.title || guideSlug });
    });
  });

  // 4. brand — the product's own brand, only when registry-validated.
  // Normalized products expose `brand` as a string, so fall back to a
  // slugify(name) candidate that must still pass registry membership.
  const brandObject = typeof product.brand === 'object' && product.brand ? product.brand : null;
  const brandName = brandObject ? brandObject.name : (typeof product.brand === 'string' ? product.brand : '');
  const providedSlug = brandObject && typeof brandObject.slug === 'string' ? brandObject.slug : '';
  const candidateSlug = providedSlug || slugify(brandName);
  const brandCandidate = isRegisteredBrand(providedSlug, brandName)
    ? { url: `/brands/${candidateSlug}`, label: brandName || candidateSlug }
    : null;

  const equipment = sanitizeDestinations(
    matchedEquipment.map((entry) => ({ url: entry.url, label: entry.label })),
    productSlug
  );
  const safeTopics = sanitizeDestinations(topics, productSlug);
  const safeGuides = sanitizeDestinations(guides, productSlug);
  const brand = brandCandidate ? sanitizeDestinations([brandCandidate], productSlug)[0] || null : null;

  return {
    equipment,
    topics: safeTopics,
    guides: safeGuides,
    brand,
    all: [...equipment, ...safeTopics, ...safeGuides, ...(brand ? [brand] : [])],
  };
}

export default resolveProductSeoLinks;

