'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function NewCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
  const [imageFile, setImageFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      // Only show root categories (no parent) for parent selection
      setCategories(response.data.categories.filter(c => !c.parentCategory));
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error('Failed to load categories:', err);
    }
  };

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
    setLoading(true);

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

      // Create category
      const response = await api.post('/categories', payload);
      const categoryId = response.data.category._id;

      // Upload images if provided
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

      alert('Category created successfully!');
      router.push('/admin/categories');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Category</h1>
          <p className="text-gray-600 mt-1">Add a new product category</p>
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
              placeholder="e.g., Diagnostic Equipment"
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
            <p className="text-xs text-gray-500 mt-1">
              Select a parent to create a subcategory (max 2 levels)
            </p>
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
              placeholder="Brief description of this category..."
            />
          </div>

          {/* Images */}
          <div className="grid grid-cols-2 gap-6">
            {/* Category Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Image
              </label>
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
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lower numbers appear first
            </p>
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
                    placeholder="SEO title for search engines"
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
                    placeholder="SEO description for search engines"
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
                    placeholder="keyword1, keyword2, keyword3"
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
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
