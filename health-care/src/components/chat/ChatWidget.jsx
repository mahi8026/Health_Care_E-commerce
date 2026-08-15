'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FaTimes, FaCircle } from 'react-icons/fa';
import Spinner from '@/components/ui/Spinner';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://health-care-e-commerce.onrender.com/api';
const STORAGE_KEY = 'Mediport_chat_conv_id';

// Get or clear stored conversation ID
function getStoredConvId() {
  if (typeof window !== 'undefined') return localStorage.getItem(STORAGE_KEY);
  return null;
}
function storeConvId(id) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, id);
}
function clearConvId() {
  if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
}

export default function ChatWidget({ onClose }) {
  const { user, token } = useAuth();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages]             = useState([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [isSending, setIsSending]           = useState(false);
  const pollRef          = useRef(null);
  const lastCountRef     = useRef(0);

  // ── Fetch messages ──────────────────────────────────────────────────────
  const fetchMessages = useCallback((convId) => {
    if (!convId) return;
    fetch(`${API_URL}/chat/messages/${convId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const msgs = data.data || [];
        if (msgs.length !== lastCountRef.current) {
          lastCountRef.current = msgs.length;
          setMessages(msgs);
        }
      })
      .catch(() => { if (process.env.NODE_ENV !== 'production') console.warn('Failed to fetch chat messages'); });
  }, [token]);

  // ── On mount: restore existing conversation or show empty state ─────────
  useEffect(() => {
    const storedId = getStoredConvId();

    if (storedId) {
      // Verify the conversation still exists
      fetch(`${API_URL}/chat/messages/${storedId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setConversationId(storedId);
            const msgs = data.data || [];
            lastCountRef.current = msgs.length;
            setMessages(msgs);
          } else {
            // Conversation gone — clear storage
            clearConvId();
          }
          setIsLoading(false);
        })
        .catch(() => {
          if (process.env.NODE_ENV !== 'production') console.warn('Failed to verify existing conversation');
          clearConvId();
          setIsLoading(false);
        });
    } else {
      // No existing conversation — show empty state, wait for first message
      void Promise.resolve().then(() => setIsLoading(false));
    }

    return () => clearInterval(pollRef.current);
  }, [token]);

  // ── Start polling once we have a conversationId ─────────────────────────
  // Polling is visibility-aware: the timer only runs while the tab is
  // visible, so background tabs don't burn network/CPU every 3s.
  useEffect(() => {
    clearInterval(pollRef.current);
    if (!conversationId) return;

    let isActive = true;
    const startPolling = () => {
      if (!isActive || document.hidden) return;
      fetchMessages(conversationId);
    };

    pollRef.current = setInterval(startPolling, 3000);
    document.addEventListener('visibilitychange', startPolling);

    return () => {
      clearInterval(pollRef.current);
      document.removeEventListener('visibilitychange', startPolling);
      isActive = false;
    };
  }, [conversationId, fetchMessages]);

  // ── Create conversation (lazy — only on first message) ──────────────────
  const getOrCreateConversation = useCallback(async () => {
    if (conversationId) return conversationId;

    const response = await fetch(`${API_URL}/chat/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({
        customer: {
          userId: user?._id || null,
          name:   user?.name  || 'Guest',
          email:  user?.email || null,
          phone:  user?.phone || null
        },
        source: 'website'
      })
    });

    if (!response.ok) throw new Error('Failed to create conversation');

    const data  = await response.json();
    const convId = data.data.conversationId;
    storeConvId(convId);
    setConversationId(convId);
    return convId;
  }, [conversationId, token, user]);

  // ── Send message ────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async ({ content, messageType }) => {
    if (!content.trim()) return;
    setIsSending(true);

    // Optimistic bubble
    const temp = {
      messageId: `temp-${Date.now()}`,
      content: { text: content.trim() },
      sender: { userId: user?._id || null, name: user?.name || 'Guest', type: 'customer' },
      messageType: messageType || 'text',
      createdAt: new Date(),
      status: 'sent'
    };
    setMessages(prev => [...prev, temp]);

    try {
      const convId = await getOrCreateConversation();

      await fetch(`${API_URL}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          conversationId: convId,
          content:        content.trim(),
          messageType:    messageType || 'text',
          sender: {
            userId: user?._id || null,
            name:   user?.name || 'Guest',
            type:   'customer'
          }
        })
      });

      fetchMessages(convId);
    } catch (err) {
      console.error('Send error:', err);
      // Remove optimistic bubble on failure
      setMessages(prev => prev.filter(m => m.messageId !== temp.messageId));
    } finally {
      setIsSending(false);
    }
  }, [getOrCreateConversation, token, user, fetchMessages]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed right-4 md:right-6 z-modal bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden border border-[var(--color-border-tertiary)]"
      style={{
        bottom: '5.5rem',
        width: 'min(384px, calc(100vw - 2rem))',
        height: 'min(560px, calc(100vh - 140px))'
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-navy to-[#0d3060] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-brand-navy font-semibold text-sm shadow">
              MC
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-white rounded-full" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Mediport Support</p>
            <p className="text-white/70 text-xs">
              {isLoading ? 'Loading...' : 'We\'ll reply soon'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
          aria-label="Close chat"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center bg-[var(--color-background-secondary)]">
          <div className="text-center">
            <Spinner size="md" variant="medical" className="mx-auto" />
            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Loading...</p>
          </div>
        </div>
      ) : (
        <>
          <ChatMessages
            messages={messages}
            isTyping={false}
            currentUserId={user?._id}
          />
          <ChatInput
            onSendMessage={handleSendMessage}
            onTyping={() => {}}
            disabled={isSending}
          />
        </>
      )}
    </div>
  );
}
