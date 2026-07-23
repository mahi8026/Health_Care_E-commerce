/**
 * Debug endpoint to test backend connectivity from Cloudflare Workers
 */

export async function GET() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  
  const debug = {
    env_BACKEND_URL: backendUrl,
    test_url: `${backendUrl}/api/products?limit=2&fields=slug,_id`,
    timestamp: new Date().toISOString(),
  };
  
  try {
    const startTime = Date.now();
    const res = await fetch(`${backendUrl}/api/products?limit=2&fields=slug,_id`, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mediport-Sitemap-Debug',
      },
    });
    
    const elapsed = Date.now() - startTime;
    
    if (!res.ok) {
      debug.fetch_result = 'FAILED';
      debug.status_code = res.status;
      debug.elapsed_ms = elapsed;
    } else {
      const data = await res.json();
      debug.fetch_result = 'SUCCESS';
      debug.status_code = res.status;
      debug.elapsed_ms = elapsed;
      debug.products_returned = Array.isArray(data.data) ? data.data.length : 0;
      debug.sample_product = Array.isArray(data.data) && data.data[0] ? data.data[0] : null;
    }
  } catch (err) {
    debug.fetch_result = 'ERROR';
    debug.error_message = err.message;
    debug.error_name = err.name;
  }
  
  return Response.json(debug, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
