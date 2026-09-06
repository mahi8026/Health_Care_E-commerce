/**
 * Keep-Alive Service for Render.com Backend
 * 
 * Prevents cold starts by pinging the backend every 10 minutes.
 * This fixes the "Discovered - currently not indexed" issue where
 * Googlebot times out during cold starts.
 * 
 * Cold starts cause:
 * - 302 "Discovered - currently not indexed" pages in Google Search Console
 * - Poor crawl efficiency
 * - Slow response times for users
 * 
 * Impact: Should fix 50-100+ indexing errors within 2 weeks
 */

import cron from 'node-cron';
import axios from 'axios';
import logger from './logger.js';

// Get backend URL from environment variable or use default
const BACKEND_URL = process.env.BACKEND_URL || 
                    process.env.API_URL || 
                    'https://health-care-e-commerce-ubyy.onrender.com';

const HEALTH_ENDPOINT = `${BACKEND_URL}/api/health`;

/**
 * Ping the backend health endpoint to keep it warm
 */
async function pingBackend() {
  try {
    const startTime = Date.now();
    const response = await axios.get(HEALTH_ENDPOINT, {
      timeout: 8000, // 8 second timeout
      headers: {
        'User-Agent': 'MediportBD-KeepAlive/1.0',
      },
    });
    
    const duration = Date.now() - startTime;
    
    if (response.status === 200) {
      logger.info(`✅ Keep-alive ping successful (${duration}ms)`);
    } else {
      logger.warn(`⚠️ Keep-alive ping returned status ${response.status} (${duration}ms)`);
    }
  } catch (error) {
    logger.error('❌ Keep-alive ping failed:', {
      message: error.message,
      code: error.code,
      endpoint: HEALTH_ENDPOINT,
    });
  }
}

/**
 * Initialize keep-alive cron job
 * Runs every 10 minutes to prevent cold starts
 */
export function initKeepAlive() {
  // Only run in production environment
  if (process.env.NODE_ENV !== 'production') {
    logger.info('🔄 Keep-alive disabled in development mode');
    return;
  }

  // Validate backend URL
  if (!BACKEND_URL || BACKEND_URL === 'undefined') {
    logger.error('❌ Keep-alive: BACKEND_URL not configured');
    return;
  }

  // Schedule cron job: every 10 minutes
  // Pattern: "*/10 * * * *" = At every 10th minute
  cron.schedule('*/10 * * * *', async () => {
    await pingBackend();
  });

  // Run initial ping immediately
  pingBackend();

  logger.info(`🔄 Keep-alive service started (ping every 10 minutes)`);
  logger.info(`📍 Health endpoint: ${HEALTH_ENDPOINT}`);
}

/**
 * Manual ping function for testing
 */
export async function manualPing() {
  logger.info('🔍 Manual keep-alive ping initiated');
  await pingBackend();
}

export default initKeepAlive;
