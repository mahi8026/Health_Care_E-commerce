'use client';

import { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaBuilding } from 'react-icons/fa';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import chatSocketClient from '@/services/chatSocketClient';

export default function ConversationPanel({ conversation, onClose, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!conversation) return;

    // Join conversation
    chatSocketClient.joinConversation(conversation.conversationId);

    // Register event listeners
    const handleChatJoined = (data) => {
      setMessages(data.messages || []);
    };

    const handleNewMessage = (data) => {
      setMessages((prev) => [...prev, data.message]);
    };

    const handleTyping = (data) => {
      if (data.userType === 'customer') {
        setIsTyping(data.isTyping);
      }
    };

    chatSocketClient.on('chat:joined', handleChatJoined);
    chatSocketClient.on('chat:message', handleNewMessage);
    chatSocketClient.on('chat:typing', handleTyping);

    return () => {
      chatSocketClient.off('chat:joined', handleChatJoined);
      chatSocketClient.off('chat:message', handleNewMessage);
      chatSocketClient.off('chat:typing', handleTyping);
    };
  }, [conversation]);

  const handleSendMessage = ({ content, file, messageType }) => {
    if (!conversation) return;

    if (file) {
      // Note: File upload for agents deferred to v2.0 (enhancement)
      // Current version supports text-only messages
      return;
    }

    chatSocketClient.sendMessage(conversation.conversationId, content, messageType);
  };

  const handleTyping = (isTyping) => {
    if (!conversation) return;

    if (isTyping) {
      chatSocketClient.startTyping(conversation.conversationId);
    } else {
      chatSocketClient.stopTyping(conversation.conversationId);
    }
  };

  const handleCloseConversation = () => {
    if (!conversation) return;

    const notes = prompt('Enter closing notes (optional):');
    chatSocketClient.closeConversation(conversation.conversationId, notes || '');
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)]">
        <p>Select a conversation to view</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-[var(--color-border-primary)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {conversation.customer.name}
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)] transition-colors"
            aria-label="Close panel"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Info */}
        <div className="space-y-2 text-sm">
          {conversation.customer.email && (
            <div className="flex items-center space-x-2 text-[var(--color-text-secondary)]">
              <FaEnvelope className="w-4 h-4" />
              <span>{conversation.customer.email}</span>
            </div>
          )}
          {conversation.customer.phone && (
            <div className="flex items-center space-x-2 text-[var(--color-text-secondary)]">
              <FaPhone className="w-4 h-4" />
              <span>{conversation.customer.phone}</span>
            </div>
          )}
          {conversation.customer.userId && (
            <div className="flex items-center space-x-2 text-[var(--color-text-secondary)]">
              <FaUser className="w-4 h-4" />
              <span>Registered User</span>
            </div>
          )}
          {conversation.metadata?.isB2B && (
            <div className="flex items-center space-x-2 text-blue-600">
              <FaBuilding className="w-4 h-4" />
              <span className="font-medium">B2B Customer</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {conversation.status !== 'closed' && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border-primary)]">
            <button
              onClick={handleCloseConversation}
              className="text-sm text-[var(--color-status-danger)] hover:text-[var(--color-status-danger)] font-medium"
            >
              Close Conversation
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ChatMessages
          messages={messages}
          isTyping={isTyping}
          currentUserId={currentUserId}
        />
      </div>

      {/* Input */}
      {conversation.status !== 'closed' && (
        <ChatInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={false}
        />
      )}
    </div>
  );
}
