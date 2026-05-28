'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaCircle } from 'react-icons/fa';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import chatSocketClient from '@/services/chatSocketClient';
import { useAuth } from '@/context/AuthContext';

export default function ChatWidget({ onClose }) {
  const { user, token } = useAuth();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [agentStatus, setAgentStatus] = useState('offline');

  // Initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Connect to socket
        chatSocketClient.connect(token);

        // Register event listeners
        chatSocketClient.on('connected', handleConnected);
        chatSocketClient.on('disconnected', handleDisconnected);
        chatSocketClient.on('chat:joined', handleChatJoined);
        chatSocketClient.on('chat:message', handleNewMessage);
        chatSocketClient.on('chat:typing', handleTyping);
        chatSocketClient.on('chat:conversation:closed', handleConversationClosed);
        chatSocketClient.on('chat:error', handleError);

        // Create or get existing conversation
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const response = await fetch(`${apiUrl}/chat/conversations`, {
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
          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);
          throw new Error(`Failed to create conversation: ${response.status}`);
        }

        const data = await response.json();
        const convId = data.data.conversationId;
        setConversationId(convId);

        // Join conversation
        chatSocketClient.joinConversation(convId);

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing chat:', error);
        setIsLoading(false);
        // Show error to user
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

    // Cleanup
    return () => {
      chatSocketClient.off('connected', handleConnected);
      chatSocketClient.off('disconnected', handleDisconnected);
      chatSocketClient.off('chat:joined', handleChatJoined);
      chatSocketClient.off('chat:message', handleNewMessage);
      chatSocketClient.off('chat:typing', handleTyping);
      chatSocketClient.off('chat:conversation:closed', handleConversationClosed);
      chatSocketClient.off('chat:error', handleError);
    };
  }, [token, user]);

  const handleConnected = useCallback(() => {
    setIsConnected(true);
  }, []);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
  }, []);

  const handleChatJoined = useCallback((data) => {
    setMessages(data.messages || []);
    setAgentStatus(data.conversation?.status === 'active' ? 'online' : 'offline');
  }, []);

  const handleNewMessage = useCallback((data) => {
    setMessages((prev) => [...prev, data.message]);
  }, []);

  const handleTyping = useCallback((data) => {
    if (data.userType === 'agent') {
      setIsTyping(data.isTyping);
    }
  }, []);

  const handleConversationClosed = useCallback(() => {
    setAgentStatus('offline');
  }, []);

  const handleError = useCallback((data) => {
    console.error('Chat error:', data.message);
  }, []);

  const handleSendMessage = useCallback(
    async ({ content, file, messageType }) => {
      if (!conversationId) return;

      try {
        if (file) {
          // Upload file first
          const formData = new FormData();
          formData.append('file', file);
          formData.append('conversationId', conversationId);

          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
          const uploadResponse = await fetch(
            `${apiUrl}/chat/upload`,
            {
              method: 'POST',
              headers: {
                ...(token && { Authorization: `Bearer ${token}` })
              },
              body: formData
            }
          );

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload file');
          }

          const uploadData = await uploadResponse.json();
          chatSocketClient.sendMessage(conversationId, uploadData.data.url, 'file');
        } else {
          chatSocketClient.sendMessage(conversationId, content, messageType);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
    [conversationId, token]
  );

  const handleUserTyping = useCallback(
    (isTyping) => {
      if (!conversationId) return;

      if (isTyping) {
        chatSocketClient.startTyping(conversationId);
      } else {
        chatSocketClient.stopTyping(conversationId);
      }
    },
    [conversationId]
  );

  return (
    <div className="fixed bottom-24 right-6 z-[9999] w-96 max-h-[600px] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden" style={{ height: 'min(600px, calc(100vh - 120px))' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold">
              MC
            </div>
            <FaCircle
              className={`absolute bottom-0 right-0 w-3 h-3 ${
                agentStatus === 'online' ? 'text-green-500' : 'text-gray-400'
              }`}
            />
          </div>
          <div>
            <h3 className="font-semibold">MedCore Support</h3>
            <p className="text-xs opacity-90">
              {isConnected
                ? agentStatus === 'online'
                  ? 'Online'
                  : 'We\'ll reply soon'
                : 'Connecting...'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          aria-label="Close chat"
        >
          <FaTimes className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading chat...</p>
          </div>
        </div>
      ) : (
        <>
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            currentUserId={user?._id}
          />

          {/* Input */}
          <ChatInput
            onSendMessage={handleSendMessage}
            onTyping={handleUserTyping}
            disabled={!isConnected}
          />
        </>
      )}
    </div>
  );
}
