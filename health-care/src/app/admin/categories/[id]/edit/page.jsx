'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/utils/api';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showSEO, setShowSEO] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentCategory: '',
    displayOrder: 0,
    isActive: true,
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: ''
    }
  });
  const [currentImages, setCurrentImages] = useState({ image: null, banner: null });
  const [imageFile, setImageFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/categories/by-id/${categoryId}`);
      const cat = response.data.category;
      
      setFormData({
        name: cat.name || '',
        description: cat.description || '',
        parentCategory: cat.parentCategory?._id || '',
        displayOrder: cat.displayOrder || 0,
        isActive: cat.isActive !== false,
        seo: {
          metaTitle: cat.seo?.metaTitle || '',
          metaDescription: cat.seo?.metaDescription || '',
          keywords: cat.seo?.keywords?.join(', ') || ''
        }
      });
      
      setCurrentImages({
        image: cat.image,
        banner: cat.banner
      });
    } catch (err) {
      alert('Failed to load category');
      router.push('/admin/categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories?includeInactive=true');
      // Handle different response structures
      const categoriesData = response.categories || response.data?.categories || response.data || [];
      
      // Exclude current category and its children from parent selection
      setCategories(categoriesData.filter(c => 
        c._id !== categoryId && !c.parentCategory
      ));
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    fetchCategory();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('seo.')) {
      const seoField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          [seoField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'image') {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      } else {
        setBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
      }
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Convert keywords string to array
      const payload = {
        ...formData,
        parentCategory: formData.parentCategory || null,
        seo: {
          ...formData.seo,
          keywords: formData.seo.keywords
            ? formData.seo.keywords.split(',').map(k => k.trim())
            : []
        }
      };

      // Update category
      await api.put(`/categories/${categoryId}`, payload);

      // Upload new images if provided
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('image', imageFile);
        imageFormData.append('type', 'image');
        imageFormData.append('alt', formData.name);
        await api.post(`/categories/${categoryId}/image`, imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (bannerFile) {
        const bannerFormData = new FormData();
        bannerFormData.append('image', bannerFile);
        bannerFormData.append('type', 'banner');
        bannerFormData.append('alt', `${formData.name} banner`);
        await api.post(`/categories/${categoryId}/image`, bannerFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      alert('Category updated successfully!');
      router.push('/admin/categories');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page-muted p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-muted p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Category</h1>
          <p className="text-gray-600 mt-1">Update category details</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {formData.name && (
              <p className="text-xs text-gray-500 mt-1">
                Slug: <code className="bg-gray-100 px-2 py-1 rounded">{generateSlug(formData.name)}</code>
              </p>
            )}
          </div>

          {/* Parent Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent Category (Optional)
            </label>
            <select
              name="parentCategory"
              value={formData.parentCategory}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">None (Root Category)</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Images */}
          <div className="grid grid-cols-2 gap-6">
            {/* Category Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Image
              </label>
              {currentImages.image && !imagePreview && (
                <div className="mb-2">
                  <img src={currentImages.image.url} alt="Current" className="w-32 h-32 object-cover rounded" />
                  <p className="text-xs text-gray-500 mt-1">Current image</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, 'image')}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded" />
              )}
            </div>

            {/* Banner Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Image
              </label>
              {currentImages.banner && !bannerPreview && (
                <div className="mb-2">
                  <img src={currentImages.banner.url} alt="Current" className="w-full h-24 object-cover rounded" />
                  <p className="text-xs text-gray-500 mt-1">Current banner</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, 'banner')}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {bannerPreview && (
                <img src={bannerPreview} alt="Preview" className="mt-2 w-full h-24 object-cover rounded" />
              )}
            </div>
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              name="displayOrder"
              value={formData.displayOrder}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Active Toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>

          {/* SEO Section */}
          <div className="border-t pt-6">
            <button
              type="button"
              onClick={() => setShowSEO(!showSEO)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4"
            >
              <span>{showSEO ? '▼' : '▶'}</span>
              SEO Settings (Optional)
            </button>

            {showSEO && (
              <div className="space-y-4 pl-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    name="seo.metaTitle"
                    value={formData.seo.metaTitle}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    name="seo.metaDescription"
                    value={formData.seo.metaDescription}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="seo.keywords"
                    value={formData.seo.keywords}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
