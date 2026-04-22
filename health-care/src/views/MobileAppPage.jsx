"use client";

import MobileFrame from '@/components/mobile/MobileFrame';
import MobileStatusBar from '@/components/mobile/MobileStatusBar';
import MobileNav from '@/components/mobile/MobileNav';
import MobileHero from '@/components/mobile/MobileHero';
import MobileCategories from '@/components/mobile/MobileCategories';
import MobileFeaturedProducts from '@/components/mobile/MobileFeaturedProducts';
import MobileB2BBanner from '@/components/mobile/MobileB2BBanner';
import MobileWhatsApp from '@/components/mobile/MobileWhatsApp';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';

export default function MobileAppPage() {
  return (
    <div className="p-6 bg-[var(--color-background-secondary)]">
      <div className="text-center mb-5">
        <div className="font-[family-name:var(--font-lora)] text-base font-semibold mb-1">
          Mobile app — iPhone view
        </div>
        <div className="text-[11px] text-[var(--color-text-secondary)]">
          Fully responsive · Bottom navigation · WhatsApp integration
        </div>
      </div>

      <MobileFrame>
        <MobileStatusBar />
        <MobileNav />
        <MobileHero />
        <MobileCategories />
        <MobileFeaturedProducts />
        <MobileB2BBanner />
        <MobileWhatsApp />
        <MobileBottomNav activeTab="home" />
      </MobileFrame>
    </div>
  );
}
