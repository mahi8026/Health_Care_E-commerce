/**
 * Deployment secret-rotation health checks.
 *
 * Pure, side-effect-free helpers shared by `scripts/verify-rotation.js` and its
 * unit tests. Nothing in this module returns or logs a secret value: callers
 * only receive fingerprints (sha256, first 8 hex chars), lengths and issue
 * codes, so a report can be pasted into a PR or a ticket without leaking
 * credentials.
 */

const crypto = require('crypto');

// 32 random bytes hex-encoded = 64 chars. The production secrets in this repo
// have historically been 64 bytes (128 hex chars); 64 is the floor, not the
// target.
const MIN_SECRET_LENGTH = 64;

// docs/SECRET_ROTATION_RUNBOOK.md requires a JWT rotation at least every 90 days.
const ROTATION_MAX_AGE_DAYS = 90;

// Values copied from deployment docs and env templates in this repo. If a live
// environment still matches one of these, the variable was never rotated.
const PLACEHOLDER_SECRETS = new Set([
  'your-secret-key',
  'your-refresh-secret',
  'your-secret',
  'change-me',
  'changeme',
  'secret',
  'test-jwt-secret',
  'test-jwt-refresh-secret',
  'test_jwt_secret_for_ci_cd_pipeline',
  'test_refresh_secret_for_ci_cd_pipeline',
  'test-secret-key-at-least-32-characters-long',
  'test-refresh-secret-at-least-32-chars',
]);

// Every secret independently signs a separate credential type. JWT_SECRET and
// JWT_REFRESH_SECRET sharing a value would let an access token be replayed as a
// 30-day refresh token (MEDIPORTBD_AUDIT_REPORT.md ISSUE #19).
const SECRET_NAMES = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'CSRF_SECRET'];

const SHARED_SECRET_PAIRS = [
  ['JWT_SECRET', 'JWT_REFRESH_SECRET'],
  ['JWT_SECRET', 'CSRF_SECRET'],
  ['JWT_REFRESH_SECRET', 'CSRF_SECRET'],
];

/**
 * Short, non-reversible identifier for a secret. Safe to print: 32 bits of a
 * sha256 digest is enough to answer "are local and deployed the same value?"
 * without exposing anything usable.
 *
 * @param {string} secret - Secret value
 * @returns {string|null} First 8 hex chars of sha256, or null when absent
 */
function fingerprint(secret) {
  if (typeof secret !== 'string' || secret.length === 0) {
    return null;
  }
  return crypto.createHash('sha256').update(secret, 'utf8').digest('hex').slice(0, 8);
}

/**
 * Parse a MongoDB connection string into a credential-free description.
 *
 * The password is never part of the result: the userinfo segment is dropped
 * before the authority is split into hosts, so the output is safe to log.
 *
 * @param {string} uri - MONGODB_URI value (mongodb:// or mongodb+srv://)
 * @returns {Object} { present, scheme, hosts, hostCount, database, hasCredentials, usesTls, isAtlas }
 */
function describeMongoTarget(uri) {
  const value = typeof uri === 'string' ? uri.trim() : '';

  if (!value) {
    return {
      present: false,
      scheme: null,
      hosts: [],
      hostCount: 0,
      database: null,
      hasCredentials: false,
      usesTls: false,
      isAtlas: false,
    };
  }

  const schemeMatch = /^(mongodb(?:\+srv)?):\/\//i.exec(value);
  const scheme = schemeMatch ? schemeMatch[1].toLowerCase() : null;
  const hasCredentials = /^mongodb(?:\+srv)?:\/\/[^/@]+@/i.test(value);
  const withoutCredentials = value.replace(/^(mongodb(?:\+srv)?:\/\/)[^/@]+@/i, '$1');
  const afterScheme = withoutCredentials.replace(/^mongodb(?:\+srv)?:\/\//i, '');
  const [authorityAndPath] = afterScheme.split('?');
  const slashIndex = authorityAndPath.indexOf('/');
  const authority = slashIndex === -1 ? authorityAndPath : authorityAndPath.slice(0, slashIndex);
  const path = slashIndex === -1 ? '' : authorityAndPath.slice(slashIndex + 1);
  const hosts = authority.split(',').map((host) => host.trim()).filter(Boolean);

  return {
    present: true,
    scheme,
    hosts,
    hostCount: hosts.length,
    database: path || null,
    hasCredentials,
    // mongodb+srv always negotiates TLS; the mongodb:// form needs an explicit flag.
    usesTls: scheme === 'mongodb+srv' || /[?&](ssl|tls)=true/i.test(value),
    isAtlas: hosts.some((host) => /\.mongodb\.net(?::\d+)?$/i.test(host)),
  };
}

/**
 * Per-secret hygiene checks plus cross-secret checks.
 *
 * @param {Object} env - Environment object (process.env or a fixture)
 * @returns {{ secrets: Array<Object>, issues: Array<Object> }}
 */
function checkSecretHygiene(env = {}) {
  const issues = [];
  const secrets = [];

  SECRET_NAMES.forEach((name) => {
    const rawValue = typeof env[name] === 'string' ? env[name] : '';
    const value = rawValue.trim();
    const entry = {
      name,
      present: value.length > 0,
      length: value.length,
      fingerprint: fingerprint(value),
      issues: [],
    };

    if (!value) {
      entry.issues.push({ level: 'error', code: 'MISSING', message: `${name} is not set` });
    } else {
      if (PLACEHOLDER_SECRETS.has(value.toLowerCase())) {
        entry.issues.push({
          level: 'error',
          code: 'PLACEHOLDER',
          message: `${name} still holds a documentation/CI placeholder value`,
        });
      }
      if (value.length < MIN_SECRET_LENGTH) {
        entry.issues.push({
          level: 'error',
          code: 'TOO_SHORT',
          message: `${name} is ${value.length} chars; at least ${MIN_SECRET_LENGTH} are required`,
        });
      }
      if (new Set(value).size < 8) {
        entry.issues.push({
          level: 'warn',
          code: 'LOW_VARIETY',
          message: `${name} uses fewer than 8 distinct characters; it does not look randomly generated`,
        });
      }
      if (rawValue !== value) {
        entry.issues.push({
          level: 'warn',
          code: 'SURROUNDING_WHITESPACE',
          message: `${name} has leading/trailing whitespace and will fail signature checks`,
        });
      }
    }

    entry.issues.forEach((issue) => issues.push({ ...issue, name }));
    secrets.push(entry);
  });

  SHARED_SECRET_PAIRS.forEach(([first, second]) => {
    const firstValue = typeof env[first] === 'string' ? env[first].trim() : '';
    const secondValue = typeof env[second] === 'string' ? env[second].trim() : '';
    if (firstValue && secondValue && firstValue === secondValue) {
      issues.push({
        level: 'error',
        code: 'SHARED_SECRET',
        name: first,
        message: `${first} and ${second} must not share a value`,
      });
    }
  });

  return { secrets, issues };
}

/**
 * Interpret the timestamp recorded in Redis under `jwt:secret:rotated_at`.
 *
 * @param {number|string|null} rotatedAtMs - Epoch millis of the last rotation
 * @param {number} [nowMs] - Reference time (injectable for tests)
 * @returns {Object} { recorded, rotatedAt, ageDays, stale, message }
 */
function checkRotationAge(rotatedAtMs, nowMs = Date.now()) {
  const timestamp = Number(rotatedAtMs);

  if (!rotatedAtMs || !Number.isFinite(timestamp) || timestamp <= 0) {
    return {
      recorded: false,
      rotatedAt: null,
      ageDays: null,
      stale: true,
      message: 'No JWT rotation timestamp recorded (jwt:secret:rotated_at is empty)',
    };
  }

  const ageDays = Math.max(0, Math.floor((nowMs - timestamp) / 86400000));
  const stale = ageDays > ROTATION_MAX_AGE_DAYS;

  return {
    recorded: true,
    rotatedAt: new Date(timestamp).toISOString(),
    ageDays,
    stale,
    message: stale
      ? `Last JWT rotation was ${ageDays} days ago (limit ${ROTATION_MAX_AGE_DAYS})`
      : `Last JWT rotation was ${ageDays} days ago`,
  };
}

/**
 * Build the full, redacted rotation report consumed by the CLI.
 *
 * @param {Object} env - Environment object (process.env or a fixture)
 * @param {Object} [options]
 * @param {number|string|null} [options.rotationTimestamp] - From Redis, optional
 * @param {number} [options.now] - Reference time (injectable for tests)
 * @returns {Object} Report; `ok` is false when any error-level issue exists
 */
function buildRotationReport(env = {}, options = {}) {
  const { rotationTimestamp = null, now = Date.now() } = options;
  const hygiene = checkSecretHygiene(env);
  const mongo = describeMongoTarget(env.MONGODB_URI);
  const rotation = checkRotationAge(rotationTimestamp, now);
  const issues = [...hygiene.issues];

  if (!mongo.present) {
    issues.push({ level: 'error', code: 'MONGO_URI_MISSING', message: 'MONGODB_URI is not set' });
  } else {
    if (!mongo.hasCredentials) {
      issues.push({
        level: 'error',
        code: 'MONGO_URI_NO_CREDENTIALS',
        message: 'MONGODB_URI carries no credentials, so it cannot authenticate after an Atlas password rotation',
      });
    }
    if (!mongo.database) {
      issues.push({
        level: 'error',
        code: 'MONGO_URI_NO_DATABASE',
        message: 'MONGODB_URI does not name a database',
      });
    }
    if (!mongo.isAtlas) {
      issues.push({
        level: 'warn',
        code: 'MONGO_URI_NOT_ATLAS',
        message: 'MONGODB_URI does not point at a *.mongodb.net host (local or tunneled MongoDB)',
      });
    }
  }

  if (rotation.stale) {
    issues.push({
      level: 'warn',
      code: rotation.recorded ? 'ROTATION_STALE' : 'ROTATION_NOT_RECORDED',
      message: rotation.message,
    });
  }

  const errors = issues.filter((issue) => issue.level === 'error');
  const warnings = issues.filter((issue) => issue.level === 'warn');

  return {
    generatedAt: new Date(now).toISOString(),
    ok: errors.length === 0,
    mongo,
    secrets: hygiene.secrets,
    rotation,
    errors,
    warnings,
  };
}

module.exports = {
  MIN_SECRET_LENGTH,
  ROTATION_MAX_AGE_DAYS,
  SECRET_NAMES,
  fingerprint,
  describeMongoTarget,
  checkSecretHygiene,
  checkRotationAge,
  buildRotationReport,
};
