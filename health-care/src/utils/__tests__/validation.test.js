import { validators, validateForm, validateField } from '../validation';

describe('validators', () => {
  // ── email ──────────────────────────────────────────────────────────────────
  describe('email', () => {
    it('accepts valid email', () => {
      expect(validators.email('test@example.com')).toBeNull();
    });

    it('rejects empty', () => {
      expect(validators.email('')).toBe('Email is required');
    });

    it('rejects invalid format', () => {
      expect(validators.email('notanemail')).toBe('Invalid email format');
    });
  });

  // ── phone (Bangladesh) ─────────────────────────────────────────────────────
  describe('phone', () => {
    it('accepts valid BD phone with +880', () => {
      expect(validators.phone('+8801712345678')).toBeNull();
    });

    it('accepts valid BD phone without prefix', () => {
      expect(validators.phone('1712345678')).toBeNull();
    });

    it('rejects empty', () => {
      expect(validators.phone('')).toBe('Phone number is required');
    });

    it('rejects invalid format', () => {
      expect(validators.phone('12345')).toBe('Invalid Bangladesh phone number');
    });
  });

  // ── required ───────────────────────────────────────────────────────────────
  describe('required', () => {
    it('passes for non-empty value', () => {
      expect(validators.required('hello')).toBeNull();
    });

    it('fails for empty string', () => {
      expect(validators.required('')).toBeTruthy();
    });

    it('fails for whitespace-only', () => {
      expect(validators.required('   ')).toBeTruthy();
    });

    it('includes field name in message', () => {
      expect(validators.required('', 'Name')).toBe('Name is required');
    });
  });

  // ── minLength / maxLength ──────────────────────────────────────────────────
  describe('minLength', () => {
    it('passes when value meets minimum', () => {
      expect(validators.minLength('abcde', 5)).toBeNull();
    });

    it('fails when value is too short', () => {
      expect(validators.minLength('ab', 5, 'Name')).toBe('Name must be at least 5 characters');
    });
  });

  describe('maxLength', () => {
    it('passes when within limit', () => {
      expect(validators.maxLength('abc', 5)).toBeNull();
    });

    it('fails when over limit', () => {
      expect(validators.maxLength('abcdef', 5, 'Bio')).toBe('Bio must not exceed 5 characters');
    });
  });

  // ── password ───────────────────────────────────────────────────────────────
  describe('password', () => {
    it('accepts a valid password', () => {
      expect(validators.password('Abcdef1!')).toBeNull();
    });

    it('rejects empty', () => {
      expect(validators.password('')).toBe('Password is required');
    });

    it('rejects short passwords', () => {
      expect(validators.password('Ab1')).toBe('Password must be at least 8 characters');
    });

    it('rejects missing uppercase', () => {
      expect(validators.password('abcdefgh1')).toBe('Password must contain an uppercase letter');
    });

    it('rejects missing lowercase', () => {
      expect(validators.password('ABCDEFGH1')).toBe('Password must contain a lowercase letter');
    });

    it('rejects missing number', () => {
      expect(validators.password('Abcdefgh')).toBe('Password must contain a number');
    });
  });

  // ── confirmPassword ────────────────────────────────────────────────────────
  describe('confirmPassword', () => {
    it('passes when passwords match', () => {
      expect(validators.confirmPassword('Password1', 'Password1')).toBeNull();
    });

    it('fails when empty', () => {
      expect(validators.confirmPassword('', 'Password1')).toBe('Please confirm your password');
    });

    it('fails when passwords differ', () => {
      expect(validators.confirmPassword('Password2', 'Password1')).toBe('Passwords do not match');
    });
  });

  // ── postalCode ─────────────────────────────────────────────────────────────
  describe('postalCode', () => {
    it('accepts 4-digit code', () => {
      expect(validators.postalCode('1205')).toBeNull();
    });

    it('rejects non-4-digit code', () => {
      expect(validators.postalCode('123')).toBe('Invalid postal code (4 digits)');
    });

    it('passes for empty value (optional field)', () => {
      expect(validators.postalCode('')).toBeNull();
    });
  });

  // ── number / min / max ─────────────────────────────────────────────────────
  describe('number', () => {
    it('passes for valid number', () => {
      expect(validators.number('42')).toBeNull();
    });

    it('fails for non-numeric', () => {
      expect(validators.number('abc', 'Price')).toBe('Price must be a number');
    });
  });

  describe('min', () => {
    it('passes when at or above minimum', () => {
      expect(validators.min('10', 5)).toBeNull();
    });

    it('fails when below minimum', () => {
      expect(validators.min('3', 5, 'Qty')).toBe('Qty must be at least 5');
    });
  });

  describe('max', () => {
    it('passes when at or below maximum', () => {
      expect(validators.max('5', 10)).toBeNull();
    });

    it('fails when above maximum', () => {
      expect(validators.max('15', 10, 'Qty')).toBe('Qty must not exceed 10');
    });
  });
});

// ── validateForm ─────────────────────────────────────────────────────────────
describe('validateForm', () => {
  it('returns isValid:true when all rules pass', () => {
    const values = { email: 'test@example.com', name: 'John' };
    const rules = {
      email: [validators.email],
      name: [(v) => validators.required(v, 'Name')],
    };
    const result = validateForm(values, rules);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('returns isValid:false with error messages', () => {
    const values = { email: 'bad', name: '' };
    const rules = {
      email: [validators.email],
      name: [(v) => validators.required(v, 'Name')],
    };
    const result = validateForm(values, rules);
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBe('Invalid email format');
    expect(result.errors.name).toBe('Name is required');
  });

  it('stops at first error per field', () => {
    const values = { pw: '' };
    const rules = {
      pw: [validators.password],
    };
    const result = validateForm(values, rules);
    expect(result.errors.pw).toBe('Password is required');
  });
});

// ── validateField ────────────────────────────────────────────────────────────
describe('validateField', () => {
  it('returns null when all rules pass', () => {
    expect(validateField('test@x.com', [validators.email])).toBeNull();
  });

  it('returns the first error message', () => {
    expect(validateField('', [validators.email])).toBe('Email is required');
  });
});
