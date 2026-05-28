'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaComments, FaClock, FaCheckCircle, FaCircle, FaEnvelope, FaTimes, FaPaperPlane } from 'react-icons/fa';
import { format } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://health-care-e-commerce.onrender.com/api';

const STATUS_OPTIONS = [
  { value: 'online', label: 'Online', color: 'text-green-500' },
  { value: 'away', label: 'Away', color: 'text-yellow-500' },
  { value: 'busy', label: 'Busy', color: 'text-red-500' },
  { value: 'offline', label: 'Offline', color: 'text-gray-400' }
];

function formatTime(date) {
  try { return format(new Date(date), 'HH:mm'); } catch { return ''; }
}

function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('medcore_token');
  }
  return null;
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`
  };
}

export default function ChatDashboard() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [agentStatus, setAgentStatus] = useState('online');
  const [stats, setStats] = useState({ active: 0, waiting: 0, closed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const pollRef = useRef(null);
  const msgPollRef = useRef(null);
  const messagesEndRef = useRef(null);
  const selectedRef = useRef(null);

  // Keep selectedRef in sync so interval callbacks always have latest value
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  // Fetch all conversations - defined outside useEffect to avoid setState-in-effect warning
  const fetchConversations = useCallback(() => {
    fetch(`${API_URL}/chat/conversations?limit=50`, { headers: getHeaders() })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        const convs = data.data || [];
        setConversations(convs);
        setStats({
          active: convs.filter(c => c.status === 'active').length,
          waiting: convs.filter(c => c.status === 'waiting').length,
          closed: convs.filter(c => c.status === 'closed').length
        });
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback((convId) => {
    if (!convId) return;
    fetch(`${API_URL}/chat/messages/${convId}`, { headers: getHeaders() })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        setMessages(data.data || []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .catch(() => {});
  }, []);

  // Initial load + poll conversations every 5s
  useEffect(() => {
    fetchConversations();
    pollRef.current = setInterval(fetchConversations, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchConversations]);

  // Poll messages for selected conversation every 3s
  useEffect(() => {
    clearInterval(msgPollRef.current);
    if (!selected) return;
    fetchMessages(selected.conversationId);
    msgPollRef.current = setInterval(() => {
      if (selectedRef.current) {
        fetchMessages(selectedRef.current.conversationId);
      }
    }, 3000);
    return () => clearInterval(msgPollRef.current);
  }, [selected, fetchMessages]);

  // Send reply as agent
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/chat/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          conversationId: selected.conversationId,
          content: reply.trim(),
          messageType: 'text',
          sender: { type: 'agent' }
        })
      });
      if (res.ok) {
        setReply('');
        fetchMessages(selected.conversationId);
      }
    } catch (e) { /* silent */ }
    setSending(false);
  };

  // Close conversation
  const handleClose = async (convId) => {
    try {
      await fetch(`${API_URL}/chat/conversations/${convId}/close`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ closingNotes: 'Closed by agent' })
      });
      fetchConversations();
      if (selected?.conversationId === convId) setSelected(null);
    } catch (e) { /* silent */ }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Live Chat Dashboard</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Status:</span>
            <select
              value={agentStatus}
              onChange={e => setAgentStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <FaCircle className={`w-3 h-3 ${STATUS_OPTIONS.find(o => o.value === agentStatus)?.color}`} />
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 flex items-center space-x-3">
            <FaComments className="w-5 h-5 text-blue-600" />
            <div><p className="text-2xl font-bold text-blue-600">{stats.active}</p><p className="text-xs text-gray-600">Active</p></div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 flex items-center space-x-3">
            <FaClock className="w-5 h-5 text-yellow-600" />
            <div><p className="text-2xl font-bold text-yellow-600">{stats.waiting}</p><p className="text-xs text-gray-600">Waiting</p></div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 flex items-center space-x-3">
            <FaCheckCircle className="w-5 h-5 text-green-600" />
            <div><p className="text-2xl font-bold text-green-600">{stats.closed}</p><p className="text-xs text-gray-600">Closed</p></div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <FaComments className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.conversationId}
                onClick={() => setSelected(conv)}
                className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selected?.conversationId === conv.conversationId
                    ? 'bg-blue-50 border-l-4 border-l-blue-600'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 text-sm">{conv.customer?.name || 'Guest'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    conv.status === 'active' ? 'bg-green-100 text-green-700' :
                    conv.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{conv.status}</span>
                </div>
                {conv.customer?.email && (
                  <p className="text-xs text-gray-500 truncate">{conv.customer.email}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{formatTime(conv.lastMessageAt || conv.createdAt)}</p>
              </button>
            ))
          )}
        </div>

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <FaComments className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-lg">Select a conversation to reply</p>
              </div>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="font-semibold text-gray-900">{selected.customer?.name || 'Guest'}</h3>
                  <div className="flex items-center space-x-3 mt-1">
                    {selected.customer?.email && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <FaEnvelope className="w-3 h-3" />{selected.customer.email}
                      </span>
                    )}
                    {selected.customer?.phone && (
                      <span className="text-xs text-gray-500">{selected.customer.phone}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {selected.status !== 'closed' && (
                    <button
                      onClick={() => handleClose(selected.conversationId)}
                      className="text-xs text-red-600 hover:text-red-700 border border-red-200 px-3 py-1 rounded-lg"
                    >
                      Close Chat
                    </button>
                  )}
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">No messages yet</div>
                ) : (
                  messages.map(msg => {
                    const isAgent = msg.sender?.type === 'agent';
                    return (
                      <div key={msg.messageId || msg._id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[70%]">
                          {!isAgent && (
                            <p className="text-xs text-gray-500 mb-1 px-1">{msg.sender?.name || 'Customer'}</p>
                          )}
                          <div className={`rounded-lg px-4 py-2 ${
                            isAgent ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border border-gray-200'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.content?.text || msg.content}
                            </p>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 px-1">{formatTime(msg.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              {selected.status !== 'closed' ? (
                <form onSubmit={handleSendReply} className="bg-white border-t border-gray-200 p-4 flex items-center space-x-2 flex-shrink-0">
                  <input
                    type="text"
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FaPaperPlane className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="bg-gray-100 border-t border-gray-200 p-4 text-center text-sm text-gray-500">
                  This conversation is closed
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
