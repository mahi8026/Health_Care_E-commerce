'use client';

export default function ChatTypingIndicator({ userName = 'Agent' }) {
  return (
    <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg max-w-fit">
      <span className="text-sm text-gray-600">{userName} is typing</span>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}
