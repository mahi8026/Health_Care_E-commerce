'use client';

import { useState, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaFacebookMessenger, FaWhatsapp } from 'react-icons/fa';

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'আসসালামু আলাইকুম, MedCore BD তে স্বাগতম!',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 2,
      type: 'bot',
      text: 'আপনাকে কিভাবে সাহায্য করতে পারি?',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // WhatsApp number (format: country code + number without + or spaces)
  const whatsappNumber = '8801800000000'; // Replace with actual MedCore BD WhatsApp number
  const facebookPageId = 'medcorebd'; // Replace with actual Facebook page username

  // Lock body scroll when chat is open
  useEffect(() => {
    if (isOpen || showContactOptions) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, showContactOptions]);

  const handleOpenLiveChat = () => {
    setShowContactOptions(false);
    setIsOpen(true);
  };

  const handleOpenWhatsApp = () => {
    const message = encodeURIComponent('Hello, I need help with medical equipment.');
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    setShowContactOptions(false);
  };

  const handleOpenMessenger = () => {
    window.open(`https://m.me/${facebookPageId}`, '_blank');
    setShowContactOptions(false);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      type: 'user',
      text: message,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setMessage('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        text: 'ধন্যবাদ আপনার বার্তার জন্য। আমাদের মেডিকেল ইকুইপমেন্ট বিশেষজ্ঞ শীঘ্রই আপনার সাথে যোগাযোগ করবেন।',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  return (
    <>
      {/* Main Chat Button */}
      <button
        onClick={() => setShowContactOptions(!showContactOptions)}
        className={`fixed bottom-6 right-6 z-[950] bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] hover:from-[#FF5722] hover:to-[#FF7B2E] text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 ${
          isOpen || showContactOptions ? 'scale-0' : 'scale-100'
        }`}
        aria-label="Open contact options"
      >
        <div className="w-16 h-16 flex items-center justify-center relative">
          <FaComments size={28} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse" />
        </div>
      </button>

      {/* Contact Options Modal */}
      {showContactOptions && (
        <div
          className="fixed bottom-6 right-6 z-[1001] w-[90vw] max-w-[420px] bg-white rounded-3xl shadow-2xl transition-all duration-300 animate-scale-in"
          style={{ transformOrigin: 'bottom right' }}
        >
          <style jsx>{`
            @keyframes scale-in {
              from {
                transform: scale(0);
                opacity: 0;
              }
              to {
                transform: scale(1);
                opacity: 1;
              }
            }
            .animate-scale-in {
              animation: scale-in 0.3s ease-out;
            }
          `}</style>

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[20px] font-bold text-gray-900 mb-1 flex items-center gap-2">
                  Hi there! 👋
                </h3>
                <p className="text-[14px] text-gray-600 leading-relaxed">
                  Let us know if we can help you with anything at all.
                </p>
              </div>
              <button
                onClick={() => setShowContactOptions(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <FaTimes size={16} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Contact Options */}
          <div className="p-4 space-y-3">
            {/* LiveChat Button */}
            <button
              onClick={handleOpenLiveChat}
              className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] hover:from-[#FF5722] hover:to-[#FF7B2E] text-white rounded-2xl transition-all duration-200 hover:scale-[1.02] shadow-md hover:shadow-lg"
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FaComments size={20} />
              </div>
              <span className="text-[16px] font-semibold">LiveChat</span>
            </button>

            {/* Messenger Button */}
            <button
              onClick={handleOpenMessenger}
              className="w-full flex items-center gap-4 px-5 py-4 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-2xl transition-all duration-200 hover:scale-[1.02] hover:border-[#0084FF]"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#0084FF] to-[#00C6FF] rounded-full flex items-center justify-center flex-shrink-0">
                <FaFacebookMessenger size={20} className="text-white" />
              </div>
              <span className="text-[16px] font-semibold text-gray-900">Messenger</span>
            </button>

            {/* WhatsApp Button */}
            <button
              onClick={handleOpenWhatsApp}
              className="w-full flex items-center gap-4 px-5 py-4 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-2xl transition-all duration-200 hover:scale-[1.02] hover:border-[#25D366]"
            >
              <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0">
                <FaWhatsapp size={22} className="text-white" />
              </div>
              <span className="text-[16px] font-semibold text-gray-900">WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-[1001] w-[90vw] max-w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-300 animate-scale-in"
          style={{ transformOrigin: 'bottom right' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <FaComments size={18} />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold">মেসেজ করুন</h3>
                <p className="text-[11px] opacity-90">Typically replies in 5 minutes</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close chat"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.type === 'user'
                      ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white rounded-br-sm'
                      : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                  }`}
                >
                  <p className="text-[13px] leading-relaxed">{msg.text}</p>
                  <span
                    className={`text-[10px] mt-1 block ${
                      msg.type === 'user' ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-[13px] outline-none focus:ring-2 focus:ring-[#FF6B35] transition-all"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="w-10 h-10 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] hover:from-[#FF5722] hover:to-[#FF7B2E] text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-label="Send message"
              >
                <FaPaperPlane size={14} />
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 text-center">
              Powered by <span className="font-semibold">REVE Chat</span>
            </p>
          </form>
        </div>
      )}

      {/* Backdrop for mobile */}
      {(isOpen || showContactOptions) && (
        <div
          className="fixed inset-0 bg-black/30 z-[1000] md:hidden"
          onClick={() => {
            setIsOpen(false);
            setShowContactOptions(false);
          }}
          aria-hidden="true"
        />
      )}
    </>
  );
}
