'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const API = process.env.NEXT_PUBLIC_API_URL;

/**
 * Admin panel for managing featured product display order.
 * Drag rows to reorder; click Save to persist via PUT /api/products/featured/reorder.
 */
export default function FeaturedProductsManager({ authToken }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Drag state
  const dragIndex = useRef(null);

  // ── Fetch on mount and on manual refresh ───────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
     
    setFetchError(null);

    fetch(`${API}/products?isFeatured=true&limit=50`, {
      headers: { Authorization: `Bearer ${authToken}` },
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load featured products');
        return res.json();
      })
      .then(json => {
        const raw = json.data?.products || json.data || json.products || [];
        const sorted = [...raw].sort((a, b) => {
          const ao = a.featuredOrder ?? 999;
          const bo = b.featuredOrder ?? 999;
          if (ao !== bo) return ao - bo;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setProducts(sorted);
        setIsDirty(false);
        setLoading(false);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        setFetchError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [authToken, refreshKey]);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = (e, index) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    document.querySelectorAll('.featured-drag-row').forEach(el => {
      el.style.borderTop = '';
    });
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.featured-drag-row').forEach((el, i) => {
      el.style.borderTop = i === index ? '2px solid #0D9488' : '';
    });
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const fromIndex = dragIndex.current;
    if (fromIndex === null || fromIndex === dropIndex) return;
    const updated = [...products];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(dropIndex, 0, moved);
    setProducts(updated);
    setIsDirty(true);
    dragIndex.current = null;
    document.querySelectorAll('.featured-drag-row').forEach(el => {
      el.style.borderTop = '';
    });
  };

  // ── Move up / down buttons ────────────────────────────────────────────────
  const moveItem = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= products.length) return;
    const updated = [...products];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setProducts(updated);
    setIsDirty(true);
  };

  // ── Save order ────────────────────────────────────────────────────────────
  const saveOrder = () => {
    setSaving(true);
    setSaveError(null);
    setSuccessMsg(null);

    const orderedIds = products.map(p => p._id);

    fetch(`${API}/products/featured/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ orderedIds }),
    })
      .then(res => res.json().then(json => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (!ok) throw new Error(json.message || 'Failed to save order');
        setSuccessMsg(`Order saved — ${json.data?.modifiedCount ?? products.length} products updated.`);
        setIsDirty(false);
        setSaving(false);
        setTimeout(() => setSuccessMsg(null), 4000);
      })
      .catch(err => {
        setSaveError(err.message);
        setSaving(false);
      });
  };

  const getImage = (product) => {
    const img = product.images?.[0];
    return typeof img === 'string' ? img : img?.url || null;
  };

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <p>Loading featured products...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>
            Featured Products — Display Order
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280' }}>
            Drag rows or use ↑↓ buttons to reorder. Lower position = appears first on homepage.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isDirty && (
            <span style={{ fontSize: 11, color: '#D97706', fontWeight: 600 }}>● Unsaved changes</span>
          )}
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={saving}
            style={{ padding: '7px 14px', borderRadius: 7, border: '1.5px solid #D1D5DB', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
            ↺ Refresh
          </button>
          <button
            onClick={saveOrder}
            disabled={saving || !isDirty}
            style={{
              padding: '7px 16px', borderRadius: 7, border: 'none',
              background: isDirty ? '#0D9488' : '#9CA3AF',
              color: '#fff', fontSize: 12, fontWeight: 700,
              cursor: isDirty ? 'pointer' : 'not-allowed', transition: 'background 0.2s',
            }}>
            {saving ? 'Saving…' : '💾 Save Order'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {fetchError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 12, color: '#B91C1C', fontSize: 13 }}>
          ⚠️ {fetchError}
        </div>
      )}
      {saveError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 12, color: '#B91C1C', fontSize: 13 }}>
          ⚠️ {saveError}
        </div>
      )}
      {successMsg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '10px 14px', marginBottom: 12, color: '#065F46', fontSize: 13 }}>
          ✅ {successMsg}
        </div>
      )}

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9CA3AF', border: '2px dashed #E5E7EB', borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>No featured products yet</p>
          <p style={{ fontSize: 13 }}>Mark products as &quot;Featured&quot; in the product list to manage them here.</p>
        </div>
      ) : (
        <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '40px 48px 1fr 120px 80px 80px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', padding: '8px 12px', gap: 8, alignItems: 'center' }}>
            {['Rank', '', 'Product', 'Category', 'Price', 'Move'].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {/* Product rows */}
          {products.map((product, index) => {
            const img = getImage(product);
            const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;
            const price = product.price || 0;

            return (
              <div
                key={product._id}
                className="featured-drag-row"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                style={{
                  display: 'grid', gridTemplateColumns: '40px 48px 1fr 120px 80px 80px',
                  padding: '8px 12px', gap: 8, alignItems: 'center',
                  borderBottom: index < products.length - 1 ? '1px solid #F3F4F6' : 'none',
                  background: '#fff', cursor: 'grab', transition: 'background 0.15s', userSelect: 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: index === 0 ? '#0D9488' : index < 3 ? '#0EA5E9' : '#E5E7EB', color: index < 3 ? '#fff' : '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                  {index + 1}
                </div>

                <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: '#F3F4F6', flexShrink: 0 }}>
                  {img ? (
                    <Image src={img} alt={product.name} width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} unoptimized />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#9CA3AF' }}>🏥</div>
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{product.sku}</div>
                </div>

                <div style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {categoryName || '—'}
                </div>

                <div style={{ fontSize: 13, fontWeight: 600, color: '#001D5D' }}>
                  {price > 0 ? `৳${price.toLocaleString()}` : 'On request'}
                </div>

                <div style={{ display: 'flex', gap: 3 }}>
                  <button onClick={() => moveItem(index, -1)} disabled={index === 0} title="Move up"
                    style={{ width: 28, height: 28, borderRadius: 5, border: '1px solid #D1D5DB', background: '#fff', cursor: index === 0 ? 'not-allowed' : 'pointer', color: index === 0 ? '#D1D5DB' : '#374151', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                    ↑
                  </button>
                  <button onClick={() => moveItem(index, 1)} disabled={index === products.length - 1} title="Move down"
                    style={{ width: 28, height: 28, borderRadius: 5, border: '1px solid #D1D5DB', background: '#fff', cursor: index === products.length - 1 ? 'not-allowed' : 'pointer', color: index === products.length - 1 ? '#D1D5DB' : '#374151', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                    ↓
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ marginTop: 10, fontSize: 11, color: '#9CA3AF' }}>
        💡 Tip: Drag any row to reorder. Changes only apply after clicking &quot;Save Order&quot;.
      </p>
    </div>
  );
}
