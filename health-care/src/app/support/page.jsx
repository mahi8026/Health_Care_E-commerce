import { redirect } from 'next/navigation';

// /support redirects to /help
export default function SupportPage() {
  redirect('/help');
}
