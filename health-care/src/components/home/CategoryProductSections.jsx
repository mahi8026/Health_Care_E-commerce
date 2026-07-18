'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  FaStethoscope, 
  FaSyringe, 
  FaFlask, 
  FaHospital, 
  FaMicroscope, 
  FaShieldAlt, 
  FaTooth, 
  FaBone,
} from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { API } from '@/constants/api';
import { CATEGORY_NAME_TO_SLUG } from '@/constants/categories';
import { getProductCardImage } from '@/utils/cloudinary';

/**
 * Get icon component for category
 */
function getCategoryIcon(categoryName) {
  const iconMap = {
    'Diagnostic Equipment': <FaStethoscope />,
    'Surgical Instruments': <FaSyringe />,
    'Laboratory Reagents': <FaFlask />,
    'Hospital Machines': <FaHospital />,
    'Lab Equipment': <FaMicroscope />,
    'Laboratory Equipment': <FaMicroscope />,
    'PPE & Safety': <FaShieldAlt />,
    'Dental Equipment': <FaTooth />,
    'Implants & Ortho': <FaBone />,
    'Orthopedic Supports': <FaBone />,
    'Consumables': <FaSyringe />,
    'Diabetes Care': <FaStethoscope />,
    'Diagnostic Devices': <FaStethoscope />,
    'IV & Infusion Therapy': <FaSyringe />,
    'Medical Devices': <FaStethoscope />,
    'Medical Supplies': <FaSyringe />,
    'Ophthalmology & ENT Equipment': <FaStethoscope />,
    'Physiotherapy & Rehabilitation': <FaBone />,
    'Respiratory Equipment': <FaStethoscope />,
    'Surgical & Wound Care': <FaSyringe />,
    'Surgical Instruments': <FaSyringe />,
    'Blood Bank Supplies': <FaFlask />,
    'Compression Garments': <FaBone />,
  };
  return iconMap[categoryName] || <FaStethoscope />;
}

/**
 * CategoryProductSections Component
 * 
 * Displays horizontal scrollable product sections for each category
 * Similar to the image provided by the user
 */
export default function CategoryProductSections({ categories = [] }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      
      // Fetch products for each category (limit to first 8 categories)
      const categoriesToFetch = categories.slice(0, 8);
      
      const productsPromises = categoriesToFetch.map(async (cat) => {
        const categoryName = typeof cat === 'string' ? cat : cat.name;
        try {
          const response = await fetch(
            `${API}/products?category=${encodeURIComponent(categoryName)}&limit=10&sortBy=popular`
          );
          const data = await response.json();
          const products = Array.isArray(data.data) ? data.data : (data.data?.products || data.products || []);
          return { categoryName, products };
        } catch (error) {
          console.error(`Error fetching products for ${categoryName}:`, error);
          return { categoryName, products: [] };
        }
      });

      const results = await Promise.all(productsPromises);
      
      // Convert array to object keyed by category name
      const productsObj = {};
      results.forEach(({ categoryName, products }) => {
        productsObj[categoryName] = products;
      });
      
      setCategoryProducts(productsObj);
      setLoading(false);
    };

    if (categories.length > 0) {
      fetchCategoryProducts();
    }
  }, [categories]);

  if (loading) {
    return (
      <div className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="flex gap-4 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-[280px] h-[320px] bg-gray-200 rounded-xl animate-pulse flex-shrink-0"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {categories.slice(0, 8).map((cat) => {
        const categoryName = typeof cat === 'string' ? cat : cat.name;
        const categoryData = typeof cat === 'object' ? cat : { name: categoryName };
        const slug = CATEGORY_NAME_TO_SLUG[categoryName];
        const catProducts = categoryProducts[categoryName] || [];
        
        // Skip if no products for this category
        if (catProducts.length === 0) return null;

        return (
          <section key={categoryName} className="py-8 bg-gray-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl text-teal-600"
                    style={{ backgroundColor: categoryData.color || '#F0FDFA' }}
                  >
                    {getCategoryIcon(categoryName)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{categoryName}</h2>
                    <p className="text-sm text-gray-500">
                      {categoryData.description || categoryData.desc || 'Quality medical products'}
                    </p>
                  </div>
                </div>
                <Link
                  href={slug ? `/products/category/${slug}` : `/products?category=${encodeURIComponent(categoryName)}`}
                  className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm transition-colors"
                >
                  View All Items →
                </Link>
              </div>

              {/* Products Horizontal Scroll */}
              <div className="relative">
                <div 
                  className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#0E8A6E #f3f4f6',
                  }}
                >
                  {catProducts.map((product) => {
                    const imgRaw = product.images?.[0];
                    const img = typeof imgRaw === 'string' ? imgRaw : imgRaw?.url;
                    const optimizedImg = img ? getProductCardImage(img) : null;
                    const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
                    const price = product.price || 0;
                    const oldPrice = product.oldPrice || 0;
                    const hasDiscount = oldPrice > 0 && oldPrice > price;
                    const discount = hasDiscount ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

                    return (
                      <div
                        key={product._id}
                        className="snap-start flex-shrink-0 w-[280px] bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                        onClick={() => router.push(`/products/${product._id}`)}
                      >
                        {/* Product Image */}
                        <div className="relative h-48 bg-gray-50 overflow-hidden">
                          {optimizedImg ? (
                            <Image
                              src={optimizedImg}
                              alt={`${product.name}${brandName ? ` — ${brandName}` : ''} — Price ৳${price > 0 ? price.toLocaleString() : 'on request'} Bangladesh`}
                              fill
                              sizes="280px"
                              style={{ objectFit: 'cover' }}
                              className="group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">
                              🏥
                            </div>
                          )}
                          
                          {/* Discount Badge */}
                          {hasDiscount && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                              -{discount}%
                            </div>
                          )}

                          {/* Add to Cart Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product, 1);
                            }}
                            className="absolute bottom-3 right-3 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all hover:bg-teal-700 flex items-center gap-2"
                          >
                            + Cart
                          </button>
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                          {/* Brand */}
                          {brandName && (
                            <div className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-1">
                              {brandName}
                            </div>
                          )}
                          
                          {/* Product Name */}
                          <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 h-10">
                            {product.name}
                          </h3>

                          {/* Price */}
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-gray-900">
                              ৳{price > 0 ? price.toLocaleString() : 'Call'}
                            </span>
                            {hasDiscount && (
                              <span className="text-sm text-gray-400 line-through">
                                ৳{oldPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
