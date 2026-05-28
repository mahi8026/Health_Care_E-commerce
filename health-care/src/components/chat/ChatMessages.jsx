'use client';

import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import ChatTypingIndicator from './ChatTypingIndicator';

export default function ChatMessages({ messages = [], isTyping = false, currentUserId = null }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const isOwnMessage = (message) => {
    return message.sender.userId === currentUserId;
  };

  const formatTime = (date) => {
    try {
      return format(new Date(date), 'HH:mm');
    } catch {
      return '';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm mt-1">Send a message to begin chatting with our support team</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => {
            const isOwn = isOwnMessage(message);
            return (
              <div
                key={message.messageId || message._id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                  {!isOwn && (
                    <p className="text-xs text-gray-600 mb-1 px-1">
                      {message.sender.name}
                    </p>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isOwn
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    {message.messageType === 'text' && (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}
                    {message.messageType === 'image' && (
                      <div>
                        <img
                          src={message.content}
                          alt="Shared image"
                          className="rounded max-w-full h-auto"
                        />
                      </div>
                    )}
                    {message.messageType === 'file' && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">📎 {message.content}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-1 px-1">
                    <p className={`text-xs ${isOwn ? 'text-gray-600' : 'text-gray-500'}`}>
                      {formatTime(message.createdAt)}
                    </p>
                    {isOwn && message.status && (
                      <span className="text-xs text-gray-500">
                        {message.status === 'sent' && '✓'}
                        {message.status === 'delivered' && '✓✓'}
                        {message.status === 'read' && '✓✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div className="flex justify-start">
              <ChatTypingIndicator userName="Support Agent" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
