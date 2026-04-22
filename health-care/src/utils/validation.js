// Form validation utilities

export const validators = {
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return 'Email is required';
    if (!emailRegex.test(value)) return 'Invalid email format';
    return null;
  },

  phone: (value) => {
    const phoneRegex = /^(\+880|880)?[1-9]\d{9}$/;
    if (!value) return 'Phone number is required';
    if (!phoneRegex.test(value.replace(/[\s-]/g, ''))) {
      return 'Invalid Bangladesh phone number';
    }
    return null;
  },

  required: (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  minLength: (value, min, fieldName = 'This field') => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (value, max, fieldName = 'This field') => {
    if (value && value.length > max) {
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
    if (value && !postalRegex.test(value)) {
      return 'Invalid postal code (4 digits)';
    }
    return null;
  },

  number: (value, fieldName = 'This field') => {
    if (value && isNaN(value)) {
      return `${fieldName} must be a number`;
    }
    return null;
  },

  min: (value, min, fieldName = 'This field') => {
    if (value && parseFloat(value) < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  },

  max: (value, max, fieldName = 'This field') => {
    if (value && parseFloat(value) > max) {
      return `${fieldName} must not exceed ${max}`;
    }
    return null;
  }
};

export function validateForm(values, rules) {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
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
    errors
  };
}

export function validateField(value, rules) {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}
