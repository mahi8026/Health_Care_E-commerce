'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaComments, FaClock, FaCheckCircle, FaCircle,
  FaEnvelope, FaTimes, FaPaperPlane, FaArrowLeft,
  FaUser, FaPhone, FaBuilding, FaSearch, FaSync
} from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://health-care-e-commerce.onrender.com/api';

const STATUS_OPTIONS = [
  { value: 'online',  label: 'Online',  dot: 'bg-green-500' },
  { value: 'away',    label: 'Away',    dot: 'bg-yellow-500' },
  { value: 'busy',    label: 'Busy',    dot: 'bg-red-500' },
  { value: 'offline', label: 'Offline', dot: 'bg-gray-400' },
];

function formatTime(date) {
  try { return format(new Date(date), 'HH:mm'); } catch { return ''; }
}

function timeAgo(date) {
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }); } catch { return ''; }
}

function getAuthToken() {
  if (typeof window !== 'undefined') return localStorage.getItem('Mediport_token');
  return null;
}

function getHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` };
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    active:  'bg-green-100 text-green-700 border-green-200',
    waiting: 'bg-amber-100 text-amber-700 border-amber-200',
    closed:  'bg-gray-100  text-gray-500  border-gray-200',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${map[status] ?? map.closed}`}>
      {status}
    </span>
  );
}

// ── Conversation list item ────────────────────────────────────────────────────
function ConvItem({ conv, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors hover:bg-blue-50/60
        ${isSelected ? 'bg-blue-50 border-l-[3px] border-l-blue-600' : 'border-l-[3px] border-l-transparent'}`}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {(conv.customer?.name || 'G')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="font-semibold text-gray-900 text-sm truncate">
              {conv.customer?.name || 'Guest'}
            </span>
            <span className="text-[10px] text-gray-400 flex-shrink-0">
              {timeAgo(conv.lastMessageAt || conv.createdAt)}
            </span>
          </div>
          {conv.customer?.email && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{conv.customer.email}</p>
          )}
          <div className="mt-1">
            <StatusBadge status={conv.status} />
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isAgent = msg.sender?.type === 'agent';
  const isSystem = msg.sender?.type === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {msg.content?.text || msg.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isAgent ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isAgent && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end mb-1">
          {(msg.sender?.name || 'G')[0].toUpperCase()}
        </div>
      )}
      <div className={`max-w-[72%] ${isAgent ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isAgent && (
          <span className="text-[10px] text-gray-500 mb-1 px-1">{msg.sender?.name || 'Customer'}</span>
        )}
        <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
          isAgent
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {msg.content?.text || msg.content}
          </p>
        </div>
        <span className="text-[10px] text-gray-400 mt-1 px-1">{formatTime(msg.createdAt)}</span>
      </div>
      {isAgent && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold ml-2 flex-shrink-0 self-end mb-1">
          A
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function ChatDashboard() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected]           = useState(null);
  const [messages, setMessages]           = useState([]);
  const [reply, setReply]                 = useState('');
  const [sending, setSending]             = useState(false);
  const [agentStatus, setAgentStatus]     = useState('online');
  const [stats, setStats]                 = useState({ active: 0, waiting: 0, closed: 0 });
  const [isLoading, setIsLoading]         = useState(true);
  const [search, setSearch]               = useState('');
  const [showPanel, setShowPanel]         = useState(false); // mobile: show chat panel

  const pollRef      = useRef(null);
  const msgPollRef   = useRef(null);
  const messagesEnd  = useRef(null);
  const selectedRef  = useRef(null);
  const replyRef     = useRef(null);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // ── Fetch conversations ───────────────────────────────────────────────────
  const fetchConversations = useCallback(() => {
    fetch(`${API_URL}/chat/conversations?limit=100`, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const convs = data.data || [];
        setConversations(convs);
        setStats({
          active:  convs.filter(c => c.status === 'active').length,
          waiting: convs.filter(c => c.status === 'waiting').length,
          closed:  convs.filter(c => c.status === 'closed').length,
        });
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  // ── Fetch messages ────────────────────────────────────────────────────────
  const fetchMessages = useCallback((convId) => {
    if (!convId) return;
    fetch(`${API_URL}/chat/messages/${convId}`, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setMessages(data.data || []);
        setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      })
      .catch(() => {});
  }, []);

  // ── Polling ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchConversations();
    pollRef.current = setInterval(fetchConversations, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchConversations]);

  useEffect(() => {
    clearInterval(msgPollRef.current);
    if (!selected) return;
    fetchMessages(selected.conversationId);
    msgPollRef.current = setInterval(() => {
      if (selectedRef.current) fetchMessages(selectedRef.current.conversationId);
    }, 3000);
    return () => clearInterval(msgPollRef.current);
  }, [selected, fetchMessages]);

  // ── Search filter (computed, no state needed) ────────────────────────────
  const filtered = search
    ? conversations.filter(c =>
        c.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.customer?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  // ── Select conversation ───────────────────────────────────────────────────
  const handleSelect = (conv) => {
    setSelected(conv);
    setMessages([]);
    setShowPanel(true);
    replyRef.current?.focus();
  };

  // ── Send reply ────────────────────────────────────────────────────────────
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !selected) return;
    setSending(true);

    // Optimistic
    const temp = {
      messageId: `temp-${Date.now()}`,
      content: { text: reply.trim() },
      sender: { type: 'agent', name: 'Agent' },
      messageType: 'text',
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, temp]);
    const text = reply.trim();
    setReply('');

    try {
      await fetch(`${API_URL}/chat/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          conversationId: selected.conversationId,
          content: text,
          messageType: 'text',
          sender: { type: 'agent' },
        }),
      });
      fetchMessages(selected.conversationId);
    } catch { /* silent */ }
    setSending(false);
  };

  // ── Close conversation ────────────────────────────────────────────────────
  const handleClose = async (convId) => {
    if (!confirm('Close this conversation?')) return;
    try {
      await fetch(`${API_URL}/chat/conversations/${convId}/close`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ closingNotes: 'Closed by agent' }),
      });
      fetchConversations();
      if (selected?.conversationId === convId) { setSelected(null); setShowPanel(false); }
    } catch { /* silent */ }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading conversations...</p>
        </div>
      </div>
    );
  }

  const currentStatus = STATUS_OPTIONS.find(s => s.value === agentStatus);

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <FaComments className="text-white w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Live Chat</h1>
            <p className="text-xs text-gray-500">Real-time customer support</p>
          </div>
        </div>

        {/* Status selector */}
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${currentStatus?.dot}`} />
          <select
            value={agentStatus}
            onChange={e => setAgentStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={fetchConversations}
            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
            title="Refresh"
          >
            <FaSync className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 px-4 py-3">
        {[
          { label: 'Active',  value: stats.active,  icon: FaComments,    bg: 'bg-blue-50',   text: 'text-blue-600',  border: 'border-blue-100' },
          { label: 'Waiting', value: stats.waiting, icon: FaClock,       bg: 'bg-amber-50',  text: 'text-amber-600', border: 'border-amber-100' },
          { label: 'Closed',  value: stats.closed,  icon: FaCheckCircle, bg: 'bg-green-50',  text: 'text-green-600', border: 'border-green-100' },
        ].map(({ label, value, icon: Icon, bg, text, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl p-3 flex items-center gap-2`}>
            <Icon className={`${text} w-4 h-4 flex-shrink-0`} />
            <div>
              <p className={`text-xl font-bold ${text} leading-none`}>{value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main split layout ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden mx-4 mb-4 rounded-xl border border-gray-200 bg-white shadow-sm"
           style={{ minHeight: 0, height: 'calc(100vh - 260px)' }}>

        {/* ── Conversation list (hidden on mobile when panel open) ──────── */}
        <div className={`flex flex-col border-r border-gray-100 flex-shrink-0
          ${showPanel ? 'hidden md:flex' : 'flex'}
          w-full md:w-72 lg:w-80`}>

          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <FaComments className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">{search ? 'No results found' : 'No conversations yet'}</p>
              </div>
            ) : (
              filtered.map(conv => (
                <ConvItem
                  key={conv.conversationId}
                  conv={conv}
                  isSelected={selected?.conversationId === conv.conversationId}
                  onClick={() => handleSelect(conv)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Chat panel ───────────────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col overflow-hidden
          ${showPanel ? 'flex' : 'hidden md:flex'}`}>

          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center px-6">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <FaComments className="w-9 h-9 opacity-40" />
                </div>
                <p className="text-base font-medium text-gray-500">Select a conversation</p>
                <p className="text-sm text-gray-400 mt-1">Choose from the list to start replying</p>
              </div>
            </div>
          ) : (
            <>
              {/* Panel header */}
              <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
                {/* Back button (mobile) */}
                <button
                  onClick={() => { setShowPanel(false); setSelected(null); }}
                  className="md:hidden text-gray-500 hover:text-gray-700 p-1"
                >
                  <FaArrowLeft className="w-4 h-4" />
                </button>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(selected.customer?.name || 'G')[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {selected.customer?.name || 'Guest'}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {selected.customer?.email && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <FaEnvelope className="w-3 h-3" />{selected.customer.email}
                      </span>
                    )}
                    {selected.customer?.phone && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <FaPhone className="w-3 h-3" />{selected.customer.phone}
                      </span>
                    )}
                    <StatusBadge status={selected.status} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selected.status !== 'closed' && (
                    <button
                      onClick={() => handleClose(selected.conversationId)}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  )}
                  <button
                    onClick={() => { setSelected(null); setShowPanel(false); }}
                    className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors hidden md:block"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50/50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <MessageBubble key={msg.messageId || msg._id} msg={msg} />
                  ))
                )}
                <div ref={messagesEnd} />
              </div>

              {/* Reply input */}
              {selected.status !== 'closed' ? (
                <form
                  onSubmit={handleSendReply}
                  className="bg-white border-t border-gray-100 px-4 py-3 flex items-end gap-2 flex-shrink-0"
                >
                  <textarea
                    ref={replyRef}
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(e);
                      }
                    }}
                    placeholder="Type your reply... (Enter to send)"
                    rows={1}
                    disabled={sending}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none bg-gray-50 disabled:opacity-50"
                    style={{ maxHeight: '120px', overflowY: 'auto' }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    <FaPaperPlane className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="bg-gray-50 border-t border-gray-100 px-4 py-3 text-center text-sm text-gray-400 flex-shrink-0">
                  🔒 This conversation is closed
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
