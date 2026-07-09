/**
 * Debug endpoint to test backend connectivity from Cloudflare Workers
 */

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const backendUrl = apiUrl?.startsWith('http') ? apiUrl : 'http://localhost:5001/api';
  
  const debug = {
    env_NEXT_PUBLIC_API_URL: apiUrl,
    resolved_backend_url: backendUrl,
    test_url: `${backendUrl}/products?limit=2&fields=slug,_id`,
    timestamp: new Date().toISOString(),
  };
  
  try {
    const startTime = Date.now();
    const res = await fetch(`${backendUrl}/products?limit=2&fields=slug,_id`, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MedCore-Sitemap-Debug',
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
