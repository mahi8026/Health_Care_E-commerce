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
    images: [{
      url: `${SITE_CONFIG.url}/og?title=Laboratory+Reagents+Bangladesh&subtitle=HbA1c+%E2%80%A2+CBC+%E2%80%A2+Biochemistry+%E2%80%A2+Immunology+Kits&page=Reagent+Store`,
      width: 1200,
      height: 630,
      alt: 'Laboratory Reagents Bangladesh — MediportBD',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [`${SITE_CONFIG.url}/og?title=Laboratory+Reagents+Bangladesh&subtitle=HbA1c+%E2%80%A2+CBC+%E2%80%A2+Biochemistry+%E2%80%A2+Immunology+Kits&page=Reagent+Store`],
  },
};

export default function ReagentStore() {
  return <ReagentStorePage />;
}
