/**
 * n8n Webhook Event Service
 * ─────────────────────────
 * Fire-and-forget dispatcher that pushes business events to self-hosted n8n.
 *
 * Design guarantees:
 *  - NEVER throws and NEVER blocks the calling request path (order placement,
 *    registration, etc.). All failures are logged and swallowed.
 *  - Retries transient failures up to N8N_RETRY_ATTEMPTS with backoff.
 *  - Disabled cleanly when N8N_EVENTS_ENABLED !== 'true' or no base URL set,
 *    so the same code runs safely in any environment.
 *
 * Env:
 *  N8N_WEBHOOK_BASE_URL  e.g. http://localhost:5678
 *  N8N_WEBHOOK_SECRET    shared secret sent as X-Webhook-Secret header
 *  N8N_EVENTS_ENABLED    'true' to enable dispatch
 */

const logger = require('../utils/logger');

const BASE_URL = process.env.N8N_WEBHOOK_BASE_URL || '';
const SECRET = process.env.N8N_WEBHOOK_SECRET || '';
const ENABLED = process.env.N8N_EVENTS_ENABLED === 'true' && Boolean(BASE_URL);
const RETRY_ATTEMPTS = parseInt(process.env.N8N_RETRY_ATTEMPTS || '2', 10);
const TIMEOUT_MS = parseInt(process.env.N8N_TIMEOUT_MS || '5000', 10);

/**
 * POST an event envelope to the matching n8n webhook endpoint.
 * Endpoint convention: {BASE_URL}/webhook/{event}  (n8n production webhook path)
 */
async function deliver(event, payload, attempt = 1) {
  const url = `${BASE_URL.replace(/\/+$/, '')}/webhook/${event}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SECRET ? { 'X-Webhook-Secret': SECRET } : {})
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }    logger.info(`[n8n] ✅ ${event} delivered${attempt > 1 ? ` (attempt ${attempt})` : ''}`);
  } catch (err) {
    if (attempt <= RETRY_ATTEMPTS) {
      const delay = attempt * 1500;
      logger.warn(`[n8n] ⚠️ ${event} failed (${err.message}) — retry ${attempt}/${RETRY_ATTEMPTS} in ${delay}ms`);
      setTimeout(() => {
        deliver(event, payload, attempt + 1).catch(() => {});
      }, delay);
    } else {
      logger.error(`[n8n] ❌ ${event} dropped after ${attempt} attempts: ${err.message}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Public API — emit a business event to n8n. Never rejects.
 *
 * @param {string} event   event name, e.g. 'order-placed'
 * @param {object} data    event payload (plain object)
 */
function emitEvent(event, data = {}) {
  if (!ENABLED) {
    return;
  }
  const payload = {
    eventId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    event,
    timestamp: new Date().toISOString(),
    source: 'mediportbd-api',
    data
  };
  // Deliberately floating promise — callers must never await this.
  deliver(event, payload).catch((err) =>
    logger.error(`[n8n] unexpected dispatch error for ${event}: ${err.message}`)
  );
}

/** Test helper / health introspection. */
function getStatus() {
  return { enabled: ENABLED, baseUrl: BASE_URL || null, retries: RETRY_ATTEMPTS };
}

module.exports = { emitEvent, getStatus };
