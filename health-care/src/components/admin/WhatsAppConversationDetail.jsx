'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/utils/api';
import { showToast } from '@/components/ui/Toast';

export default function WhatsAppConversationDetail({ conversationId }) {
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [assigningAgent, setAssigningAgent] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversation = async () => {
    try {
      setError(null);
      const response = await api.get(`/whatsapp/conversations/${conversationId}`);
      
      if (response.data.success) {
        setConversation(response.data.conversation);
        setMessages(response.data.messages);
        
        // Scroll to bottom on initial load
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  // Fetch conversation details
  useEffect(() => {
    void Promise.resolve().then(fetchConversation);
    
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchConversation, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Fetch admin users for assignment
  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        setLoadingAdmins(true);
        const response = await api.get('/admin/users');
        
        if (response.data.success) {
          setAdminUsers(response.data.users);
        }
      } catch (err) {
        console.error('Failed to load admin users:', err);
      } finally {
        setLoadingAdmins(false);
      }
    };

    fetchAdminUsers();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || sending) return;

    try {
      setSending(true);
      const response = await api.post('/whatsapp/send', {
        to: conversation.phoneNumber,
        text: messageText.trim()
      });

      if (response.data.success) {
        setMessageText('');
        // Refresh conversation to get new message
        await fetchConversation();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await api.put(`/whatsapp/conversations/${conversationId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        setConversation(response.data.conversation);
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCategoryChange = async (newCategory) => {
    try {
      const response = await api.put(`/whatsapp/conversations/${conversationId}`, {
        category: newCategory
      });

      if (response.data.success) {
        setConversation(response.data.conversation);
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update category');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    
    if (!noteText.trim() || addingNote) return;

    try {
      setAddingNote(true);
      const response = await api.post(`/whatsapp/conversations/${conversationId}/notes`, {
        text: noteText.trim()
      });

      if (response.data.success) {
        setConversation(response.data.conversation);
        setNoteText('');
        setShowNoteInput(false);
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleAssignAgent = async (userId) => {
    if (assigningAgent) return;

    try {
      setAssigningAgent(true);
      const response = await api.put(`/whatsapp/conversations/${conversationId}/assign`, {
        userId
      });

      if (response.data.success) {
        setConversation(response.data.conversation);
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to assign agent');
    } finally {
      setAssigningAgent(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]',
      resolved: 'bg-blue-100 text-blue-800',
      pending: 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]',
      escalated: 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]',
      closed: 'bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)]'
    };
    return styles[status] || styles.active;
  };

  const getMessageStatusIcon = (status) => {
    const icons = {
      queued: '🕐',
      sent: '✓',
      delivered: '✓✓',
      read: '✓✓',
      failed: '❌'
    };
    return icons[status] || '';
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-BD', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderMessageContent = (message) => {
    switch (message.type) {
      case 'text':
        return <p className="whitespace-pre-wrap break-words">{message.content?.text}</p>;
      
      case 'image':
        return (
          <div>
            {message.content?.mediaUrl && (
              <div className="relative w-64 h-48 rounded-lg overflow-hidden mb-2">
                <Image
                  src={message.content.mediaUrl}
                  alt="Image message"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            {message.content?.caption && (
              <p className="text-sm mt-2">{message.content.caption}</p>
            )}
          </div>
        );
      
      case 'document':
        return (
          <div className="flex items-center gap-2 p-3 bg-[var(--color-background-tertiary)] rounded-lg">
            <span className="text-2xl">📄</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{message.content?.filename || 'Document'}</p>
              {message.content?.mediaUrl && (
                <a
                  href={message.content.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Download
                </a>
              )}
            </div>
          </div>
        );
      
      case 'audio':
        return (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎵</span>
            {message.content?.mediaUrl && (
              <audio controls className="max-w-xs">
                <source src={message.content.mediaUrl} type={message.content?.mimeType} />
              </audio>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div>
            {message.content?.mediaUrl && (
              <video controls className="max-w-sm rounded-lg">
                <source src={message.content.mediaUrl} type={message.content?.mimeType} />
              </video>
            )}
            {message.content?.caption && (
              <p className="text-sm mt-2">{message.content.caption}</p>
            )}
          </div>
        );
      
      case 'location':
        return (
          <div className="p-3 bg-[var(--color-background-tertiary)] rounded-lg">
            <p className="text-2xl mb-2">📍</p>
            {message.content?.locationName && (
              <p className="font-medium">{message.content.locationName}</p>
            )}
            {message.content?.locationAddress && (
              <p className="text-sm text-[var(--color-text-secondary)]">{message.content.locationAddress}</p>
            )}
            {message.content?.latitude && message.content?.longitude && (
              <a
                href={`https://www.google.com/maps?q=${message.content.latitude},${message.content.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline mt-1 inline-block"
              >
                View on Map
              </a>
            )}
          </div>
        );
      
      case 'interactive':
        return (
          <div>
            <p>{message.content?.buttonText || message.content?.listTitle}</p>
            {message.content?.buttonId && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">Selected: {message.content.buttonId}</p>
            )}
          </div>
        );
      
      default:
        return <p className="text-[var(--color-text-secondary)] italic">Unsupported message type: {message.type}</p>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background-secondary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-[var(--color-text-secondary)] mt-4">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-background-secondary)] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <span className="text-6xl">⚠️</span>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mt-4">Error Loading Conversation</h2>
          <p className="text-[var(--color-text-secondary)] mt-2">{error}</p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-[var(--color-border-primary)] rounded-lg hover:bg-[var(--color-background-secondary)] transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={fetchConversation}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border-primary)] flex flex-col h-[calc(100vh-200px)]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.direction === 'outbound'
                          ? 'bg-blue-600 text-white'
                          : 'bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)]'
                      }`}
                    >
                      {renderMessageContent(message)}
                      
                      <div className={`flex items-center gap-2 mt-2 text-xs ${
                        message.direction === 'outbound' ? 'text-blue-100' : 'text-[var(--color-text-secondary)]'
                      }`}>
                        <span>{formatTime(message.createdAt)}</span>
                        {message.direction === 'outbound' && (
                          <span className={message.status === 'read' ? 'text-blue-200' : ''}>
                            {getMessageStatusIcon(message.status)}
                          </span>
                        )}
                        {message.status === 'failed' && (
                          <span className="text-[var(--color-status-danger)]" title={message.errorMessage}>
                            Failed
                          </span>
                        )}
                      </div>
                      
                      {message.sentBy && (
                        <p className={`text-xs mt-1 ${
                          message.direction === 'outbound' ? 'text-blue-100' : 'text-[var(--color-text-secondary)]'
                        }`}>
                          Sent by: {message.sentBy.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="border-t border-[var(--color-border-primary)] p-4">
                <div className="flex gap-2">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    rows={2}
                    className="flex-1 px-4 py-2 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() || sending}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Conversation Info */}
            <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border-primary)] p-4">
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Conversation Info</h3>
              
              {/* Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Status</label>
                <select
                  value={conversation.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                  <option value="pending">Pending</option>
                  <option value="escalated">Escalated</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Category</label>
                <select
                  value={conversation.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="product_inquiry">Product Inquiry</option>
                  <option value="order_status">Order Status</option>
                  <option value="quote_request">Quote Request</option>
                  <option value="complaint">Complaint</option>
                  <option value="support">Support</option>
                  <option value="general">General</option>
                  <option value="b2b_inquiry">B2B Inquiry</option>
                  <option value="payment_issue">Payment Issue</option>
                  <option value="delivery_issue">Delivery Issue</option>
                  <option value="return_request">Return Request</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Assign To Agent */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Assign To</label>
                <select
                  value={conversation.assignedTo?._id || ''}
                  onChange={(e) => handleAssignAgent(e.target.value)}
                  disabled={loadingAdmins || assigningAgent}
                  className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Unassigned</option>
                  {adminUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                {assigningAgent && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">Assigning...</p>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Messages:</span>
                  <span className="font-medium">{conversation.messageCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Created:</span>
                  <span className="font-medium">{formatDate(conversation.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Last Message:</span>
                  <span className="font-medium">{formatDate(conversation.lastMessageAt)}</span>
                </div>
                {conversation.assignedTo && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Assigned To:</span>
                    <span className="font-medium">{conversation.assignedTo.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Context */}
            {conversation.user && (
              <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border-primary)] p-4">
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Customer Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-[var(--color-text-secondary)]">Name:</span>
                    <p className="font-medium">{conversation.user.name}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-secondary)]">Email:</span>
                    <p className="font-medium">{conversation.user.email}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-secondary)]">Phone:</span>
                    <p className="font-medium">{conversation.user.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Related Order */}
            {conversation.relatedOrder && (
              <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border-primary)] p-4">
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Related Order</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-[var(--color-text-secondary)]">Order Number:</span>
                    <p className="font-medium">{conversation.relatedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-secondary)]">Status:</span>
                    <p className="font-medium">{conversation.relatedOrder.status}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/admin/orders/${conversation.relatedOrder._id}`)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View Order →
                  </button>
                </div>
              </div>
            )}

            {/* Internal Notes */}
            <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border-primary)] p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--color-text-primary)]">Internal Notes</h3>
                <button
                  onClick={() => setShowNoteInput(!showNoteInput)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showNoteInput ? 'Cancel' : '+ Add Note'}
                </button>
              </div>

              {showNoteInput && (
                <form onSubmit={handleAddNote} className="mb-4">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add internal note..."
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none mb-2"
                  />
                  <button
                    type="submit"
                    disabled={!noteText.trim() || addingNote}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {addingNote ? 'Adding...' : 'Add Note'}
                  </button>
                </form>
              )}

              <div className="space-y-3">
                {conversation.notes?.length > 0 ? (
                  conversation.notes.map((note, index) => (
                    <div key={index} className="bg-[var(--color-status-warning-tint)] border border-[var(--color-status-warning-tint)] rounded-lg p-3">
                      <p className="text-sm text-[var(--color-text-primary)]">{note.text}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-secondary)]">
                        <span>{note.addedBy?.name || 'Unknown'}</span>
                        <span>•</span>
                        <span>{formatDate(note.addedAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--color-text-secondary)] italic">No notes yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
