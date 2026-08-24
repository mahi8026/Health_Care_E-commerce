// Development utility page — never indexed by search engines
import TestPushClient from './TestPushClient';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function TestPushPage() {
  return <TestPushClient />;
}
