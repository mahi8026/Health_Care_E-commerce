import ReagentStorePage from '@/views/ReagentStorePage';
import { PAGE_SEO, SITE_CONFIG } from '@/config/seo';

export const metadata = {
  title:       PAGE_SEO.reagentStore.title,
  description: PAGE_SEO.reagentStore.description,
  keywords:    PAGE_SEO.reagentStore.keywords,
  alternates:  { canonical: `${SITE_CONFIG.url}/reagent-store` },
  openGraph: {
    title:       PAGE_SEO.reagentStore.title,
    description: PAGE_SEO.reagentStore.description,
    url:         `${SITE_CONFIG.url}/reagent-store`,
    images: [{ url: '/images/og-reagents.jpg', width: 1200, height: 630 }],
  },
};

export default function ReagentStore() {
  return <ReagentStorePage />;
}
