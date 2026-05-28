'use client';

import { useState, useRef } from 'react';
import { FaPaperPlane, FaPaperclip, FaTimes } from 'react-icons/fa';

export default function ChatInput({ onSendMessage, onTyping, disabled = false }) {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Trigger typing indicator
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      onTyping?.(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping?.(false);
    }, 1000);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!message.trim() && !file) return;

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      onTyping?.(false);
    }

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send message
    onSendMessage({
      content: message.trim(),
      file,
      messageType: file ? 'file' : 'text'
    });

    // Reset form
    setMessage('');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-white">
      {file && (
        <div className="mb-2 flex items-center justify-between bg-blue-50 p-2 rounded">
          <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            <FaTimes />
          </button>
        </div>
      )}
      <div className="flex items-center space-x-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="p-2 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
          aria-label="Attach file"
        >
          <FaPaperclip className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          placeholder="Type your message..."
          disabled={disabled}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={disabled || (!message.trim() && !file)}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <FaPaperPlane className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
