// Form validation utilities
// Returns null on success, or an error string on failure.
// Use validateForm() / validateField() to compose multiple rules.

export const validators = {
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return 'Email is required';
    if (!emailRegex.test(value)) return 'Invalid email format';
    return null;
  },

  /**
   * Bangladesh phone: accepts these formats
   *   1[3-9]XXXXXXXX    (10 digits, operator-only, no leading 0 or country code)
   *   01[3-9]XXXXXXXX   (11 digits, standard local format)
   *   8801[3-9]XXXXXXXX (13 digits, country code without +)
   *   +8801[3-9]XXXXXXXX(14 chars, country code with +)
   * Operator digit must be 3–9.
   */
  phone: (value) => {
    if (!value) return 'Phone number is required';
    // Remove whitespace, hyphens, and leading +
    const cleaned = value.replace(/[\s\-+]/g, '');
    // Strip country code prefix (880 or 00880) if present
    const stripped = cleaned.replace(/^(00880|880)/, '');
    // Accept both 01[3-9]XXXXXXXX (11 digits) and 1[3-9]XXXXXXXX (10 digits)
    const phoneRegex = /^0?1[3-9]\d{8}$/;
    if (!phoneRegex.test(stripped)) {
      return 'Invalid Bangladesh phone number';
    }
    return null;
  },

  required: (value, fieldName = 'This field') => {
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  minLength: (value, min, fieldName = 'This field') => {
    // Only validate when a value is present; pair with required() for mandatory fields
    if (value != null && String(value).length > 0 && String(value).length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (value, max, fieldName = 'This field') => {
    if (value != null && String(value).length > max) {
      return `${fieldName} must not exceed ${max} characters`;
    }
    return null;
  },

  password: (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(value)) return 'Password must contain a lowercase letter';
    if (!/[0-9]/.test(value)) return 'Password must contain a number';
    return null;
  },

  confirmPassword: (value, password) => {
    if (!value) return 'Please confirm your password';
    if (value !== password) return 'Passwords do not match';
    return null;
  },

  postalCode: (value) => {
    const postalRegex = /^\d{4}$/;
    // Optional field — empty is fine; only validate if a value was entered
    if (value && !postalRegex.test(value)) {
      return 'Invalid postal code (4 digits)';
    }
    return null;
  },

  /**
   * Validates that the value is a number.
   * Treats empty / undefined as valid (pair with required() if mandatory).
   * Correctly handles 0 and negative numbers.
   */
  number: (value, fieldName = 'This field') => {
    if (value === '' || value === null || value === undefined) return null;
    if (isNaN(Number(value))) {
      return `${fieldName} must be a number`;
    }
    return null;
  },

  /**
   * Validates that the numeric value is >= min.
   * Treats empty / undefined as valid (pair with required() if mandatory).
   * Correctly handles 0.
   */
  min: (value, min, fieldName = 'This field') => {
    if (value === '' || value === null || value === undefined) return null;
    if (parseFloat(value) < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  },

  /**
   * Validates that the numeric value is <= max.
   * Treats empty / undefined as valid (pair with required() if mandatory).
   */
  max: (value, max, fieldName = 'This field') => {
    if (value === '' || value === null || value === undefined) return null;
    if (parseFloat(value) > max) {
      return `${fieldName} must not exceed ${max}`;
    }
    return null;
  },
};

/**
 * Validate an entire form object against a rules map.
 *
 * @param {Record<string, any>} values  - Form field values keyed by field name
 * @param {Record<string, Function[]>} rules - Array of validator functions per field
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 *
 * @example
 * const { isValid, errors } = validateForm(
 *   { email: 'bad', name: '' },
 *   {
 *     email: [validators.email],
 *     name: [(v) => validators.required(v, 'Name')],
 *   }
 * );
 */
export function validateForm(values, rules) {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const fieldRules = rules[field];
    const value = values[field];

    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break; // Stop at first error for this field
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate a single value against an ordered array of rules.
 * Returns the first error message, or null if all rules pass.
 *
 * @param {any} value
 * @param {Function[]} rules
 * @returns {string|null}
 */
export function validateField(value, rules) {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}
