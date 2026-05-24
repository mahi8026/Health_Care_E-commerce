import { redirect } from 'next/navigation';

// Canonical URL is /dgda-info — redirect /about there
export default function AboutRedirect() {
  redirect('/dgda-info');
}
