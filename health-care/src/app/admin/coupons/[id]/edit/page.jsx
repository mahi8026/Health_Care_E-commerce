"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API } from '@/constants/api';

export default function EditCouponPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params.id;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Metadata
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [form, setForm] = useState({
    code: '',
    type: 'percentage',
    value: '',
    buyQuantity: '',
    getQuantity: '',
    minimumOrderAmount: '0',
    maximumDiscount: '',
    applicableProducts: [],
    applicableCategories: [],
    applicableUserRoles: [],
    usageLimit: '0',
    isFirstOrderOnly: false,
    startDate: '',
    endDate: '',
    isActive: true,
    description: ''
  });

  const fetchCoupon = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/coupons/${couponId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        const coupon = data.data;
        setForm({
          code: coupon.code,
          type: coupon.type,
          value: coupon.value.toString(),
          buyQuantity: coupon.buyQuantity?.toString() || '',
          getQuantity: coupon.getQuantity?.toString() || '',
          minimumOrderAmount: coupon.minimumOrderAmount?.toString() || '0',
          maximumDiscount: coupon.maximumDiscount?.toString() || '',
          applicableProducts: coupon.applicableProducts.map(p => p._id),
          applicableCategories: coupon.applicableCategories.map(c => c._id),
          applicableUserRoles: coupon.applicableUserRoles || [],
          usageLimit: coupon.usageLimit?.toString() || '0',
          isFirstOrderOnly: coupon.isFirstOrderOnly || false,
          startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 16) : '',
          endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().slice(0, 16) : '',
          isActive: coupon.isActive !== false,
          description: coupon.description || ''
        });
      } else {
        showMessage('Failed to load coupon', 'error');
      }
    } catch (error) {
      showMessage('Failed to load coupon', 'error');
    } finally {
      setFetching(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const token = localStorage.getItem('medcore_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [categoriesRes, productsRes] = await Promise.all([
        fetch(`${API}/categories`, { headers }),
        fetch(`${API}/products?limit=1000`, { headers })
      ]);
      
      const categoriesData = await categoriesRes.json();
      const productsData = await productsRes.json();
      
      setCategories(categoriesData.success ? (categoriesData.data || categoriesData.categories) : []);
      setProducts(productsData.success ? (productsData.products || productsData.data?.products || []) : []);
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Failed to load metadata:', error);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  useEffect(() => {
    fetchCoupon();
    fetchMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.code.trim()) {
      return showMessage('Coupon code is required', 'error');
    }
    if (!form.value || isNaN(Number(form.value))) {
      return showMessage('Valid value is required', 'error');
    }
    if (form.type === 'percentage' && (Number(form.value) < 0 || Number(form.value) > 100)) {
      return showMessage('Percentage must be between 0 and 100', 'error');
    }
    if (form.type === 'buy_x_get_y') {
      if (!form.buyQuantity || !form.getQuantity) {
        return showMessage('Buy and Get quantities are required for Buy X Get Y coupons', 'error');
      }
    }
    if (!form.startDate || !form.endDate) {
      return showMessage('Start and end dates are required', 'error');
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      return showMessage('End date must be after start date', 'error');
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('medcore_token');
      const payload = {
        ...form,
        code: form.code.toUpperCase(),
        value: Number(form.value),
        minimumOrderAmount: Number(form.minimumOrderAmount) || 0,
        maximumDiscount: form.maximumDiscount ? Number(form.maximumDiscount) : undefined,
        buyQuantity: form.buyQuantity ? Number(form.buyQuantity) : undefined,
        getQuantity: form.getQuantity ? Number(form.getQuantity) : undefined,
        usageLimit: Number(form.usageLimit) || 0
      };

      const res = await fetch(`${API}/coupons/${couponId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (data.success) {
        showMessage('Coupon updated successfully', 'success');
        setTimeout(() => router.push('/admin/coupons'), 1500);
      } else {
        showMessage(data.message || 'Failed to update coupon', 'error');
      }
    } catch (error) {
      showMessage('Failed to update coupon', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (array, item) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  if (fetching) {
    return (
      <div className="p-6">
        <div className="text-center py-20 text-[13px] text-[var(--color-text-secondary)]">
          Loading coupon...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-3"
        >
          ← Back to Coupons
        </button>
        <h1 className="text-[24px] font-bold font-[family-name:var(--font-lora)]">
          Edit Coupon
        </h1>
      </div>

      {/* Message Toast */}
      {message.text && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          message.type === 'success' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Form - Same as create page */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] p-6 space-y-6">
        
        {/* Basic Info */}
        <div>
          <h3 className="text-[15px] font-semibold mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SUMMER2024"
                className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] font-mono uppercase focus:outline-none focus:border-[#0E8A6E]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#0E8A6E]"
              >
                <option value="percentage">Percentage Discount</option>
                <option value="fixed">Fixed Amount</option>
                <option value="buy_x_get_y">Buy X Get Y Free</option>
              </select>
            </div>
          </div>

          {form.type !== 'buy_x_get_y' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
                  {form.type === 'percentage' ? 'Percentage (%)' : 'Amount (৳)'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max={form.type === 'percentage' ? '100' : undefined}
                  step={form.type === 'percentage' ? '1' : '0.01'}
                  value={form.value}
                  onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder={form.type === 'percentage' ? 'e.g. 10' : 'e.g. 500'}
                  className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E]"
                />
              </div>

              {form.type === 'percentage' && (
                <div>
                  <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
                    Maximum Discount (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.maximumDiscount}
                    onChange={(e) => setForm(f => ({ ...f, maximumDiscount: e.target.value }))}
                    placeholder="Optional cap"
                    className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E]"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
                  Buy Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.buyQuantity}
                  onChange={(e) => setForm(f => ({ ...f, buyQuantity: e.target.value }))}
                  placeholder="e.g. 2"
                  className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
                  Get Quantity (Free) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.getQuantity}
                  onChange={(e) => setForm(f => ({ ...f, getQuantity: e.target.value }))}
                  placeholder="e.g. 1"
                  className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Conditions */}
        <div className="border-t-[0.5px] border-[var(--color-border-tertiary)] pt-6">
          <h3 className="text-[15px] font-semibold mb-4">Conditions</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
                Minimum Order Amount (৳)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.minimumOrderAmount}
                onChange={(e) => setForm(f => ({ ...f, minimumOrderAmount: e.target.value }))}
                className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
                Usage Limit (0 = unlimited)
              </label>
              <input
                type="number"
                min="0"
                value={form.usageLimit}
                onChange={(e) => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E]"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFirstOrderOnly}
                onChange={(e) => setForm(f => ({ ...f, isFirstOrderOnly: e.target.checked }))}
                className="accent-[#0E8A6E]"
              />
              <span className="text-[13px]">First order only</span>
            </label>
          </div>
        </div>

        {/* Targeting */}
        <div className="border-t-[0.5px] border-[var(--color-border-tertiary)] pt-6">
          <h3 className="text-[15px] font-semibold mb-4">Targeting (Optional)</h3>
          
          <div className="mb-4">
            <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
              Applicable User Roles
            </label>
            <div className="flex gap-4">
              {['customer', 'b2b_customer', 'admin'].map(role => (
                <label key={role} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.applicableUserRoles.includes(role)}
                    onChange={() => setForm(f => ({
                      ...f,
                      applicableUserRoles: toggleArrayItem(f.applicableUserRoles, role)
                    }))}
                    className="accent-[#0E8A6E]"
                  />
                  <span className="text-[13px] capitalize">{role.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
              Leave empty to apply to all users
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
              Applicable Categories
            </label>
            <select
              multiple
              value={form.applicableCategories}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setForm(f => ({ ...f, applicableCategories: selected }));
              }}
              className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#0E8A6E] min-h-[100px]"
            >
              {categories && categories.length > 0 ? (
                categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))
              ) : (
                <option disabled>Loading categories...</option>
              )}
            </select>
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
              Hold Ctrl/Cmd to select multiple. Leave empty to apply to all categories
            </p>
          </div>
        </div>

        {/* Validity Period */}
        <div className="border-t-[0.5px] border-[var(--color-border-tertiary)] pt-6">
          <h3 className="text-[15px] font-semibold mb-4">Validity Period</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E]"
              />
            </div>
          </div>
        </div>

        {/* Status & Description */}
        <div className="border-t-[0.5px] border-[var(--color-border-tertiary)] pt-6">
          <h3 className="text-[15px] font-semibold mb-4">Status & Description</h3>
          
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="accent-[#0E8A6E]"
              />
              <span className="text-[13px]">Active (visible to users)</span>
            </label>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Internal notes about this coupon..."
              className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E] resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t-[0.5px] border-[var(--color-border-tertiary)]">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#0B2545] text-white rounded-lg text-[13px] font-semibold disabled:opacity-50 hover:bg-[#0d2e56] transition-colors"
          >
            {loading ? 'Updating...' : 'Update Coupon'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] hover:bg-[var(--color-background-tertiary)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
