/**
 * Unit tests for the live sitemap routes.
 *
 * The sitemap architecture is split:
 *   /sitemap.xml          → sitemap INDEX pointing at the sub-sitemaps
 *   /sitemap-static.xml   → static public pages only (no private/redirect URLs)
 *   /sitemap-products.xml → dynamic product URLs (requires the backend API)
 *
 * This suite covers the two pure routes (index + static). The products route
 * is exercised indirectly through `scripts/generate-sitemap.js`.
 */

// Polyfill Response for the jsdom test environment — the route handlers
// construct `new Response(xml, { headers })`, but jsdom does not ship it.
class ResponseStub {
  constructor(body) {
    this._body = body
  }
  async text() {
    return this._body
  }
}
if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = ResponseStub
}

import { GET as sitemapIndexGET } from '../sitemap.xml/route'
import { GET as sitemapStaticGET } from '../sitemap-static.xml/route'
import { SITE_CONFIG } from '@/config/seo'

/** Pull every <loc> value out of a sitemap XML string. */
const extractLocs = (xml) =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

// ---------------------------------------------------------------------------
// /sitemap.xml — the sitemap index
// ---------------------------------------------------------------------------

describe('/sitemap.xml (sitemap index)', () => {
  let xml
  let locs

  beforeAll(async () => {
    const res = await sitemapIndexGET()
    xml = await res.text()
    locs = extractLocs(xml)
  })

  it('is declared as a sitemapindex', () => {
    expect(xml).toContain('<sitemapindex')
  })

  it('references all seven sub-sitemaps on the canonical origin', () => {
    const expected = [
      'sitemap-static.xml',
      'sitemap-categories.xml',
      'sitemap-brands.xml',
      'sitemap-products.xml',
      'sitemap-guides.xml',
      'sitemap-equipment.xml',
      'sitemap-topics.xml',
    ]
    expect(locs).toHaveLength(expected.length)
    for (const name of expected) {
      expect(locs).toContain(`${SITE_CONFIG.url}/${name}`)
    }
  })

  it('contains only sub-sitemap references — never page URLs', () => {
    // Every <loc> must point at a sub-sitemap file, not at a page. Page URLs
    // in the index would dilute crawl signals and duplicate the sub-sitemaps.
    for (const loc of locs) {
      expect(loc).toMatch(/\.xml$/)
    }
  })

  it('stamps lastmod on every entry', () => {
    const lastmods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)]
    expect(lastmods).toHaveLength(locs.length)
  })
})

// ---------------------------------------------------------------------------
// /sitemap-static.xml — static public pages
// ---------------------------------------------------------------------------

describe('/sitemap-static.xml', () => {
  let xml
  let locs

  beforeAll(async () => {
    const res = await sitemapStaticGET()
    xml = await res.text()
    locs = extractLocs(xml)
  })

  it('is declared as a urlset', () => {
    expect(xml).toContain('<urlset')
  })

  it('includes the core public money pages', () => {
    const required = [
      SITE_CONFIG.url,
      `${SITE_CONFIG.url}/products`,
      `${SITE_CONFIG.url}/equipment`,
      `${SITE_CONFIG.url}/reagent-store`,
      `${SITE_CONFIG.url}/b2b`,
      `${SITE_CONFIG.url}/brands`,
      `${SITE_CONFIG.url}/about`,
      `${SITE_CONFIG.url}/contact`,
      `${SITE_CONFIG.url}/help`,
    ]
    for (const url of required) {
      expect(locs).toContain(url)
    }
  })

  it('never includes private, transactional or noindex paths', () => {
    const forbidden = [
      '/admin',
      '/account',
      '/cart',
      '/checkout',
      '/login',
      '/register',
      '/search',
      '/orders',
      '/wishlist',
    ]
    for (const path of forbidden) {
      const match = locs.find((u) => u.includes(path))
      expect(match).toBeUndefined()
    }
  })

  it('excludes URLs that redirect — no crawl-budget waste', () => {
    // /support 308-redirects to /help and /flash-deals 404s when no deals
    // are live; neither belongs in the sitemap.
    expect(locs.find((u) => u.includes('/support'))).toBeUndefined()
    expect(locs.find((u) => u.includes('/flash-deals'))).toBeUndefined()
  })

  it('stamps lastmod, changefreq and priority on every entry', () => {
    const urlBlocks = [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) => m[0])
    expect(urlBlocks.length).toBe(locs.length)
    for (const block of urlBlocks) {
      expect(block).toMatch(/<lastmod>/)
      expect(block).toMatch(/<changefreq>/)
      expect(block).toMatch(/<priority>/)
    }
  })

  it('gives the homepage the highest priority of 1.0', () => {
    const homeBlock = [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)]
      .map((m) => m[0])
      .find((block) => block.includes(`<loc>${SITE_CONFIG.url}</loc>`))
    expect(homeBlock).toBeDefined()
    expect(homeBlock).toMatch(/<priority>1<\/priority>|<priority>1\.0<\/priority>/)
  })
})