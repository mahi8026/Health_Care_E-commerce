"use client";

import { useState, useEffect } from 'react';
import { API } from '@/constants/api';

const DEFAULT_SLIDE = { imageUrl: '', altText: '', linkUrl: '/products', order: 0, isActive: true };

export default function BannersManagement() {
  const [slides, setSlides] = useState([]);
  const [promoBanner, setPromoBanner] = useState({ imageUrl: '', altText: '', linkUrl: '/products', isActive: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null); // index or 'promo'
  const [message, setMessage] = useState({ text: '', type: '' });

  const token = () => localStorage.getItem('Mediport_token');

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // Load current settings
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/settings`);
        const data = await res.json();
        const s = data.data || {};
        setSlides(
          s.heroSlides?.length
            ? s.heroSlides.sort((a, b) => a.order - b.order)
            : [{ ...DEFAULT_SLIDE, order: 0 }, { ...DEFAULT_SLIDE, order: 1 },
               { ...DEFAULT_SLIDE, order: 2 }, { ...DEFAULT_SLIDE, order: 3 }]
        );
        setPromoBanner(s.promoBanner || { imageUrl: '', altText: '', linkUrl: '/products', isActive: true });
      } catch {
        showMessage('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Upload image to Cloudinary via backend
  const uploadImage = async (file, index) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API}/upload/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
      body: formData,
    });
    const data = await res.json();
    if (!data.success || !data.url) throw new Error(data.message || 'Upload failed');
    return data.url;
  };

  const handleSlideImageUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIndex(index);
    try {
      const url = await uploadImage(file, index);
      setSlides(prev => prev.map((s, i) => i === index ? { ...s, imageUrl: url } : s));
      showMessage('Image uploaded');
    } catch (err) {
      showMessage(err.message || 'Upload failed', 'error');
    } finally {
      setUploadingIndex(null);
      e.target.value = '';
    }
  };

  const handlePromoImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIndex('promo');
    try {
      const url = await uploadImage(file, 'promo');
      setPromoBanner(prev => ({ ...prev, imageUrl: url }));
      showMessage('Promo image uploaded');
    } catch (err) {
      showMessage(err.message || 'Upload failed', 'error');
    } finally {
      setUploadingIndex(null);
      e.target.value = '';
    }
  };

  const handleSlideChange = (index, field, value) => {
    setSlides(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addSlide = () => {
    if (slides.length >= 6) return showMessage('Maximum 6 slides allowed', 'error');
    setSlides(prev => [...prev, { ...DEFAULT_SLIDE, order: prev.length }]);
  };

  const removeSlide = (index) => {
    setSlides(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          heroSlides: slides.map((s, i) => ({ ...s, order: i })),
          promoBanner,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Save failed');
      showMessage('Banners saved successfully');
    } catch (err) {
      showMessage(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-[var(--color-text-secondary)]">Loading banners...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      {message.text && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-toast text-sm font-medium ${
          message.type === 'success' ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' : 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Hero Slider Banners</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Upload images for the homepage slider. Recommended size: 1280×720px (16:9).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addSlide}
            className="flex-1 sm:flex-none min-h-[44px] px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-xs font-medium hover:bg-[var(--color-background-secondary)] transition-colors"
          >
            + Add Slide
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 bg-brand-navy text-white rounded-lg text-xs font-semibold hover:bg-[var(--color-brand-navy-hover)] transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Slides */}
      <div className="space-y-4">
        {slides.map((slide, index) => (
          <div key={index} className="bg-white border-[0.5px] border-[var(--color-border-tertiary)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-brand-navy text-white rounded-full text-xs font-semibold flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">Slide {index + 1}</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => handleSlideChange(index, 'isActive', !slide.isActive)}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${slide.isActive ? 'bg-brand-teal' : 'border-[var(--color-border-primary)]'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${slide.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-xs text-[var(--color-text-secondary)]">{slide.isActive ? 'Active' : 'Hidden'}</span>
                </label>
                {slides.length > 1 && (
                  <button
                    onClick={() => removeSlide(index)}
                    className="text-danger text-xs hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-2">Banner Image</label>
                {slide.imageUrl ? (
                  <div className="relative group rounded-lg overflow-hidden border-[0.5px] border-[var(--color-border-secondary)]" style={{ height: 140 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slide.imageUrl} alt={slide.altText} className="w-full h-full object-cover" loading="lazy" />
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <span className="text-white text-xs font-medium">Change Image</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={(e) => handleSlideImageUpload(e, index)}
                        disabled={uploadingIndex !== null} />
                    </label>
                    {uploadingIndex === index && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-xs">Uploading...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border-secondary)] rounded-lg cursor-pointer hover:border-brand-teal hover:bg-[var(--color-status-success-tint)] transition-colors ${uploadingIndex === index ? 'opacity-50 pointer-events-none' : ''}`} style={{ height: 140 }}>
                    <svg className="w-8 h-8 text-[var(--color-text-secondary)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {uploadingIndex === index ? 'Uploading...' : 'Click to upload (800×380px)'}
                    </span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={(e) => handleSlideImageUpload(e, index)}
                      disabled={uploadingIndex !== null} />
                  </label>
                )}
              </div>

              {/* Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Alt Text</label>
                  <input
                    type="text"
                    value={slide.altText}
                    onChange={e => handleSlideChange(index, 'altText', e.target.value)}
                    placeholder="e.g. Medical Equipment"
                    className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm focus:outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Link URL (on click)</label>
                  <input
                    type="text"
                    value={slide.linkUrl}
                    onChange={e => handleSlideChange(index, 'linkUrl', e.target.value)}
                    placeholder="/products"
                    className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm focus:outline-none focus:border-brand-teal"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Promo Banner (right side) */}
      <div>
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">Right Promo Banner</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mb-4">
          The image shown on the right side of the hero section. Recommended size: 500×380px.
        </p>

        <div className="bg-white border-[0.5px] border-[var(--color-border-tertiary)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold">Promo Banner</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setPromoBanner(prev => ({ ...prev, isActive: !prev.isActive }))}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${promoBanner.isActive ? 'bg-brand-teal' : 'border-[var(--color-border-primary)]'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${promoBanner.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-[var(--color-text-secondary)]">{promoBanner.isActive ? 'Active' : 'Hidden'}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-2">Promo Image</label>
              {promoBanner.imageUrl ? (
                <div className="relative group rounded-lg overflow-hidden border-[0.5px] border-[var(--color-border-secondary)]" style={{ height: 140 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={promoBanner.imageUrl} alt={promoBanner.altText} className="w-full h-full object-cover" loading="lazy" />
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <span className="text-white text-xs font-medium">Change Image</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={handlePromoImageUpload} disabled={uploadingIndex !== null} />
                  </label>
                  {uploadingIndex === 'promo' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-xs">Uploading...</span>
                    </div>
                  )}
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border-secondary)] rounded-lg cursor-pointer hover:border-brand-teal hover:bg-[var(--color-status-success-tint)] transition-colors ${uploadingIndex === 'promo' ? 'opacity-50 pointer-events-none' : ''}`} style={{ height: 140 }}>
                  <svg className="w-8 h-8 text-[var(--color-text-secondary)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {uploadingIndex === 'promo' ? 'Uploading...' : 'Click to upload (500×380px)'}
                  </span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={handlePromoImageUpload} disabled={uploadingIndex !== null} />
                </label>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Alt Text</label>
                <input
                  type="text"
                  value={promoBanner.altText}
                  onChange={e => setPromoBanner(prev => ({ ...prev, altText: e.target.value }))}
                  placeholder="e.g. Featured Products"
                  className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm focus:outline-none focus:border-brand-teal"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Link URL (on click)</label>
                <input
                  type="text"
                  value={promoBanner.linkUrl}
                  onChange={e => setPromoBanner(prev => ({ ...prev, linkUrl: e.target.value }))}
                  placeholder="/products"
                  className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm focus:outline-none focus:border-brand-teal"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save button bottom */}
      <div className="flex justify-end pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 bg-brand-navy text-white rounded-lg text-sm font-semibold hover:bg-[var(--color-brand-navy-hover)] transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
