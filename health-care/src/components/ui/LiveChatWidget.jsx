'use client';

import { useState, useEffect, useRef } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaFacebookMessenger, FaWhatsapp } from 'react-icons/fa';

const glassPanel = {
  background: 'rgba(11,37,69,0.88)',
  backdropFilter: 'blur(40px) saturate(200%) brightness(1.06)',
  WebkitBackdropFilter: 'blur(40px) saturate(200%) brightness(1.06)',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.18)',
};

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: 'আসসালামু আলাইকুম, MedCore BD তে স্বাগতম!', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
    { id: 2, type: 'bot', text: 'আপনাকে কিভাবে সাহায্য করতে পারি?', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const messagesEndRef = useRef(null);

  const whatsappNumber = '8801646886795';
  const facebookPageId = '61590311825607';

  useEffect(() => {
    document.body.style.overflow = (isOpen || showContactOptions) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, showContactOptions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOpenLiveChat = () => { setShowContactOptions(false); setIsOpen(true); };
  const handleOpenWhatsApp = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello, I need help with medical equipment.')}`, '_blank');
    setShowContactOptions(false);
  };
  const handleOpenMessenger = () => {
    window.open(`https://m.me/${facebookPageId}`, '_blank');
    setShowContactOptions(false);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: prev.length + 1, type: 'user', text: message, time: now }]);
    setMessage('');
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: prev.length + 1, type: 'bot',
        text: 'ধন্যবাদ আপনার বার্তার জন্য। আমাদের বিশেষজ্ঞ শীঘ্রই আপনার সাথে যোগাযোগ করবেন।',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }]);
    }, 1000);
  };

  return (
    <>
      {/* ── FAB Button ─────────────────────────────────────────────────── */}
      {/* 
        CSS classes handle responsive positioning:
        chat-fab: base styles
        On mobile (<768px): bottom = 80px (above 60px bottom nav + 20px gap)
        On desktop (≥768px): bottom = 24px
      */}
      <button
        onClick={() => setShowContactOptions(!showContactOptions)}
        aria-label="Open contact options"
        className="chat-fab"
        style={{
          opacity: (isOpen || showContactOptions) ? 0 : 1,
          transform: (isOpen || showContactOptions) ? 'scale(0)' : 'scale(1)',
          pointerEvents: (isOpen || showContactOptions) ? 'none' : 'auto',
        }}
      >
        <FaComments size={20} />
        <span className="chat-fab-dot" />
      </button>

      {/* ── Contact Options Panel ───────────────────────────────────────── */}
      {showContactOptions && (
        <div className="chat-panel" style={{ ...glassPanel, borderRadius: '1.25rem', transformOrigin: 'bottom right', animation: 'chatPopIn 0.25s cubic-bezier(0.34,1.4,0.64,1)' }}>
          {/* Header */}
          <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Hi there! 👋</h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, margin: 0 }}>
                  Let us know if we can help you.
                </p>
              </div>
              <button onClick={() => setShowContactOptions(false)} aria-label="Close"
                style={{ width: 28, height: 28, borderRadius: 8, cursor: 'pointer', flexShrink: 0, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', minHeight: 'unset', minWidth: 'unset' }}>
                <FaTimes size={12} />
              </button>
            </div>
          </div>

          {/* Options */}
          <div style={{ padding: '10px 12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* LiveChat */}
            <button onClick={handleOpenLiveChat}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(77,219,184,0.15)', border: '1px solid rgba(77,219,184,0.25)', transition: 'background 0.2s', minHeight: 'unset' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(77,219,184,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(77,219,184,0.15)'}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(77,219,184,0.2)', border: '1px solid rgba(77,219,184,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FaComments size={16} color="#4ddbb8" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>LiveChat</span>
            </button>

            {/* Messenger */}
            <button onClick={handleOpenMessenger}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', transition: 'background 0.2s', minHeight: 'unset' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,132,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#0084FF,#00C6FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FaFacebookMessenger size={16} color="#fff" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Messenger</span>
            </button>

            {/* WhatsApp */}
            <button onClick={handleOpenWhatsApp}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', transition: 'background 0.2s', minHeight: 'unset' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,211,102,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FaWhatsapp size={18} color="#fff" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Chat Window ─────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="chat-panel chat-window" style={{ ...glassPanel, borderRadius: '1.25rem', transformOrigin: 'bottom right', animation: 'chatPopIn 0.25s cubic-bezier(0.34,1.4,0.64,1)' }}>
          {/* Chat header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(14,138,110,0.18)', borderRadius: '1.25rem 1.25rem 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(77,219,184,0.2)', border: '1px solid rgba(77,219,184,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaComments size={15} color="#4ddbb8" />
                </div>
                <span style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: '50%', background: '#4ade80', border: '2px solid rgba(11,37,69,0.9)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 1px' }}>মেসেজ করুন</h3>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Typically replies in 5 minutes</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} aria-label="Close chat"
              style={{ width: 28, height: 28, borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', minHeight: 'unset', minWidth: 'unset' }}>
              <FaTimes size={12} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '78%', padding: '8px 12px', borderRadius: msg.type === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: msg.type === 'user' ? 'rgba(14,138,110,0.35)' : 'rgba(255,255,255,0.10)', border: msg.type === 'user' ? '1px solid rgba(77,219,184,0.25)' : '1px solid rgba(255,255,255,0.12)' }}>
                  <p style={{ fontSize: 12, lineHeight: 1.5, color: msg.type === 'user' ? '#fff' : 'rgba(255,255,255,0.85)', margin: 0 }}>{msg.text}</p>
                  <span style={{ fontSize: 9, marginTop: 3, display: 'block', color: 'rgba(255,255,255,0.35)' }}>{msg.time}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} style={{ padding: '10px 12px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', borderRadius: '0 0 1.25rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message..."
                style={{ flex: 1, padding: '8px 12px', borderRadius: 10, fontSize: 12, outline: 'none', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', minHeight: 'unset' }} />
              <button type="submit" disabled={!message.trim()} aria-label="Send message"
                style={{ width: 34, height: 34, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: message.trim() ? 'rgba(14,138,110,0.5)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(77,219,184,0.25)', color: message.trim() ? '#4ddbb8' : 'rgba(255,255,255,0.25)', transition: 'all 0.2s', flexShrink: 0, minHeight: 'unset', minWidth: 'unset' }}>
                <FaPaperPlane size={12} />
              </button>
            </div>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 6, textAlign: 'center' }}>
              Powered by <span style={{ fontWeight: 600 }}>REVE Chat</span>
            </p>
          </form>
        </div>
      )}

      {/* ── Mobile Backdrop ─────────────────────────────────────────────── */}
      {(isOpen || showContactOptions) && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1049, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={() => { setIsOpen(false); setShowContactOptions(false); }}
          aria-hidden="true"
        />
      )}
    </>
  );
}
