'use client';

import { useRouter } from 'next/navigation';
import WhatsAppManager from './WhatsAppManager';

export default function WhatsAppManagerWrapper() {
  const router = useRouter();
  
  return (
    <div className="relative">
      {/* Analytics Button */}
      <div className="absolute top-0 right-4 z-10">
        <button
          onClick={() => router.push('/admin/whatsapp/analytics')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
        >
          📊 Analytics
        </button>
      </div>
      
      <WhatsAppManager />
    </div>
  );
}
