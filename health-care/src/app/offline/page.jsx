// This PWA fallback page should never be indexed by search engines.
// The interactive content lives in OfflineContent (client component).
import OfflineContent from './OfflineContent';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return <OfflineContent />;
}