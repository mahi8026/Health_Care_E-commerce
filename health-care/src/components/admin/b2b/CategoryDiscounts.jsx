'use client';
import { confirmAction } from '@/components/ui/ConfirmDialog';

import { useState, useEffect } from 'react';
import { FaSave, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { API } from '@/constants/api';
import { showToast } from '@/components/ui/Toast';

export default function CategoryDiscounts() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState({});

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/admin/b2b/categories/discounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        setCategories(data.data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, []);

  const handleDiscountChange = (categoryId, value) => {
    const numValue = parseInt(value) || 0;
    setChanges(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        b2bDiscountPct: Math.min(100, Math.max(0, numValue))
      }
    }));
  };

  const handleToggleEnabled = (categoryId, currentValue) => {
    setChanges(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        b2bDiscountEnabled: !currentValue
      }
    }));
  };

  const hasChanges = Object.keys(changes).length > 0;

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('Mediport_token');

      const updates = Object.entries(changes).map(([categoryId, change]) => ({
        categoryId,
        ...change
      }));

      const res = await fetch(`${API}/admin/b2b/categories/discounts/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ updates })
      });

      const data = await res.json();
      if (data.success) {
        showToast.success('Category discounts updated successfully');
        setChanges({});
        fetchCategories();
      } else {
        showToast.error(data.message || 'Failed to update discounts');
      }
    } catch (error) {
      showToast.error('Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (await confirmAction('Discard all changes?')) {
      setChanges({});
    }
  };

  const getDisplayValue = (category, field) => {
    if (changes[category._id]?.[field] !== undefined) {
      return changes[category._id][field];
    }
    return category[field];
  };

  if (loading) {
    return <div className="text-center py-12">Loading categories...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with save button */}
      {hasChanges && (
        <div className="bg-[var(--color-status-warning-tint)] border border-[var(--color-status-warning-tint)] rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-[var(--color-status-warning)] font-medium">You have unsaved changes</p>
            <p className="text-[var(--color-status-warning)] text-sm">Click save to apply changes to {Object.keys(changes).length} categories</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-[var(--color-border-primary)] rounded-lg hover:bg-[var(--color-background-secondary)]"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-[var(--color-brand-teal-hover)] disabled:opacity-50 flex items-center gap-2"
            >
              <FaSave />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-border-primary)]">
            <thead className="bg-[var(--color-background-secondary)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">Category</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase">Products</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase">B2B Enabled</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase">Discount %</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase">Discount Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[var(--color-border-primary)]">
              {categories.map((category) => {
                const enabled = getDisplayValue(category, 'b2bDiscountEnabled');
                const discount = getDisplayValue(category, 'b2bDiscountPct');
                const hasChange = changes[category._id];

                return (
                  <tr key={category._id} className={`${hasChange ? 'bg-[var(--color-status-warning-tint)]' : 'hover:bg-[var(--color-background-secondary)]'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium text-[var(--color-text-primary)]">{category.name}</div>
                          <div className="text-sm text-[var(--color-text-secondary)]">{category.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[var(--color-text-secondary)]">{category.productCount || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleEnabled(category._id, enabled)}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                          enabled
                            ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]'
                            : 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {enabled ? <FaToggleOn className="w-4 h-4" /> : <FaToggleOff className="w-4 h-4" />}
                        {enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discount}
                          onChange={(e) => handleDiscountChange(category._id, e.target.value)}
                          disabled={!enabled}
                          className={`w-20 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-brand-teal focus:border-transparent ${
                            !enabled ? 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]' : ''
                          }`}
                        />
                        <span className="ml-2 text-[var(--color-text-secondary)]">%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {enabled && discount > 0 && (
                        <div className="text-sm">
                          <div className="text-[var(--color-text-secondary)]">৳100 product</div>
                          <div className="text-[var(--color-status-success)] font-medium">
                            → ৳{(100 - (100 * discount / 100)).toFixed(2)} <span className="text-xs">({discount}% off)</span>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Discount Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-blue-600">Total Categories</div>
            <div className="text-2xl font-semibold text-blue-900">{categories.length}</div>
          </div>
          <div>
            <div className="text-blue-600">B2B Enabled</div>
            <div className="text-2xl font-semibold text-[var(--color-status-success)]">
              {categories.filter(c => getDisplayValue(c, 'b2bDiscountEnabled')).length}
            </div>
          </div>
          <div>
            <div className="text-blue-600">Avg Discount</div>
            <div className="text-2xl font-semibold text-blue-900">
              {(categories.reduce((sum, c) => sum + (getDisplayValue(c, 'b2bDiscountEnabled') ? getDisplayValue(c, 'b2bDiscountPct') : 0), 0) / 
                categories.filter(c => getDisplayValue(c, 'b2bDiscountEnabled')).length || 0).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-blue-600">Highest Discount</div>
            <div className="text-2xl font-semibold text-blue-900">
              {Math.max(...categories.map(c => getDisplayValue(c, 'b2bDiscountEnabled') ? getDisplayValue(c, 'b2bDiscountPct') : 0))}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
