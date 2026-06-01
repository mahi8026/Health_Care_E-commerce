'use client';

import dynamic from 'next/dynamic';

/**
 * Lazy-loaded chat container.
 * The chat widget is non-critical UI — defer it until after the page is interactive
 * to avoid blocking the main thread during initial load.
 *
 * Requirements: 3.7, 3.8
 */
const ChatContainer = dynamic(
  () => import('./ChatContainer'),
  {
    ssr: false,
    loading: () => null, // No placeholder — chat button appears after load
  }
);

export default function LazyChatContainer() {
  return <ChatContainer />;
}
