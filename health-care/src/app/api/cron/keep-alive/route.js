/**
 * Keep-alive: ping the Render free-tier backend so it never spins down.
 *
 * Vercel Hobby crons can only run once per day, so this route is triggered
 * by the GitHub Actions workflow `.github/workflows/keep-alive.yml` (public
 * repo → free) every 5 minutes, which pings the backend directly. This route
 * is kept as a single place that pings every home-page endpoint; to use it
 * on a Pro plan, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/keep-alive",
 *     "schedule": "every 10 minutes"
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
