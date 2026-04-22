import { generatePageMetadata } from '@/utils/metadata';
import { pageMetadata } from '@/config/seo';
import SearchPage from '@/views/SearchPage';

export const metadata = generatePageMetadata(pageMetadata.search);

export default function Search() {
  return <SearchPage />;
}
