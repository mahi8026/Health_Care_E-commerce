'use strict';

/**
 * Email Service — unified re-export
 *
 * All email sending now goes through services/emailService (Brevo HTTP API).
 * This file is kept for backward-compatible imports from older controllers.
 */

module.exports = require('../services/emailService');
