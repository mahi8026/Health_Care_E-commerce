import { Suspense } from 'react';
import { generatePageMetadata } from '@/utils/metadata';
import { pageMetadata } from '@/config/seo';
import RegisterPage from '@/views/RegisterPage';

export const metadata = generatePageMetadata(pageMetadata.register);

export default function Register() {
  return (
    <Suspense>
      <RegisterPage />
    </Suspense>
  );
}