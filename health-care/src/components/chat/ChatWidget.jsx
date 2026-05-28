'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FaTimes, FaCircle } from 'react-icons/fa';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://health-care-e-commerce.onrender.com/api';

export default function ChatWidget({ onClose }) {
  const { user, token } = useAuth();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const pollIntervalRef = useRef(null);
  const lastMessageCountRef = useRef(0);

  // Initialize chat - create conversation via REST API
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const response = await fetch(`${API_URL}/chat/conversations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            customer: {
              userId: user?._id || null,
              name: user?.name || 'Guest',
              email: user?.email || null,
              phone: user?.phone || null
            },
            source: 'website'
          })
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to start chat');
        }

        const data = await response.json();
        const convId = data.data.conversationId;
        setConversationId(convId);
        setIsLoading(false);

        // Start polling for new messages every 3 seconds
        pollIntervalRef.current = setInterval(() => {
          fetchMessages(convId);
        }, 3000);

      } catch (error) {
        console.error('Chat init error:', error);
        setIsLoading(false);
        setMessages([{
          messageId: 'error-1',
          content: 'Unable to connect to chat. Please try again later or contact us at +8801800000000',
          sender: { name: 'System', type: 'agent' },
          messageType: 'text',
          createdAt: new Date(),
          status: 'sent'
        }]);
      }
    };

    initializeChat();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [token, user]);

  // Fetch messages via REST API
  const fetchMessages = useCallback(async (convId) => {
    try {
      const response = await fetch(`${API_URL}/chat/messages/${convId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      const newMessages = data.data || [];

      if (newMessages.length !== lastMessageCountRef.current) {
        lastMessageCountRef.current = newMessages.length;
        setMessages(newMessages);
      }
    } catch (error) {
      // Silent fail for polling
    }
  }, [token]);

  // Send message via REST API
  const handleSendMessage = useCallback(async ({ content, messageType }) => {
    if (!conversationId || !content.trim()) return;

    setIsSending(true);

    // Optimistically add message to UI immediately
    const tempMessage = {
      messageId: `temp-${Date.now()}`,
      content,
      sender: {
        userId: user?._id || null,
        name: user?.name || 'Guest',
        type: 'customer'
      },
      messageType: messageType || 'text',
      createdAt: new Date(),
      status: 'sent'
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await fetch(`${API_URL}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          conversationId,
          content,
          messageType: messageType || 'text',
          sender: {
            userId: user?._id || null,
            name: user?.name || 'Guest',
            type: 'customer'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Refresh messages after sending
      await fetchMessages(conversationId);
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setIsSending(false);
    }
  }, [conversationId, token, user, fetchMessages]);

  return (
    <div
      className="fixed right-6 z-[9999] w-96 bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden"
      style={{
        bottom: '6rem',
        height: 'min(580px, calc(100vh - 140px))'
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
              MC
            </div>
            <FaCircle className="absolute bottom-0 right-0 w-3 h-3 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">MedCore Support</h3>
            <p className="text-xs opacity-90">
              {isLoading ? 'Connecting...' : 'We\'ll reply soon'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          aria-label="Close chat"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-sm text-gray-500">Connecting to support...</p>
          </div>
        </div>
      ) : (
        <>
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            currentUserId={user?._id}
          />
          <ChatInput
            onSendMessage={handleSendMessage}
            onTyping={() => {}}
            disabled={isSending || !conversationId}
          />
        </>
      )}
    </div>
  );
}
