#!/usr/bin/env node
/**
 * Read-only secret-rotation audit for the MediportBD backend.
 *
 * Answers the three questions that make a rotation "confirmed":
 *   1. do JWT_SECRET / JWT_REFRESH_SECRET / CSRF_SECRET look rotated (length,
 *      distinctness, no documentation placeholders)?
 *   2. does MONGODB_URI still target Atlas with credentials and a database?
 *   3. is the JWT rotation timestamp recorded in Redis, and is it fresh?
 *
 * Usage (from health-care/backend):
 *   npm run security:verify-rotation              # env-only audit (no network)
 *   npm run security:verify-rotation -- --redis   # also read jwt:secret:rotated_at
 *   npm run security:verify-rotation -- --ping    # also ping Atlas
 *   npm run security:verify-rotation -- --json    # machine-readable output
 *
 * Exit codes: 0 = no error-level issues, 1 = at least one error issue or a
 * failed --ping/--redis check. Nothing is written; no secret is ever printed.
 */

require('dotenv').config();

const { buildRotationReport } = require('../src/utils/rotationHealth');

const FLAGS = new Set(process.argv.slice(2).filter((arg) => arg.startsWith('--')));
const wantsJson = FLAGS.has('--json');
const wantsPing = FLAGS.has('--ping');
const wantsRedis = FLAGS.has('--redis');

// Mongoose/driver errors can echo the connection string; strip userinfo before
// anything reaches the terminal or a log file.
const redact = (text) => String(text == null ? '' : text).replace(/:\/\/[^@\s]+@/g, '://<redacted>@');

/**
 * Read the JWT rotation timestamp from Redis.
 *
 * @returns {Promise<{ value: number|null, note: string|null, failed: boolean }>}
 */
async function readRotationTimestamp() {
  const redisCache = require('../src/services/redisCache');
  const tokenBlacklist = require('../src/services/tokenBlacklist');

  try {
    redisCache.initRedis();

    const deadline = Date.now() + 5000;
    while (!redisCache.isRedisConnected() && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    if (!redisCache.isRedisConnected()) {
      return { value: null, note: 'Redis unreachable - rotation timestamp not read', failed: true };
    }

    const value = await tokenBlacklist.getSecretRotationTimestamp();
    return { value, note: null, failed: false };
  } catch (error) {
    return { value: null, note: `Redis check failed: ${redact(error.message)}`, failed: true };
  } finally {
    try {
      await redisCache.close();
    } catch {
      // already closed - nothing to do
    }
  }
}

/**
 * Ping Atlas through Mongoose to prove the rotated credential still works.
 *
 * @returns {Promise<{ ok: boolean, note: string }>}
 */
async function pingAtlas() {
  const mongoose = require('mongoose');

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    const result = await mongoose.connection.db.admin().command({ ping: 1 });
    const host = mongoose.connection.host;

    return { ok: result.ok === 1, note: `Atlas ping OK via ${host} (db ${mongoose.connection.name})` };
  } catch (error) {
    return { ok: false, note: `Atlas ping failed: ${redact(error.message)}` };
  } finally {
    try {
      await mongoose.disconnect();
    } catch {
      // connection never opened - nothing to close
    }
  }
}

/**
 * Human-readable report. Only fingerprints and lengths are printed.
 *
 * @param {Object} report - Output of buildRotationReport
 * @param {Array<{level: string, message: string}>} notes - Optional check notes
 */
function printReport(report, notes = []) {
  const { mongo, rotation, secrets } = report;

  console.log('');
  console.log('MediportBD - secret rotation audit');
  console.log(`Generated: ${report.generatedAt}`);
  console.log('');

  if (mongo.present) {
    const target = `${mongo.scheme}://${mongo.hosts.join(',')}`;
    console.log(`MongoDB  : ${target}`);
    console.log(`           database=${mongo.database || '(none)'} credentials=${mongo.hasCredentials ? 'yes' : 'no'} atlas=${mongo.isAtlas ? 'yes' : 'no'}`);
  } else {
    console.log('MongoDB  : MONGODB_URI is not set');
  }

  console.log('');
  console.log('Secrets  :');
  secrets.forEach((secret) => {
    const status = secret.issues.some((issue) => issue.level === 'error')
      ? 'FAIL'
      : (secret.issues.length ? 'WARN' : 'OK');
    console.log(`  ${secret.name.padEnd(20)} ${String(status).padEnd(5)} len=${String(secret.length).padEnd(4)} sha256=${secret.fingerprint || '-'}`);
  });

  console.log('');
  if (rotation.recorded) {
    console.log(`Rotation : ${rotation.rotatedAt} (${rotation.ageDays} days ago)`);
  } else {
    console.log('Rotation : not recorded');
  }

  if (notes.length > 0) {
    console.log('');
    notes.forEach((note) => console.log(`  ${note.level === 'error' ? '!!' : '--'} ${note.message}`));
  }

  const printIssues = (label, issues) => {
    if (issues.length === 0) {
      return;
    }
    console.log('');
    console.log(`${label}:`);
    issues.forEach((issue) => console.log(`  [${issue.code}] ${issue.message}`));
  };

  printIssues('Errors', report.errors);
  printIssues('Warnings', report.warnings);

  console.log('');
  console.log(report.ok ? 'RESULT: PASS' : 'RESULT: FAIL');
  console.log('');
}

/**
 * Collect the optional network checks, then build and print the report.
 *
 * @returns {Promise<number>} Process exit code
 */
async function main() {
  const notes = [];
  let rotationTimestamp = null;
  let failed = false;

  if (wantsRedis) {
    const redis = await readRotationTimestamp();
    rotationTimestamp = redis.value;
    failed = failed || redis.failed;
    if (redis.note) {
      notes.push({ level: redis.failed ? 'error' : 'info', message: redis.note });
    }
  }

  if (wantsPing) {
    const ping = await pingAtlas();
    failed = failed || !ping.ok;
    notes.push({ level: ping.ok ? 'info' : 'error', message: ping.note });
  }

  const report = buildRotationReport(process.env, { rotationTimestamp });

  if (wantsJson) {
    console.log(JSON.stringify({ ...report, notes }, null, 2));
  } else {
    printReport(report, notes);
  }

  return report.ok && !failed ? 0 : 1;
}


main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`Rotation audit crashed: ${redact(error.message)}`);
    process.exitCode = 1;
  });
