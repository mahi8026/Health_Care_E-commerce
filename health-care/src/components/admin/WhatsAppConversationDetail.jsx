'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/utils/api';

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

  // Fetch conversation details
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

  useEffect(() => {
    fetchConversation();
    
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchConversation, 10000);
    return () => clearInterval(interval);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      alert(err.response?.data?.message || 'Failed to send message');
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
      alert(err.response?.data?.message || 'Failed to update status');
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
      alert(err.response?.data?.message || 'Failed to update category');
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
      alert(err.response?.data?.message || 'Failed to add note');
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
      alert(err.response?.data?.message || 'Failed to assign agent');
    } finally {
      setAssigningAgent(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      resolved: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      escalated: 'bg-red-100 text-red-800',
      closed: 'bg-gray-100 text-gray-800'
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
          <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
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
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-2xl mb-2">📍</p>
            {message.content?.locationName && (
              <p className="font-medium">{message.content.locationName}</p>
            )}
            {message.content?.locationAddress && (
              <p className="text-sm text-gray-600">{message.content.locationAddress}</p>
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
              <p className="text-xs text-gray-500 mt-1">Selected: {message.content.buttonId}</p>
            )}
          </div>
        );
      
      default:
        return <p className="text-gray-500 italic">Unsupported message type: {message.type}</p>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <span className="text-6xl">⚠️</span>
          <h2 className="text-xl font-bold text-gray-900 mt-4">Error Loading Conversation</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {conversation.customerName || 'Unknown Customer'}
              </h1>
              <p className="text-sm text-gray-600">{conversation.phoneNumber}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(conversation.status)}`}>
              {conversation.status}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-200px)]">
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
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {renderMessageContent(message)}
                      
                      <div className={`flex items-center gap-2 mt-2 text-xs ${
                        message.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span>{formatTime(message.createdAt)}</span>
                        {message.direction === 'outbound' && (
                          <span className={message.status === 'read' ? 'text-blue-200' : ''}>
                            {getMessageStatusIcon(message.status)}
                          </span>
                        )}
                        {message.status === 'failed' && (
                          <span className="text-red-500" title={message.errorMessage}>
                            Failed
                          </span>
                        )}
                      </div>
                      
                      {message.sentBy && (
                        <p className={`text-xs mt-1 ${
                          message.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'
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
              <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4">
                <div className="flex gap-2">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    rows={2}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Conversation Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Conversation Info</h3>
              
              {/* Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={conversation.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={conversation.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                <select
                  value={conversation.assignedTo?._id || ''}
                  onChange={(e) => handleAssignAgent(e.target.value)}
                  disabled={loadingAdmins || assigningAgent}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Unassigned</option>
                  {adminUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                {assigningAgent && (
                  <p className="text-xs text-gray-500 mt-1">Assigning...</p>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Messages:</span>
                  <span className="font-medium">{conversation.messageCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{formatDate(conversation.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Message:</span>
                  <span className="font-medium">{formatDate(conversation.lastMessageAt)}</span>
                </div>
                {conversation.assignedTo && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assigned To:</span>
                    <span className="font-medium">{conversation.assignedTo.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Context */}
            {conversation.user && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Customer Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium">{conversation.user.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{conversation.user.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium">{conversation.user.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Related Order */}
            {conversation.relatedOrder && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Related Order</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Order Number:</span>
                    <p className="font-medium">{conversation.relatedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Internal Notes</h3>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none mb-2"
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
                    <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-gray-900">{note.text}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                        <span>{note.addedBy?.name || 'Unknown'}</span>
                        <span>•</span>
                        <span>{formatDate(note.addedAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No notes yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
