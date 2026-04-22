import { generatePageMetadata } from '@/utils/metadata';
import { pageMetadata } from '@/config/seo';
import ReagentStorePage from '@/views/ReagentStorePage';

export const metadata = generatePageMetadata(pageMetadata.reagentStore);

export default function ReagentStore() {
  return <ReagentStorePage />;
}
