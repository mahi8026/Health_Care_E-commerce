import { generatePageMetadata } from '@/utils/metadata';
import { pageMetadata } from '@/config/seo';
import MobileAppPage from '@/views/MobileAppPage';

export const metadata = generatePageMetadata(pageMetadata.mobileApp);

export default function MobileApp() {
  return <MobileAppPage />;
}
