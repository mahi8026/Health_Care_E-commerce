'use client';

import { useState } from 'react';
import ChatButton from './ChatButton';
import ChatWidget from './ChatWidget';

export default function ChatContainer() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0); // Reset unread count when opening
    }
  };

  return (
    <>
      {!isOpen && <ChatButton onClick={handleToggle} unreadCount={unreadCount} />}
      {isOpen && <ChatWidget onClose={handleToggle} />}
    </>
  );
}
