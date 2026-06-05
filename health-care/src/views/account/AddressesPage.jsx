'use client';

import { useState, useEffect } from 'react';
import AccountPageShell from '@/components/account/AccountPageShell';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import Button from '@/components/ui/Button';
import { FaPlus, FaTrash, FaStar } from 'react-icons/fa';

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

const EMPTY_ADDRESS = {
  label: 'Home',
  street: '',
  thana: '',
  division: 'Dhaka',
  district: 'Dhaka',
  postcode: '',
  isDefault: false,
};

export default function AddressesPage() {
  const { user, updateProfile } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getMe();
        const list = res.user?.addresses?.length
          ? res.user.addresses
          : res.user?.address?.street
            ? [{
                label: 'Home',
                street: res.user.address.street,
                thana: res.user.address.area || '',
                district: res.user.address.city || 'Dhaka',
                postcode: res.user.address.postalCode || '',
                isDefault: true,
              }]
            : [];
        setAddresses(list);
      } catch {
        setAddresses(user?.addresses || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const persist = async (nextAddresses) => {
    setSaving(true);
    const result = await updateProfile({ addresses: nextAddresses });
    setSaving(false);
    if (result.success) {
      setAddresses(nextAddresses);
      showMessage('Addresses saved', 'success');
      return true;
    }
    showMessage(result.error || 'Failed to save addresses', 'error');
    return false;
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!form.street.trim() || !form.thana.trim() || !form.postcode.trim()) {
      showMessage('Please fill street, thana, and postcode', 'error');
      return;
    }

    const entry = { ...form, street: form.street.trim(), thana: form.thana.trim(), postcode: form.postcode.trim() };
    let next = [...addresses];

    if (entry.isDefault) {
      next = next.map((a) => ({ ...a, isDefault: false }));
    }

    if (editingIndex !== null) {
      next[editingIndex] = entry;
    } else {
      if (next.length === 0) entry.isDefault = true;
      next.push(entry);
    }

    const ok = await persist(next);
    if (ok) {
      setEditingIndex(null);
      setForm(EMPTY_ADDRESS);
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setForm({ ...addresses[index] });
  };

  const handleDelete = async (index) => {
    if (!confirm('Remove this address?')) return;
    const next = addresses.filter((_, i) => i !== index);
    if (next.length && !next.some((a) => a.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    await persist(next);
  };

  const handleSetDefault = async (index) => {
    const next = addresses.map((a, i) => ({ ...a, isDefault: i === index }));
    await persist(next);
  };

  const fieldClass =
    'w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E]';

  return (
    <AccountPageShell
      title="Delivery Addresses"
      description="Manage addresses used at checkout."
    >
      {message.text && (
        <div
          role="alert"
          className={`mb-4 px-4 py-3 rounded-lg text-[13px] ${
            message.type === 'success' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <p className="text-[13px] text-[var(--color-text-secondary)]">Loading addresses…</p>
      ) : (
        <>
          {addresses.length > 0 && (
            <div className="space-y-3 mb-6">
              {addresses.map((addr, index) => (
                <div
                  key={`${addr.street}-${index}`}
                  className="bg-white rounded-lg border border-[var(--color-border-tertiary)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-[#0B2545]">{addr.label || 'Address'}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-[#E1F5EE] text-[#0E8A6E] px-2 py-0.5 rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
                        {addr.street}, {addr.thana}, {addr.district} {addr.postcode}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(index)}
                          disabled={saving}
                          className="p-2 text-[#0E8A6E] hover:bg-[#F0FBF8] rounded-lg transition-colors"
                          title="Set as default"
                          aria-label="Set as default"
                        >
                          <FaStar size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEdit(index)}
                        className="px-2 py-1 text-[11px] font-medium text-[#374151] hover:bg-[var(--color-background-tertiary)] rounded-lg"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(index)}
                        disabled={saving}
                        className="p-2 text-[#E24B4A] hover:bg-[#FEE2E2] rounded-lg transition-colors"
                        aria-label="Delete address"
                      >
                        <FaTrash size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-lg border border-[var(--color-border-tertiary)] p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold text-[#0B2545] mb-4 flex items-center gap-2">
              <FaPlus size={12} className="text-[#0E8A6E]" />
              {editingIndex !== null ? 'Edit address' : 'Add new address'}
            </h2>
            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium mb-1.5">Label</label>
                  <input
                    className={fieldClass}
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="Home, Office…"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-1.5">Division</label>
                  <select
                    className={fieldClass}
                    value={form.division || 'Dhaka'}
                    onChange={(e) => {
                      const division = e.target.value;
                      const firstDistrict = DIVISION_DISTRICTS[division]?.[0] || '';
                      setForm((f) => ({ ...f, division, district: firstDistrict }));
                    }}
                  >
                    {DIVISIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-1.5">District</label>
                  <select
                    className={fieldClass}
                    value={form.district}
                    onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                  >
                    {(DIVISION_DISTRICTS[form.division || 'Dhaka'] || []).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5">Street address</label>
                <input
                  className={fieldClass}
                  value={form.street}
                  onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium mb-1.5">Thana / upazila</label>
                  <input
                    className={fieldClass}
                    value={form.thana}
                    onChange={(e) => setForm((f) => ({ ...f, thana: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-1.5">Postcode</label>
                  <input
                    className={fieldClass}
                    value={form.postcode}
                    onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))}
                    maxLength={4}
                    required
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-[12px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                  className="rounded border-gray-300 text-[#0E8A6E] focus:ring-[#0E8A6E]"
                />
                Set as default delivery address
              </label>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editingIndex !== null ? 'Update address' : 'Add address'}
                </Button>
                {editingIndex !== null && (
                  <button
                    type="button"
                    onClick={() => { setEditingIndex(null); setForm(EMPTY_ADDRESS); }}
                    className="px-4 py-2 text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[#0B2545]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </>
      )}
    </AccountPageShell>
  );
}
