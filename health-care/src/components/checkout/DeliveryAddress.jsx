import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const DISTRICTS = [
  'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi',
  'Khulna', 'Barishal', 'Rangpur', 'Mymensingh',
];

const PHONE_REGEX = /^(\+880|880|0)?1[3-9]\d{8}$/;
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

const inputBase =
  'w-full px-3 py-2.5 min-h-[48px] text-[16px] sm:text-sm text-[#0B2545] bg-white border border-[#E5E7EB] rounded-xl font-[family-name:var(--font-plus-jakarta)] placeholder:text-[#9CA3AF] transition-colors focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/15';

export default function DeliveryAddress({ value, onChange, savedAddress }) {
  const { user } = useAuth();
  const formData = value || EMPTY_FORM;
  const [errors, setErrors] = useState({});

  const validate = (name, val) => {
    switch (name) {
      case 'fullName':
        return (val || '').trim().length < 2 ? 'Name must be at least 2 characters' : '';
      case 'phone': {
        const digits = (val || '').replace(/[\s\-+]/g, '');
        return !PHONE_REGEX.test(digits) ? 'Enter a valid Bangladesh number (01XXXXXXXXX)' : '';
      }
      case 'street':
        return (val || '').trim().length < 5 ? 'Please enter a full street address' : '';
      case 'thana':
        return (val || '').trim().length < 2 ? 'Please enter thana / upazila' : '';
      case 'postcode':
        return !POSTCODE_REGEX.test(val || '') ? 'Postcode must be 4 digits' : '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, val: rawVal } = e.target;
    const val = rawVal !== undefined ? rawVal : e.target.value;
    setErrors((prev) => ({ ...prev, [name]: validate(name, val) }));
    if (onChange) onChange({ ...formData, [name]: val });
  };

  const handleUseSaved = () => {
    const saved = savedAddress || user?.addresses?.[0];
    if (!saved) return;
    onChange?.({
      fullName: saved.name || user?.name || '',
      phone: saved.phone || user?.phone || '',
      street: saved.street || saved.address || '',
      district: saved.district || saved.city || 'Dhaka',
      thana: saved.thana || saved.area || '',
      postcode: saved.postcode || saved.postalCode || '',
      instructions: saved.instructions || '',
    });
    setErrors({});
  };

  const field = (name) => (errors[name] ? `${inputBase} border-[#E24B4A] focus:border-[#E24B4A] focus:ring-[#E24B4A]/15` : inputBase);

  return (
    <section className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#F3F4F6]">
        <div>
          <h2 className="text-[15px] font-bold text-[#0B2545] m-0">Delivery address</h2>
          <p className="text-[12px] text-[#6B7280] m-0 mt-0.5">Where should we deliver your order?</p>
        </div>
        {(savedAddress || user?.addresses?.[0]) && (
          <button
            type="button"
            onClick={handleUseSaved}
            className="text-[12px] font-semibold text-[#0E8A6E] hover:underline shrink-0"
          >
            Use saved
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">
            Full name / facility <span className="text-[#E24B4A]">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Dr. Shahid Hasan"
            className={field('fullName')}
          />
          {errors.fullName && <p className="text-[11px] text-[#E24B4A] mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">
            Phone <span className="text-[#E24B4A]">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="01XXXXXXXXX"
            className={field('phone')}
          />
          {errors.phone && <p className="text-[11px] text-[#E24B4A] mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">
            District <span className="text-[#E24B4A]">*</span>
          </label>
          <select name="district" value={formData.district} onChange={handleChange} className={inputBase}>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">
            Street address <span className="text-[#E24B4A]">*</span>
          </label>
          <input
            type="text"
            name="street"
            value={formData.street}
            onChange={handleChange}
            placeholder="House no., road, area"
            className={field('street')}
          />
          {errors.street && <p className="text-[11px] text-[#E24B4A] mt-1">{errors.street}</p>}
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">
            Thana / Upazila <span className="text-[#E24B4A]">*</span>
          </label>
          <input
            type="text"
            name="thana"
            value={formData.thana}
            onChange={handleChange}
            placeholder="Dhanmondi"
            className={field('thana')}
          />
          {errors.thana && <p className="text-[11px] text-[#E24B4A] mt-1">{errors.thana}</p>}
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">
            Postcode <span className="text-[#E24B4A]">*</span>
          </label>
          <input
            type="text"
            name="postcode"
            value={formData.postcode}
            onChange={handleChange}
            placeholder="1209"
            maxLength={4}
            className={field('postcode')}
          />
          {errors.postcode && <p className="text-[11px] text-[#E24B4A] mt-1">{errors.postcode}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[12px] font-semibold text-[#374151] mb-1.5">
            Instructions <span className="font-normal text-[#9CA3AF]">(optional)</span>
          </label>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            rows={2}
            placeholder="Call before delivery…"
            className={`${inputBase} resize-none min-h-[80px]`}
          />
        </div>
      </div>
    </section>
  );
}
