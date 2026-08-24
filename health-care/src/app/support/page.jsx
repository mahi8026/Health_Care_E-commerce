import { permanentRedirect } from 'next/navigation';

// /support permanently redirects to /help (308)
export default function SupportPage() {
  permanentRedirect('/help');
}
