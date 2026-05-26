'use client';

import { useState, useEffect, useRef } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaFacebookMessenger, FaWhatsapp } from 'react-icons/fa';

const glassPanel = {
  background: 'rgba(11,37,69,0.78)',
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
  const handleOpenMessenger = () => { window.open(`https://m.me/${facebookPageId}`, '_blank'); setShowContactOptions(false); };

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
      {/* FAB trigger */}
      <button
        onClick={() => setShowContactOptions(!showContactOptions)}
        className={`fixed right-4 md:right-6 bottom-[76px] md:bottom-6 z-[1050] transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen || showContactOptions ? 'scale-0 pointer-events-none' : 'scale-100'
        }`}
        style={{
        style={{
          width: 52, height: 52, borderRadius: '1rem',
          background: 'rgba(11,37,69,0.72)',
          backdropFilter: 'blur(24px) saturate(200%) brightness(1.1)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(1.1)',
          border: '1px solid rgba(255,255,255,0.22)',
          boxShadow: '0 8px 32px rgba(11,37,69,0.35), inset 0 1px 0 rgba(255,255,255,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#4ddbb8',
        }}
        aria-label="Open contact options"
      >
        <FaComments size={22} />
        <span style={{
          position: 'absolute', top: 10, right: 10,
          width: 8, height: 8, borderRadius: '50%',
          background: '#4ade80',
          border: '2px solid rgba(11,37,69,0.9)',
          boxShadow: '0 0 6px rgba(74,222,128,0.7)',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
      </button>

      {/* Contact options panel */}
      {showContactOptions && (
        <div
          className="fixed right-4 md:right-6 bottom-[76px] md:bottom-6 z-[1051] w-[90vw] max-w-[380px]"
          style={{ ...glassPanel, borderRadius: '1.25rem', transformOrigin: 'bottom right', animation: 'glassPopIn 0.25s cubic-bezier(0.34,1.4,0.64,1)' }}
          style={{ ...glassPanel, borderRadius: '1.25rem', transformOrigin: 'bottom right', animation: 'glassPopIn 0.25s cubic-bezier(0.34,1.4,0.64,1)' }}
        >
          <style>{`
            @keyframes glassPopIn { from { opacity:0; transform:scale(0.88) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
            @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
          `}</style>

          {/* Header */}
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Hi there! 👋</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                  Let us know if we can help you with anything.
                </p>
              </div>
              <button onClick={() => setShowContactOptions(false)}
                style={{
                  width: 30, height: 30, borderRadius: 8, cursor: 'pointer', flexShrink: 0,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)',
                }}
                aria-label="Close">
                <FaTimes size={13} />
              </button>
            </div>
          </div>

          {/* Options */}
          <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* LiveChat */}
            <button onClick={handleOpenLiveChat}
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'rgba(77,219,184,0.15)',
                border: '1px solid rgba(77,219,184,0.25)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(77,219,184,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(77,219,184,0.15)'}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(77,219,184,0.2)', border: '1px solid rgba(77,219,184,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FaComments size={18} color="#4ddbb8" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>LiveChat</span>
            </button>

            {/* Messenger */}
            <button onClick={handleOpenMessenger}
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,132,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#0084FF,#00C6FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FaFacebookMessenger size={18} color="#fff" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Messenger</span>
            </button>

            {/* WhatsApp */}
            <button onClick={handleOpenWhatsApp}
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,211,102,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FaWhatsapp size={20} color="#fff" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed right-4 md:right-6 bottom-[76px] md:bottom-6 z-[1051] w-[90vw] max-w-[360px] flex flex-col h-[480px] max-h-[calc(100vh-160px)]"
          style={{ ...glassPanel, borderRadius: '1.25rem', transformOrigin: 'bottom right', animation: 'glassPopIn 0.25s cubic-bezier(0.34,1.4,0.64,1)' }}
        >
          {/* Chat header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(14,138,110,0.18)',
            borderRadius: '1.25rem 1.25rem 0 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(77,219,184,0.2)', border: '1px solid rgba(77,219,184,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaComments size={16} color="#4ddbb8" />
                </div>
                <span style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: '#4ade80', border: '2px solid rgba(11,37,69,0.9)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 1 }}>মেসেজ করুন</h3>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Typically replies in 5 minutes</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}
              style={{ width: 30, height: 30, borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}
              aria-label="Close chat">
              <FaTimes size={13} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '78%', padding: '9px 13px', borderRadius: msg.type === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.type === 'user'
                    ? 'rgba(14,138,110,0.35)'
                    : 'rgba(255,255,255,0.10)',
                  border: msg.type === 'user'
                    ? '1px solid rgba(77,219,184,0.25)'
                    : '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: msg.type === 'user' ? '#fff' : 'rgba(255,255,255,0.85)', margin: 0 }}>{msg.text}</p>
                  <span style={{ fontSize: 10, marginTop: 4, display: 'block', color: 'rgba(255,255,255,0.35)' }}>{msg.time}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} style={{
            padding: '12px 14px', flexShrink: 0,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '0 0 1.25rem 1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type your message..."
                style={{
                  flex: 1, padding: '9px 13px', borderRadius: 10, fontSize: 13, outline: 'none',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: '#fff',
                }}
              />
              <button type="submit" disabled={!message.trim()}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: message.trim() ? 'rgba(14,138,110,0.5)' : 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(77,219,184,0.25)',
                  color: message.trim() ? '#4ddbb8' : 'rgba(255,255,255,0.25)',
                  transition: 'all 0.2s',
                }}
                aria-label="Send message">
                <FaPaperPlane size={13} />
              </button>
            </div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 8, textAlign: 'center' }}>
              Powered by <span style={{ fontWeight: 600 }}>REVE Chat</span>
            </p>
          </form>
        </div>
      )}

      {/* Mobile backdrop */}
      {(isOpen || showContactOptions) && (
        <div
          className="fixed inset-0 z-[1049] md:hidden"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={() => { setIsOpen(false); setShowContactOptions(false); }}
          aria-hidden="true"
        />
      )}
    </>
  );
}
