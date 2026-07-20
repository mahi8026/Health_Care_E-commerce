'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

/**
 * Test page to diagnose Cloudinary image loading issues
 * Access at: /test-images
 */
export default function TestImagesPage() {
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    console.log(`[${type.toUpperCase()}]`, message);
    setLogs(prev => [...prev, { message, type, time: new Date().toISOString() }]);
  };

  const testImages = [
    {
      name: 'Direct Cloudinary URL',
      url: 'https://res.cloudinary.com/dm8eqxwlz/image/upload/v1784298845/medcorebd/products/tanita_bf-680w_01_4_lalcrPO.original.jpegquality-60.format-webp_gtgooe.webp',
      method: 'img-tag'
    },
    {
      name: 'Cloudinary without transformations',
      url: 'https://res.cloudinary.com/dm8eqxwlz/image/upload/v1784298845/medcorebd/products/tanita_bf-680w_01_4_lalcrPO.webp',
      method: 'img-tag'
    },
    {
      name: 'Cloudinary original format',
      url: 'https://res.cloudinary.com/dm8eqxwlz/image/upload/v1784298845/medcorebd/products/tanita_bf-680w_01_4_lalcrPO',
      method: 'img-tag'
    },
    {
      name: 'Next.js Image Component',
      url: 'https://res.cloudinary.com/dm8eqxwlz/image/upload/v1784298845/medcorebd/products/tanita_bf-680w_01_4_lalcrPO.original.jpegquality-60.format-webp_gtgooe.webp',
      method: 'next-image'
    },
    {
      name: 'Test with placeholder.com',
      url: 'https://via.placeholder.com/150',
      method: 'img-tag'
    }
  ];

  useEffect(() => {
    // Wrap setState calls in setTimeout to avoid synchronous updates
    setTimeout(() => {
      addLog('Image test page loaded');
    }, 0);

    // Test with JavaScript Image API
    const testImg = new Image();
    testImg.onload = () => addLog('✅ JavaScript Image API test succeeded', 'success');
    testImg.onerror = (e) => addLog(`❌ JavaScript Image API test failed: ${e.type}`, 'error');
    testImg.crossOrigin = 'anonymous';
    testImg.src = 'https://res.cloudinary.com/dm8eqxwlz/image/upload/v1784298845/medcorebd/products/tanita_bf-680w_01_4_lalcrPO.original.jpegquality-60.format-webp_gtgooe.webp';

    // Test with fetch API
    fetch('https://res.cloudinary.com/dm8eqxwlz/image/upload/v1784298845/medcorebd/products/tanita_bf-680w_01_4_lalcrPO.original.jpegquality-60.format-webp_gtgooe.webp', {
      method: 'HEAD',
      mode: 'cors'
    })
      .then(response => {
        addLog(`✅ Fetch API test: ${response.status} ${response.statusText}`, 'success');
        addLog(`Headers: ${Array.from(response.headers.entries()).map(([k,v]) => `${k}:${v}`).join(', ')}`, 'info');
      })
      .catch(error => addLog(`❌ Fetch API test failed: ${error.message}`, 'error'));

  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Cloudinary Image Loading Test</h1>
        <p className="text-gray-600 mb-8">Testing different approaches to load Cloudinary images</p>

        {/* Console Logs */}
        <div className="bg-black text-green-400 p-4 rounded-lg mb-8 font-mono text-sm max-h-64 overflow-y-auto">
          <div className="font-bold mb-2">Console Output:</div>
          {logs.map((log, i) => (
            <div key={i} className={`
              ${log.type === 'success' ? 'text-green-400' : ''}
              ${log.type === 'error' ? 'text-red-400' : ''}
              ${log.type === 'info' ? 'text-blue-400' : ''}
            `}>
              [{log.time.split('T')[1].split('.')[0]}] {log.message}
            </div>
          ))}
        </div>

        {/* Image Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testImages.map((test, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2 text-sm">{test.name}</h3>
              <div className="bg-gray-100 rounded h-48 flex items-center justify-center mb-3 overflow-hidden">
                {test.method === 'next-image' ? (
                  <Image
                    src={test.url}
                    alt={test.name}
                    width={200}
                    height={200}
                    className="object-contain"
                    onLoad={() => addLog(`✅ ${test.name} loaded (Next.js Image)`, 'success')}
                    onError={(e) => addLog(`❌ ${test.name} failed (Next.js Image): ${e.type}`, 'error')}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={test.url}
                    alt={test.name}
                    className="max-w-full max-h-full object-contain"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onLoad={(e) => {
                      addLog(`✅ ${test.name} loaded successfully`, 'success');
                      addLog(`   Size: ${e.target.naturalWidth}x${e.target.naturalHeight}`, 'info');
                    }}
                    onError={(e) => {
                      addLog(`❌ ${test.name} failed to load`, 'error');
                      addLog(`   Error: ${e.type}, Complete: ${e.target.complete}`, 'error');
                    }}
                  />
                )}
              </div>
              <div className="text-xs text-gray-500 break-all">
                {test.url}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Method: {test.method === 'next-image' ? 'Next.js Image' : 'HTML img tag'}
              </div>
            </div>
          ))}
        </div>

        {/* Network Info */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Open browser DevTools (F12)</li>
            <li>Go to Network tab</li>
            <li>Filter by &quot;img&quot; or &quot;media&quot;</li>
            <li>Refresh this page</li>
            <li>Check which images load and which fail</li>
            <li>Click on failed requests to see error details</li>
            <li>Check Console tab for detailed logs</li>
          </ol>
        </div>

        {/* Quick Diagnostics */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold mb-2">Quick Diagnostics:</h3>
          <div className="space-y-2 text-sm">
            <div>Browser: {typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'}</div>
            <div>Protocol: {typeof window !== 'undefined' ? window.location.protocol : 'Unknown'}</div>
            <div>Host: {typeof window !== 'undefined' ? window.location.host : 'Unknown'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
