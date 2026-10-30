/**
 * Retired: /sitemap-full.xml
 *
 * This route used to emit one urlset containing every static page, category,
 * brand and product (~749 URLs). It was never listed in the sitemap index
 * (app/sitemap.xml/route.js) and it duplicated the segmented sitemaps 1:1, so
 * the same URLs were advertised to crawlers twice.
 *
 * It now answers 410 Gone. The segmented sitemaps remain the single source:
 * /sitemap-static.xml, -categories, -brands, -products, -guides, -equipment,
 * -topics.
 */
export async function GET() {
  return new Response(null, {
    status: 410,
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
  });
}