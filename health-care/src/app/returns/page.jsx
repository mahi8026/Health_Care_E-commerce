import { redirect } from 'next/navigation';

// /returns redirects to /returns/my-returns
export default function ReturnsIndex() {
  redirect('/returns/my-returns');
}
