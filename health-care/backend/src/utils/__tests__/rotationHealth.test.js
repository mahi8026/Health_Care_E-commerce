/**
 * Tests for the deployment secret-rotation checks.
 *
 * The invariants pinned here are the ones an operator relies on during a
 * rotation: the report must never echo a secret, the MongoDB URI parser must
 * drop credentials, and a stale/unrecorded rotation must be reported.
 */

const crypto = require('crypto');
const {
  MIN_SECRET_LENGTH,
  ROTATION_MAX_AGE_DAYS,
  fingerprint,
  describeMongoTarget,
  checkSecretHygiene,
  checkRotationAge,
  buildRotationReport,
} = require('../rotationHealth');

const randomSecret = () => crypto.randomBytes(32).toString('hex');

const validEnv = () => ({
  MONGODB_URI: 'mongodb+srv://rotated-user:s3cretPassw0rd@cluster0.abcd123.mongodb.net/medcore-bd?retryWrites=true&w=majority',
  JWT_SECRET: randomSecret(),
  JWT_REFRESH_SECRET: randomSecret(),
  CSRF_SECRET: randomSecret(),
});

describe('rotationHealth', () => {
  describe('fingerprint', () => {
    it('is deterministic, 8 hex chars, and never contains the input', () => {
      const secret = randomSecret();
      const digest = fingerprint(secret);

      expect(digest).toMatch(/^[0-9a-f]{8}$/);
      expect(digest).toBe(fingerprint(secret));
      expect(secret).not.toContain(digest);
      expect(digest).not.toBe(fingerprint(`${secret}x`));
    });

    it('returns null for empty or non-string input', () => {
      expect(fingerprint('')).toBeNull();
      expect(fingerprint(undefined)).toBeNull();
      expect(fingerprint(null)).toBeNull();
    });
  });

  describe('describeMongoTarget', () => {
    it('detects an Atlas SRV URI without exposing credentials', () => {
      const target = describeMongoTarget(validEnv().MONGODB_URI);

      expect(target.present).toBe(true);
      expect(target.scheme).toBe('mongodb+srv');
      expect(target.isAtlas).toBe(true);
      expect(target.hostCount).toBe(1);
      expect(target.hosts[0]).toBe('cluster0.abcd123.mongodb.net');
      expect(target.database).toBe('medcore-bd');
      expect(target.hasCredentials).toBe(true);
      expect(target.usesTls).toBe(true);

      const serialized = JSON.stringify(target);
      expect(serialized).not.toContain('s3cretPassw0rd');
      expect(serialized).not.toContain('rotated-user');
    });

    it('splits a replica-set URI into host entries', () => {
      const uri = 'mongodb://u:p@a.mongodb.net:27017,b.mongodb.net:27017,c.mongodb.net:27017/db?ssl=true&replicaSet=rs0';
      const target = describeMongoTarget(uri);

      expect(target.scheme).toBe('mongodb');
      expect(target.hostCount).toBe(3);
      expect(target.hosts).toContain('a.mongodb.net:27017');
      expect(target.isAtlas).toBe(true);
      expect(target.database).toBe('db');
      expect(JSON.stringify(target)).not.toContain('u:p@');
    });

    it('flags a local URI as non-Atlas and credential-free', () => {
      const target = describeMongoTarget('mongodb://localhost:27017/Mediport');

      expect(target.isAtlas).toBe(false);
      expect(target.hasCredentials).toBe(false);
      expect(target.database).toBe('Mediport');
    });

    it('reports an absent URI', () => {
      expect(describeMongoTarget(undefined)).toEqual({
        present: false,
        scheme: null,
        hosts: [],
        hostCount: 0,
        database: null,
        hasCredentials: false,
        usesTls: false,
        isAtlas: false,
      });
    });
  });

  describe('checkSecretHygiene', () => {
    it('accepts three distinct, randomly generated secrets', () => {
      const { issues, secrets } = checkSecretHygiene(validEnv());

      expect(issues).toEqual([]);
      expect(secrets).toHaveLength(3);
      expect(secrets.every((secret) => secret.present)).toBe(true);
      expect(secrets.every((secret) => secret.length >= MIN_SECRET_LENGTH)).toBe(true);
    });

    it('rejects a shared JWT / refresh secret', () => {
      const env = validEnv();
      env.JWT_REFRESH_SECRET = env.JWT_SECRET;

      const { issues } = checkSecretHygiene(env);

      expect(issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'SHARED_SECRET', level: 'error' })])
      );
    });

    it('rejects placeholders, short values and missing variables', () => {
      const env = { JWT_SECRET: 'your-secret-key', JWT_REFRESH_SECRET: 'abc', CSRF_SECRET: undefined };

      const { issues, secrets } = checkSecretHygiene(env);

      expect(secrets.find((secret) => secret.name === 'CSRF_SECRET').present).toBe(false);
      expect(issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ code: 'PLACEHOLDER', name: 'JWT_SECRET' }),
        expect.objectContaining({ code: 'TOO_SHORT', name: 'JWT_REFRESH_SECRET' }),
        expect.objectContaining({ code: 'MISSING', name: 'CSRF_SECRET' }),
      ]));
    });

    it('warns on low-variety and padded values', () => {
      const env = validEnv();
      env.JWT_SECRET = `${'a'.repeat(MIN_SECRET_LENGTH)} `;
      env.JWT_REFRESH_SECRET = 'ab'.repeat(MIN_SECRET_LENGTH / 2);

      const { issues } = checkSecretHygiene(env);

      expect(issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ code: 'SURROUNDING_WHITESPACE', name: 'JWT_SECRET' }),
        expect.objectContaining({ code: 'LOW_VARIETY', name: 'JWT_REFRESH_SECRET' }),
      ]));
    });
  });

  describe('checkRotationAge', () => {
    const now = Date.parse('2026-10-30T00:00:00.000Z');

    it('treats a missing timestamp as unrecorded and stale', () => {
      const result = checkRotationAge(null, now);

      expect(result.recorded).toBe(false);
      expect(result.ageDays).toBeNull();
      expect(result.stale).toBe(true);
    });

    it('accepts a recent rotation', () => {
      const result = checkRotationAge(now - 5 * 86400000, now);

      expect(result.recorded).toBe(true);
      expect(result.ageDays).toBe(5);
      expect(result.stale).toBe(false);
      expect(result.rotatedAt).toBe('2026-10-25T00:00:00.000Z');
    });

    it(`marks a rotation older than ${ROTATION_MAX_AGE_DAYS} days as stale`, () => {
      const result = checkRotationAge(now - (ROTATION_MAX_AGE_DAYS + 1) * 86400000, now);

      expect(result.stale).toBe(true);
      expect(result.ageDays).toBe(ROTATION_MAX_AGE_DAYS + 1);
    });
  });

  describe('buildRotationReport', () => {
    it('passes a fully rotated environment and leaks no secret material', () => {
      const env = validEnv();
      const report = buildRotationReport(env, { rotationTimestamp: Date.now() - 86400000 });

      expect(report.ok).toBe(true);
      expect(report.errors).toEqual([]);
      expect(report.mongo.isAtlas).toBe(true);

      const serialized = JSON.stringify(report);
      ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'CSRF_SECRET'].forEach((name) => {
        expect(serialized).not.toContain(env[name]);
      });
      expect(serialized).not.toContain('s3cretPassw0rd');
    });

    it('fails when MONGODB_URI is missing', () => {
      const env = validEnv();
      delete env.MONGODB_URI;

      const report = buildRotationReport(env);

      expect(report.ok).toBe(false);
      expect(report.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'MONGO_URI_MISSING' })])
      );
    });

    it('fails when the URI has no database or no credentials', () => {
      const env = validEnv();
      env.MONGODB_URI = 'mongodb://localhost:27017';

      const report = buildRotationReport(env);
      const codes = report.errors.map((issue) => issue.code);

      expect(codes).toContain('MONGO_URI_NO_CREDENTIALS');
      expect(codes).toContain('MONGO_URI_NO_DATABASE');
      expect(report.warnings.map((issue) => issue.code)).toContain('MONGO_URI_NOT_ATLAS');
    });

    it('warns when no rotation timestamp has been recorded', () => {
      const report = buildRotationReport(validEnv(), { rotationTimestamp: null });

      expect(report.ok).toBe(true);
      expect(report.warnings).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'ROTATION_NOT_RECORDED' })])
      );
    });
  });
});
