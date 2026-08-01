import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/Input';

const DIVISION_DISTRICTS = {
  'Dhaka':      ['Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Madaripur', 'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail'],
  'Chattogram': ['Bandarban', 'Brahmanbaria', 'Chandpur', 'Chattogram', "Cox's Bazar", 'Cumilla', 'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati'],
  'Rajshahi':   ['Bogura', 'Chapai Nawabganj', 'Joypurhat', 'Naogaon', 'Natore', 'Pabna', 'Rajshahi', 'Sirajganj'],
  'Khulna':     ['Bagerhat', 'Chuadanga', 'Jessore', 'Jhenaidah', 'Khulna', 'Kushtia', 'Magura', 'Meherpur', 'Narail', 'Satkhira'],
  'Barishal':   ['Barguna', 'Barishal', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur'],
  'Sylhet':     ['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet'],
  'Rangpur':    ['Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Rangpur', 'Thakurgaon'],
  'Mymensingh': ['Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur'],
};
const DIVISIONS = Object.keys(DIVISION_DISTRICTS);

const PHONE_REGEX = /^(\+880|880|0)?1[3-9]\d{8}$/;
const POSTCODE_REGEX = /^\d{4}$/;

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  street: '',
  division: 'Dhaka',
  district: 'Dhaka',
  thana: '',
  postcode: '',
  instructions: '',
};

const inputBase =
  'w-full px-3 py-2.5 min-h-[48px] text-base sm:text-sm text-brand-navy bg-white border border-[var(--color-border-primary)] rounded-xl font-[family-name:var(--font-plus-jakarta)] placeholder:text-[var(--color-text-tertiary)] transition-colors focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15';

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

    if (name === 'division') {
      // Reset district to first district of new division
      const firstDistrict = DIVISION_DISTRICTS[val]?.[0] || '';
      if (onChange) onChange({ ...formData, division: val, district: firstDistrict });
    } else {
      if (onChange) onChange({ ...formData, [name]: val });
    }
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
  return (
    <section className="bg-white rounded-2xl border border-[var(--color-border-primary)] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--color-border-tertiary)]">
        <div>
          <h2 className="text-base font-semibold text-brand-navy m-0">Delivery address</h2>
          <p className="text-xs text-[var(--color-text-secondary)] m-0 mt-0.5">Where should we deliver your order?</p>
        </div>
        {(savedAddress || user?.addresses?.[0]) && (
          <button
            type="button"
            onClick={handleUseSaved}
            className="text-xs font-semibold text-brand-teal hover:underline shrink-0"
          >
            Use saved
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Input
            label="Full name / facility"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="e.g., Dr. Abdur Rahman"
            autoComplete="name"
            error={errors.fullName}
            required
          />
        </div>

        <div>
          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="01XXXXXXXXX"
            autoComplete="tel"
            error={errors.phone}
            required
          />
        </div>

        <div>
          <label htmlFor="checkout-division" className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
            Division <span className="text-danger">*</span>
          </label>
          <select id="checkout-division" name="division" value={formData.division || 'Dhaka'} onChange={handleChange} className={inputBase}>
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="checkout-district" className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
            District <span className="text-danger">*</span>
          </label>
          <select id="checkout-district" name="district" value={formData.district} onChange={handleChange} className={inputBase}>
            {(DIVISION_DISTRICTS[formData.division || 'Dhaka'] || []).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <Input
            label="Street address"
            name="street"
            value={formData.street}
            onChange={handleChange}
            placeholder="House no., road, area"
            autoComplete="street-address"
            error={errors.street}
            required
          />
        </div>

        <div>
          <Input
            label="Thana / Upazila"
            name="thana"
            value={formData.thana}
            onChange={handleChange}
            placeholder="Dhanmondi"
            autoComplete="address-level2"
            error={errors.thana}
            required
          />
        </div>

        <div>
          <Input
            label="Postcode"
            name="postcode"
            value={formData.postcode}
            onChange={handleChange}
            placeholder="1209"
            maxLength={4}
            autoComplete="postal-code"
            error={errors.postcode}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="checkout-instructions" className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
            Instructions <span className="font-normal text-[var(--color-text-tertiary)]">(optional)</span>
          </label>
          <textarea
            id="checkout-instructions"
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
