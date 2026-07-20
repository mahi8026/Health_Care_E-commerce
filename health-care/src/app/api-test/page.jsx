'use client';

import { useEffect, useState } from 'react';

/**
 * API Test Page - Verify products API returns images correctly
 * Access at: /api-test
 */
export default function ApiTestPage() {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        console.log('[API TEST] Fetching products...');
        
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://healthcaree-commerce-production.up.railway.app/api';
        const url = `${API_URL}/products?limit=5`;
        
        console.log('[API TEST] URL:', url);
        
        const response = await fetch(url, {
          headers: {
            'Cache-Control': 'no-cache',
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[API TEST] Full Response:', data);
        
        setApiData(data);

        // Detailed logging of first product
        if (data.data && data.data.length > 0) {
          const firstProduct = data.data[0];
          console.log('[API TEST] First Product Analysis:', {
            name: firstProduct.name,
            _id: firstProduct._id,
            sku: firstProduct.sku,
            hasImages: !!firstProduct.images,
            imagesType: typeof firstProduct.images,
            imagesIsArray: Array.isArray(firstProduct.images),
            imagesLength: firstProduct.images?.length,
            imagesContent: firstProduct.images,
            firstImage: firstProduct.images?.[0],
            firstImageType: firstProduct.images?.[0] ? typeof firstProduct.images[0] : 'N/A',
            allKeys: Object.keys(firstProduct)
          });
        }

      } catch (err) {
        console.error('[API TEST] Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    testApi();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Products API Test</h1>
        <p className="text-gray-600 mb-8">Testing if images are returned correctly from the API</p>

        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            Loading...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <strong>Error:</strong> {error}
          </div>
        )}

        {apiData && (
          <>
            {/* Summary */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">API Response Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Success</div>
                  <div className="text-lg font-semibold">{apiData.success ? '✅ Yes' : '❌ No'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Products Count</div>
                  <div className="text-lg font-semibold">{apiData.data?.length || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total in DB</div>
                  <div className="text-lg font-semibold">{apiData.pagination?.total || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Products with Images</div>
                  <div className="text-lg font-semibold">
                    {apiData.data?.filter(p => p.images?.length > 0).length || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Products Detail */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Products Detail</h2>
              {apiData.data?.map((product, idx) => (
                <div key={product._id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex gap-4">
                    {/* Product Image Test */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 bg-gray-100 rounded border flex items-center justify-center overflow-hidden">
                        {product.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onLoad={() => console.log(`✅ Image ${idx + 1} loaded:`, product.name)}
                            onError={() => console.error(`❌ Image ${idx + 1} failed:`, product.name)}
                          />
                        ) : (
                          <span className="text-4xl">📦</span>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">{idx + 1}. {product.name}</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><strong>SKU:</strong> {product.sku}</div>
                        <div><strong>Price:</strong> ৳{product.price?.toLocaleString()}</div>
                        <div><strong>Stock:</strong> {product.stock}</div>
                        <div><strong>Category:</strong> {product.category?.name || 'N/A'}</div>
                      </div>

                      {/* Image Analysis */}
                      <div className="mt-4 p-3 bg-gray-50 rounded text-xs font-mono">
                        <div className="font-bold mb-2">Images Field Analysis:</div>
                        <div>Has images: {product.images ? '✅ Yes' : '❌ No'}</div>
                        <div>Is Array: {Array.isArray(product.images) ? '✅ Yes' : '❌ No'}</div>
                        <div>Length: {product.images?.length || 0}</div>
                        {product.images?.[0] && (
                          <>
                            <div className="mt-2 font-bold">First Image:</div>
                            <div>Type: {typeof product.images[0]}</div>
                            {typeof product.images[0] === 'object' ? (
                              <>
                                <div>URL: {product.images[0].url}</div>
                                <div>PublicId: {product.images[0].publicId || 'N/A'}</div>
                                <div>IsPrimary: {product.images[0].isPrimary ? 'Yes' : 'No'}</div>
                              </>
                            ) : (
                              <div>Value: {product.images[0]}</div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Raw JSON */}
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Raw API Response (JSON)</h2>
              <pre className="bg-black text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(apiData, null, 2)}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
