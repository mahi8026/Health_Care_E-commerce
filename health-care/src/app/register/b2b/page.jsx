import { generatePageMetadata } from '@/utils/metadata';
import B2BRegisterPage from '@/views/B2BRegisterPage';

export const metadata = generatePageMetadata({
  title: 'B2B Registration',
  description: 'Register your business for B2B pricing and benefits. Get wholesale discounts, credit terms, and dedicated support.'
});

export default function B2BRegister() {
  return <B2BRegisterPage />;
}
