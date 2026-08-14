/**
 * Vercel Cron Job: Keep Backend Alive
 * 
 * This endpoint is called every 10 minutes by Vercel Cron to prevent
 * the Render.com free tier backend from spinning down after 15 minutes
 * of inactivity.
 * 
 * Configured in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/keep-alive",
 *     "schedule": "* /10 * * * *"
 *   }]
 * }
 */

export async function GET(request) {
  // Verify this is a Vercel Cron request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // In production, you should set CRON_SECRET in Vercel env vars
    // For now, we'll allow requests without auth for testing
  }

  try {
    const backendUrl = process.env.BACKEND_URL;
    
    if (!backendUrl) {
      return Response.json(
        { 
          success: false, 
          error: 'BACKEND_URL not configured',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    const startTime = Date.now();
    // Ping the aggregated homepage endpoint (10-min cache TTL matches this
    // cron schedule, so the homepage cache never expires cold). The products
    // ping is kept for rate-limiter/DB warm-up.
    const [homeRes, productsRes] = await Promise.all([
      fetch(`${backendUrl}/api/home/data`, {
        signal: AbortSignal.timeout(45000), // allow for cold start
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mediport-KeepAlive-Cron',
        },
      }),
      fetch(`${backendUrl}/api/products?limit=1`, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mediport-KeepAlive-Cron',
        },
      }),
    ]);
    const duration = Date.now() - startTime;
    const response = homeRes.ok ? homeRes : productsRes;

    if (response.ok) {
      return Response.json({
        success: true,
        backend: backendUrl,
        status: response.status,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    } else {
      return Response.json({
        success: false,
        backend: backendUrl,
        status: response.status,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[keep-alive] Error:', error.message);
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
