'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API } from '@/constants/api';
import { getProductImageUrl, IMAGES } from '@/constants/images';

const RETURN_REASONS = [
  { value: 'damaged', label: 'Product arrived damaged' },
  { value: 'wrong_item', label: 'Wrong item received' },
  { value: 'defective', label: 'Product is defective' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'other', label: 'Other reason' },
];

export default function ReturnRequestPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetchOrder();
  }, [params.orderId]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/orders/${params.orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        // Handle both data.order and data.data response structures
        const orderData = data.order || data.data?.order || data.data;
        setOrder(orderData);
      } else {
        alert(data.message || 'Order not found');
        router.push('/orders');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load order');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (images.length + files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    setUploadingImages(true);
    try {
      const token = localStorage.getItem('medcore_token');
      const uploadedImages = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch(`${API}/upload/image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        const data = await res.json();
        if (data.success) {
          uploadedImages.push({
            url: data.url,
            publicId: data.publicId || '',
            alt: file.name
          });
        }
      }

      setImages([...images, ...uploadedImages]);
    } catch (err) {
      console.error(err);
      alert('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      alert('Please select a reason for return');
      return;
    }
    
    if (!description.trim()) {
      alert('Please provide a description');
      return;
    }

    if (description.length < 20) {
      alert('Please provide a more detailed description (minimum 20 characters)');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('medcore_token');
      
      // Prepare products array - handle both populated and non-populated product references
      const products = order.items.map(item => {
        const productId = typeof item.product === 'object' ? item.product._id : item.product;
        return {
          product: productId,
          quantity: item.quantity || item.qty || 1,
          reason: reason
        };
      });

      const res = await fetch(`${API}/returns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: params.orderId,
          products,
          reason,
          description,
          images
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Return request submitted successfully! We will review it within 24-48 hours.');
        router.push('/returns/my-returns');
      } else {
        alert(data.message || 'Failed to submit return request');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting return request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B2545] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Order not found</p>
          <button
            onClick={() => router.push('/orders')}
            className="text-[#0E8A6E] hover:underline"
          >
            View Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        <h1 className="text-3xl font-bold text-[#0B2545] mb-2">Request Return</h1>
        <p className="text-gray-600 mb-8">Please provide details about why you want to return this order</p>
        
        {/* Order Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="font-semibold text-lg text-[#0B2545]">Order #{order.orderNumber}</h2>
              <p className="text-sm text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-lg font-semibold text-[#0B2545]">৳{order.totalAmount?.toLocaleString()}</p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            {order.items?.map((item, idx) => {
              const productData = item.product || {};
              const productImage = getProductImageUrl(productData);
              const productName = productData.name || 'Product';
              const itemPrice = item.price || 0;
              const itemQty = item.quantity || item.qty || 1;
              
              return (
                <div key={idx} className="flex gap-4 items-center">
                  <img 
                    src={productImage} 
                    alt={productName}
                    className="w-20 h-20 object-cover rounded-lg border"
                    onError={(e) => { e.target.src = IMAGES.placeholder; }}
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-[#0B2545]">{productName}</h3>
                    <p className="text-sm text-gray-600">
                      Quantity: {itemQty} × ৳{itemPrice.toLocaleString()}
                    </p>
                    <p className="text-sm font-medium text-[#0E8A6E]">
                      Subtotal: ৳{(itemQty * itemPrice).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Return Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block font-medium text-[#0B2545] mb-2">
              Reason for Return <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0E8A6E] focus:border-transparent"
              required
            >
              <option value="">Select a reason</option>
              {RETURN_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-[#0B2545] mb-2">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 h-32 focus:outline-none focus:ring-2 focus:ring-[#0E8A6E] focus:border-transparent resize-none"
              placeholder="Please provide detailed information about the issue (minimum 20 characters)..."
              maxLength={500}
              required
            />
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Minimum 20 characters</span>
              <span className={`${description.length > 500 ? 'text-red-500' : 'text-gray-500'}`}>
                {description.length}/500
              </span>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#0B2545] mb-2">
              Upload Images (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploadingImages || images.length >= 5}
              />
              <label
                htmlFor="image-upload"
                className={`cursor-pointer ${uploadingImages || images.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm text-gray-600 mb-1">
                  {uploadingImages ? 'Uploading...' : 'Click to upload images'}
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WebP up to 5MB (max 5 images)
                </p>
              </label>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-5 gap-3 mt-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Return Policy */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-[#0B2545] mb-2 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
              Return Policy
            </h3>
            <ul className="text-sm text-gray-700 space-y-1 ml-7">
              <li>• Returns must be requested within 7 days of delivery</li>
              <li>• Products must be unused and in original packaging</li>
              <li>• Refund will be processed within 3-5 business days after approval</li>
              <li>• Shipping costs are non-refundable</li>
              <li>• Medical devices and reagents may have additional restrictions</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImages}
              className="flex-1 px-6 py-3 bg-[#0E8A6E] text-white rounded-lg font-medium hover:bg-[#0c7359] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Return Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
