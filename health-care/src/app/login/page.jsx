import { generatePageMetadata } from '@/utils/metadata';
import { pageMetadata } from '@/config/seo';
import LoginPage from '@/views/LoginPage';

export const dynamic = 'force-dynamic';

export const metadata = generatePageMetadata(pageMetadata.login);

export default function Login() {
  return <LoginPage />;
}
