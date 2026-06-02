/**
 * Build-time environment variable validation utility.
 * Validates that all required environment variables are present and properly configured.
 * Throws descriptive errors if any required variables are missing.
 * 
 * This module is called during the Next.js build process to fail fast if the
 * environment is not properly configured, preventing deployment of misconfigured builds.
 * 
 * @module validateEnv
 */

/**
 * List of required environment variables for the application to function correctly.
 * These variables must be present in .env.local (development) or .env.production (production).
 * 
 * @constant {string[]}
 */
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
];

/**
 * Validates that all required environment variables are present.
 * Throws an error with a clear message if any required variables are missing.
 * 
 * This function is designed to be called at build time (in next.config.mjs)
 * to ensure the build fails early if the environment is misconfigured.
 * 
 * Skips validation during test runs (when NODE_ENV === 'test') to avoid
 * interfering with Jest test execution.
 * 
 * @throws {Error} If any required environment variables are missing
 * @returns {void}
 * 
 * @example
 * // In next.config.mjs
 * import { validateEnv } from './src/utils/validateEnv.js';
 * validateEnv();
 */
export function validateEnv() {
  // Skip validation during test runs
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const missingVars = [];

  // Check each required variable
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  // If any variables are missing, throw a descriptive error
  if (missingVars.length > 0) {
    const errorMessage = [
      '',
      '❌ Build-time environment variable validation failed!',
      '',
      `Missing required environment variables: ${missingVars.join(', ')}`,
      '',
      'Required environment variables:',
      ...REQUIRED_ENV_VARS.map(varName => `  - ${varName}`),
      '',
      'Please ensure these variables are defined in:',
      '  - .env.local (for development)',
      '  - .env.production (for production)',
      '  - Vercel environment variables (for Vercel deployments)',
      '',
      'Example configuration:',
      '  NEXT_PUBLIC_API_URL=/api',
      '  NEXT_PUBLIC_SITE_URL=https://medcorebd.com',
      '  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name',
      '',
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Log success message (visible during build)
  console.log('✅ Environment variable validation passed');
}

/**
 * Gets the current environment configuration summary.
 * Useful for debugging and logging during build/startup.
 * 
 * @returns {Object} Object containing environment variable status
 * 
 * @example
 * const envStatus = getEnvStatus();
 * console.log(envStatus);
 * // { valid: true, missing: [], present: ['NEXT_PUBLIC_API_URL', ...] }
 */
export function getEnvStatus() {
  const missing = [];
  const present = [];

  for (const varName of REQUIRED_ENV_VARS) {
    if (process.env[varName]) {
      present.push(varName);
    } else {
      missing.push(varName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    present,
  };
}
