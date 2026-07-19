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
          <section key={categoryName} className="py-10 bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4">
              {/* Section Header - Matches image design with || bars */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {/* Double vertical bars - key design element from image */}
                  <div className="flex gap-1">
                    <div className="w-1 h-6 bg-teal-600 rounded-full"></div>
                    <div className="w-1 h-6 bg-teal-600 rounded-full"></div>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">{categoryName}</h2>
                </div>
                <Link
                  href={slug ? `/products/category/${slug}` : `/products?category=${encodeURIComponent(categoryName)}`}
                  className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-semibold text-sm transition-colors"
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
                        className="snap-start flex-shrink-0 w-[240px] bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => router.push(`/products/${product._id}`)}
                      >
                        {/* Product Image */}
                        <div className="relative h-56 bg-gray-50 overflow-hidden">
                          {optimizedImg ? (
                            <Image
                              src={optimizedImg}
                              alt={`${product.name}${brandName ? ` — ${brandName}` : ''}`}
                              fill
                              sizes="240px"
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
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                          {/* Brand - matches image style */}
                          {brandName && (
                            <div className="text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-2">
                              {brandName}
                            </div>
                          )}
                          
                          {/* Product Name - 2 lines max */}
                          <h3 className="font-semibold text-gray-900 text-sm mb-3 line-clamp-2 min-h-[40px]">
                            {product.name}
                          </h3>

                          {/* Price - large and bold like in image */}
                          <div className="mb-3">
                            <div className="text-xl font-bold text-gray-900">
                              ৳{price > 0 ? price.toLocaleString() : 'Call'}
                            </div>
                            {hasDiscount && (
                              <div className="text-sm text-gray-400 line-through">
                                ৳{oldPrice.toLocaleString()}
                              </div>
                            )}
                          </div>

                          {/* Add to Cart Button - ALWAYS VISIBLE (not on hover) to match image */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product, 1);
                            }}
                            className="w-full bg-teal-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                          >
                            + Cart
                          </button>
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
