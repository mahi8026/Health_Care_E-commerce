"use client";

import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const CATEGORIES = ['', 'Diagnostic Equipment', 'Surgical Instruments', 'Laboratory Reagents', 'Hospital Machines', 'Lab Equipment', 'Dental Equipment', 'PPE', 'Implants'];

export default function ProductsManagement() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editProduct, setEditProduct] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('medcore_token');
      const params = new URLSearchParams({ page, limit: 20 });
      if (categoryFilter) params.set('category', categoryFilter);
      const res = await fetch(`${API}/api/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProducts(data.products || data.data?.products || []);
      setTotal(data.total || data.data?.total || 0);
    } catch {
      showMessage('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (productId) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      showMessage('Product deleted', 'success');
      fetchProducts();
    } catch {
      showMessage('Failed to delete product', 'error');
    }
  };

  const handleEditOpen = (product) => {
    setEditProduct(product);
    setEditForm({
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
      brand: product.brand,
    });
  };

  const handleEditSave = async () => {
    if (!editProduct) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/api/products/${editProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Update failed');
      showMessage('Product updated', 'success');
      setEditProduct(null);
      fetchProducts();
    } catch {
      showMessage('Failed to update product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const getStockStatus = (product) => {
    if (product.stock === 0) return { color: 'bg-[#FEE2E2] text-[#991B1B]', label: 'Out of stock' };
    if (product.stock <= (product.lowStockThreshold || 10)) return { color: 'bg-[#FEF3C7] text-[#92400E]', label: 'Low stock' };
    return { color: 'bg-[#D1FAE5] text-[#065F46]', label: 'In stock' };
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)]">
      {/* Message Toast */}
      {message.text && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          message.type === 'success' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Edit Modal */}
      {editProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-[14px] font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
              Edit Product
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Name', key: 'name', type: 'text' },
                { label: 'Brand', key: 'brand', type: 'text' },
                { label: 'Price (৳)', key: 'price', type: 'number' },
                { label: 'Stock', key: 'stock', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">{label}</label>
                  <input
                    type={type}
                    value={editForm[key] ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E]"
                  />
                </div>
              ))}
              <div>
                <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Category</label>
                <select
                  value={editForm.category || ''}
                  onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#0E8A6E]"
                >
                  {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleEditSave}
                disabled={saving}
                className="flex-1 py-2 bg-[#0B2545] text-white rounded-lg text-[13px] font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                onClick={() => setEditProduct(null)}
                className="flex-1 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 border-b-[0.5px] border-[var(--color-border-tertiary)] flex gap-3">
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-[8px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] bg-white"
        >
          <option value="">All categories</option>
          {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="ml-auto text-[12px] text-[var(--color-text-secondary)] self-center">
          {total} products total
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-secondary)]">Loading products…</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-secondary)]">No products found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b-[0.5px] border-[var(--color-border-tertiary)]">
                {['SKU', 'Product Name', 'Category', 'Stock', 'Price', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const stockStatus = getStockStatus(product);
                return (
                  <tr key={product._id} className="border-b-[0.5px] border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-tertiary)]">
                    <td className="px-4 py-3 text-[11px] font-mono text-[var(--color-text-secondary)]">{product.sku}</td>
                    <td className="px-4 py-3 text-[12px] font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-[12px]">{product.category}</td>
                    <td className="px-4 py-3 text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">{product.stock}</td>
                    <td className="px-4 py-3 text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                      ৳{(product.price || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-[3px] rounded font-medium ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleEditOpen(product)}
                        className="text-[11px] text-[#0E8A6E] font-medium hover:underline mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="text-[11px] text-[#E24B4A] font-medium hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 flex items-center justify-between border-t-[0.5px] border-[var(--color-border-tertiary)]">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-[12px] px-3 py-1 border-[0.5px] border-[var(--color-border-secondary)] rounded disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-[12px] text-[var(--color-text-secondary)]">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-[12px] px-3 py-1 border-[0.5px] border-[var(--color-border-secondary)] rounded disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
