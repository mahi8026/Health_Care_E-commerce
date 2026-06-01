/**
 * @jest-environment node
 */

import { validateEnv, getEnvStatus } from '../validateEnv';

describe('validateEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Create a fresh copy of process.env for each test
    jest.resetModules();
    process.env = { ...originalEnv };
    // Set NODE_ENV to 'development' for validation tests
    process.env.NODE_ENV = 'development';
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateEnv()', () => {
    it('should pass validation when all required variables are present', () => {
      process.env.NEXT_PUBLIC_API_URL = '/api';
      process.env.NEXT_PUBLIC_SITE_URL = 'https://medcorebd.com';
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test_cloud';

      expect(() => validateEnv()).not.toThrow();
    });

    it('should skip validation when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.NEXT_PUBLIC_API_URL;
      delete process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

      // Should not throw even though variables are missing
      expect(() => validateEnv()).not.toThrow();
    });

    it('should throw error when NEXT_PUBLIC_API_URL is missing', () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      process.env.NEXT_PUBLIC_SITE_URL = 'https://medcorebd.com';
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test_cloud';

      expect(() => validateEnv()).toThrow(/NEXT_PUBLIC_API_URL/);
    });

    it('should throw error when NEXT_PUBLIC_SITE_URL is missing', () => {
      process.env.NEXT_PUBLIC_API_URL = '/api';
      delete process.env.NEXT_PUBLIC_SITE_URL;
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test_cloud';

      expect(() => validateEnv()).toThrow(/NEXT_PUBLIC_SITE_URL/);
    });

    it('should throw error when NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is missing', () => {
      process.env.NEXT_PUBLIC_API_URL = '/api';
      process.env.NEXT_PUBLIC_SITE_URL = 'https://medcorebd.com';
      delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

      expect(() => validateEnv()).toThrow(/NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME/);
    });

    it('should throw error listing all missing variables when multiple are missing', () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      delete process.env.NEXT_PUBLIC_SITE_URL;
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test_cloud';

      expect(() => validateEnv()).toThrow(/NEXT_PUBLIC_API_URL.*NEXT_PUBLIC_SITE_URL/);
    });

    it('should include helpful error message with examples', () => {
      delete process.env.NEXT_PUBLIC_API_URL;

      expect(() => validateEnv()).toThrow(/Example configuration/);
      expect(() => validateEnv()).toThrow(/\.env\.local/);
      expect(() => validateEnv()).toThrow(/\.env\.production/);
    });
  });

  describe('getEnvStatus()', () => {
    it('should return valid status when all variables are present', () => {
      process.env.NEXT_PUBLIC_API_URL = '/api';
      process.env.NEXT_PUBLIC_SITE_URL = 'https://medcorebd.com';
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test_cloud';

      const status = getEnvStatus();

      expect(status.valid).toBe(true);
      expect(status.missing).toEqual([]);
      expect(status.present).toEqual([
        'NEXT_PUBLIC_API_URL',
        'NEXT_PUBLIC_SITE_URL',
        'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
      ]);
    });

    it('should return invalid status when variables are missing', () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      process.env.NEXT_PUBLIC_SITE_URL = 'https://medcorebd.com';
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test_cloud';

      const status = getEnvStatus();

      expect(status.valid).toBe(false);
      expect(status.missing).toEqual(['NEXT_PUBLIC_API_URL']);
      expect(status.present).toEqual([
        'NEXT_PUBLIC_SITE_URL',
        'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
      ]);
    });

    it('should list all missing variables', () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      delete process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

      const status = getEnvStatus();

      expect(status.valid).toBe(false);
      expect(status.missing).toEqual([
        'NEXT_PUBLIC_API_URL',
        'NEXT_PUBLIC_SITE_URL',
        'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
      ]);
      expect(status.present).toEqual([]);
    });
  });
});
