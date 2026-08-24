// Account page — never indexed (private, behind auth)
import UserReviewsClient from './UserReviewsClient';

export const metadata = {
  title: 'My Reviews',
  robots: { index: false, follow: false },
};

export default function UserReviewsPage() {
  return <UserReviewsClient />;
}
