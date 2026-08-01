'use client';

import { format } from 'date-fns';
import { FaCircle, FaClock } from 'react-icons/fa';

export default function ConversationList({ conversations = [], selectedId, onSelect }) {
  const formatTime = (date) => {
    try {
      return format(new Date(date), 'HH:mm');
    } catch {
      return '';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-[var(--color-status-success)]';
      case 'waiting':
        return 'text-[var(--color-status-warning)]';
      case 'closed':
        return 'text-[var(--color-text-secondary)]';
      default:
        return 'text-[var(--color-text-secondary)]';
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)]">
        <div className="text-center">
          <FaClock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No conversations yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--color-border-primary)]">
      {conversations.map((conversation) => (
        <button
          key={conversation.conversationId}
          onClick={() => onSelect(conversation)}
          className={`w-full p-4 text-left hover:bg-[var(--color-background-secondary)] transition-colors ${
            selectedId === conversation.conversationId ? 'bg-blue-50' : ''
          }`}
        >
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-[var(--color-text-primary)]">
                {conversation.customer.name}
              </h4>
              <FaCircle className={`w-2 h-2 ${getStatusColor(conversation.status)}`} />
            </div>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {formatTime(conversation.lastMessageAt || conversation.createdAt)}
            </span>
          </div>
          {conversation.customer.email && (
            <p className="text-xs text-[var(--color-text-secondary)] mb-1">{conversation.customer.email}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-secondary)] capitalize">{conversation.status}</span>
            {conversation.messageCount > 0 && (
              <span className="text-xs bg-[var(--color-background-muted)] text-[var(--color-text-primary)] px-2 py-0.5 rounded-full">
                {conversation.messageCount} messages
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
