'use strict';

/**
 * @fileoverview Standardized HTTP response helpers for all Express controllers.
 *
 * All helpers return a consistent JSON envelope so that API consumers can
 * rely on a predictable shape regardless of which endpoint they call.
 *
 * Success envelope:
 *   { success: true, data, message }
 *
 * Error envelope:
 *   { success: false, message, errors, requestId }
 *
 * Paginated envelope:
 *   { success: true, data, pagination }
 */

/**
 * Send a successful JSON response.
 *
 * @param {import('express').Response} res - Express response object.
 * @param {*} data - The payload to return (object, array, or primitive).
 * @param {string} [message] - Optional human-readable success message.
 * @param {number} [statusCode=200] - HTTP status code (defaults to 200).
 * @returns {import('express').Response}
 *
 * @example
 * successResponse(res, { id: user._id, name: user.name }, 'User fetched successfully');
 * // → 200 { success: true, data: { id: '...', name: '...' }, message: 'User fetched successfully' }
 */
function successResponse(res, data, message, statusCode = 200) {
  const body = { success: true };
  if (data !== undefined) body.data = data;
  if (message !== undefined) body.message = message;
  return res.status(statusCode).json(body);
}

/**
 * Send an error JSON response.
 *
 * The `requestId` is read from `res.locals.requestId` (set by the request-ID
 * middleware in server.js) so that every error response is traceable.
 *
 * @param {import('express').Response} res - Express response object.
 * @param {string} message - Human-readable error description.
 * @param {Array<string>|null} [errors=null] - Optional list of field-level or
 *   detailed error messages (e.g. from express-validator).
 * @param {number} [statusCode=500] - HTTP status code (defaults to 500).
 * @returns {import('express').Response}
 *
 * @example
 * errorResponse(res, 'Invalid credentials', null, 401);
 * // → 401 { success: false, message: 'Invalid credentials', errors: null, requestId: 'uuid' }
 *
 * @example
 * errorResponse(res, 'Validation failed', ['email is required', 'password too short'], 400);
 * // → 400 { success: false, message: 'Validation failed', errors: [...], requestId: 'uuid' }
 */
function errorResponse(res, message, errors = null, statusCode = 500) {
  const body = {
    success: false,
    message,
    errors,
    requestId: res.locals?.requestId || res.req?.id || undefined,
  };
  return res.status(statusCode).json(body);
}

/**
 * Send a paginated list response.
 *
 * @param {import('express').Response} res - Express response object.
 * @param {Array<*>} data - The page of items to return.
 * @param {object} pagination - Pagination metadata object.
 * @param {number} pagination.page - Current page number (1-indexed).
 * @param {number} pagination.limit - Items per page.
 * @param {number} pagination.total - Total number of items across all pages.
 * @param {number} pagination.totalPages - Total number of pages.
 * @param {boolean} pagination.hasNext - Whether a next page exists.
 * @param {boolean} pagination.hasPrev - Whether a previous page exists.
 * @param {number} [statusCode=200] - HTTP status code (defaults to 200).
 * @returns {import('express').Response}
 *
 * @example
 * paginatedResponse(res, products, { page: 1, limit: 20, total: 450, totalPages: 23, hasNext: true, hasPrev: false });
 * // → 200 { success: true, data: [...], pagination: { page: 1, limit: 20, ... } }
 */
function paginatedResponse(res, data, pagination, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    pagination,
  });
}

module.exports = { successResponse, errorResponse, paginatedResponse };
