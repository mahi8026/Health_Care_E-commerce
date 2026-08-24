import { permanentRedirect } from 'next/navigation';

// /returns permanently redirects to /returns/my-returns (308)
export default function ReturnsIndex() {
  permanentRedirect('/returns/my-returns');
}
