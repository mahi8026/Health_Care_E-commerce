import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const DISTRICTS = [
  'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi',
  'Khulna', 'Barishal', 'Rangpur', 'Mymensingh'
];

const PHONE_REGEX = /^01[3-9]\d{8}$/;
const POSTCODE_REGEX = /^\d{4}$/;

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  street: '',
  district: 'Dhaka',
  thana: '',
  postcode: '',
  instructions: '',
};

export default function DeliveryAddress({ onChange }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // Notify parent whenever form data changes
  useEffect(() => {
    if (onChange) onChange(formData);
  }, [formData]); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = (name, value) => {
    switch (name) {
      case 'fullName':
        return value.trim().length < 2 ? 'Name must be at least 2 characters' : '';
      case 'phone': {
        const digits = value.replace(/[\s\-+]/g, '');
        return !PHONE_REGEX.test(digits) ? 'Enter a valid Bangladesh number (01XXXXXXXXX)' : '';
      }
      case 'street':
        return value.trim().length < 5 ? 'Please enter a full street address' : '';
      case 'thana':
        return value.trim().length < 2 ? 'Please enter thana / upazila' : '';
      case 'postcode':
        return !POSTCODE_REGEX.test(value) ? 'Postcode must be 4 digits' : '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const error = validate(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUseSaved = () => {
    const saved = user?.addresses?.[0];
    if (!saved) return;
    const prefilled = {
      fullName: saved.name || user.name || '',
      phone: saved.phone || user.phone || '',
      street: saved.street || saved.address || '',
      district: saved.district || saved.city || 'Dhaka',
      thana: saved.thana || saved.area || '',
      postcode: saved.postcode || saved.postalCode || '',
      instructions: saved.instructions || '',
    };
    setFormData(prefilled);
    setErrors({});
  };

  const fieldClass = (name) =>
    `w-full px-3 py-[9px] border-[0.5px] rounded-lg text-[13px] font-[family-name:var(--font-plus-jakarta)] focus:outline-none ${
      errors[name]
        ? 'border-[#E24B4A] focus:border-[#E24B4A]'
        : 'border-[var(--color-border-secondary)] focus:border-[#0E8A6E]'
    }`;

  return (
    <div className="bg-white rounded-lg p-5 mb-4 border-[0.5px] border-[var(--color-border-tertiary)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
          Delivery address
        </h3>
        {user?.addresses?.[0] && (
          <button
            type="button"
            onClick={handleUseSaved}
            className="text-[12px] text-[#0E8A6E] font-medium hover:underline"
          >
            Use saved address
          </button>
        )}
      </div>

      {/* Full name */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1 font-[family-name:var(--font-plus-jakarta)]">
            Full name / facility name *
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Dr. Shahid Hasan"
            className={fieldClass('fullName')}
          />
          {errors.fullName && (
            <p className="text-[10px] text-[#E24B4A] mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1 font-[family-name:var(--font-plus-jakarta)]">
            Contact phone number *
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="01XXXXXXXXX"
            className={fieldClass('phone')}
          />
          {errors.phone && (
            <p className="text-[10px] text-[#E24B4A] mt-1">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Street address */}
      <div className="mb-3">
        <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1 font-[family-name:var(--font-plus-jakarta)]">
          Street address *
        </label>
        <input
          type="text"
          name="street"
          value={formData.street}
          onChange={handleChange}
          placeholder="House no., road, area"
          className={fieldClass('street')}
        />
        {errors.street && (
          <p className="text-[10px] text-[#E24B4A] mt-1">{errors.street}</p>
        )}
      </div>

      {/* District / Thana / Postcode */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1 font-[family-name:var(--font-plus-jakarta)]">
            District *
          </label>
          <select
            name="district"
            value={formData.district}
            onChange={handleChange}
            className="w-full px-3 py-[9px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] font-[family-name:var(--font-plus-jakarta)] focus:outline-none focus:border-[#0E8A6E] bg-white"
          >
            {DISTRICTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1 font-[family-name:var(--font-plus-jakarta)]">
            Thana / Upazila *
          </label>
          <input
            type="text"
            name="thana"
            value={formData.thana}
            onChange={handleChange}
            placeholder="e.g. Dhanmondi"
            className={fieldClass('thana')}
          />
          {errors.thana && (
            <p className="text-[10px] text-[#E24B4A] mt-1">{errors.thana}</p>
          )}
        </div>

        <div>
          <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1 font-[family-name:var(--font-plus-jakarta)]">
            Postcode *
          </label>
          <input
            type="text"
            name="postcode"
            value={formData.postcode}
            onChange={handleChange}
            placeholder="1209"
            maxLength={4}
            className={fieldClass('postcode')}
          />
          {errors.postcode && (
            <p className="text-[10px] text-[#E24B4A] mt-1">{errors.postcode}</p>
          )}
        </div>
      </div>

      {/* Delivery instructions */}
      <div>
        <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1 font-[family-name:var(--font-plus-jakarta)]">
          Delivery instructions (optional)
        </label>
        <textarea
          name="instructions"
          value={formData.instructions}
          onChange={handleChange}
          rows={2}
          placeholder="e.g. Call before delivery, leave at reception"
          className="w-full px-3 py-[9px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] font-[family-name:var(--font-plus-jakarta)] focus:outline-none focus:border-[#0E8A6E] resize-none"
        />
      </div>
    </div>
  );
}
