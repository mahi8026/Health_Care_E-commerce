'use client';

import { useState, useEffect } from 'react';
import { FaComments, FaClock, FaCheckCircle } from 'react-icons/fa';
import AgentStatusSelector from './AgentStatusSelector';
import ConversationList from './ConversationList';
import ConversationPanel from './ConversationPanel';
import chatSocketClient from '@/services/chatSocketClient';
import { useAuth } from '@/context/AuthContext';

export default function ChatDashboard() {
  const { user, token } = useAuth();
  const [agentStatus, setAgentStatus] = useState('online');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [stats, setStats] = useState({
    active: 0,
    waiting: 0,
    closed: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    chatSocketClient.connect(token);

    // Set initial agent status
    chatSocketClient.updateAgentStatus('online');

    // Register event listeners
    const handleNewAssignment = (data) => {
      // Add new conversation to list
      setConversations((prev) => [data.conversation, ...prev]);
      fetchStats();
    };

    const handleConversationClosed = (data) => {
      // Update conversation status
      setConversations((prev) =>
        prev.map((conv) =>
          conv.conversationId === data.conversationId
            ? { ...conv, status: 'closed', closedAt: data.closedAt }
            : conv
        )
      );
      fetchStats();
    };

    chatSocketClient.on('chat:new:assignment', handleNewAssignment);
    chatSocketClient.on('chat:conversation:closed', handleConversationClosed);

    // Fetch initial data
    fetchConversations();
    fetchStats();

    return () => {
      chatSocketClient.off('chat:new:assignment', handleNewAssignment);
      chatSocketClient.off('chat:conversation:closed', handleConversationClosed);
      chatSocketClient.updateAgentStatus('offline');
    };
  }, [token]);

  const fetchConversations = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations?status=active,waiting`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/analytics/overview`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats({
        active: data.data.activeConversations || 0,
        waiting: data.data.waitingConversations || 0,
        closed: data.data.closedToday || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusChange = (newStatus) => {
    setAgentStatus(newStatus);
    chatSocketClient.updateAgentStatus(newStatus);
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleClosePanel = () => {
    setSelectedConversation(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Live Chat Dashboard</h1>
          <AgentStatusSelector
            currentStatus={agentStatus}
            onChange={handleStatusChange}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <FaComments className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <FaClock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.waiting}</p>
                <p className="text-sm text-gray-600">Waiting</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <FaCheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.closed}</p>
                <p className="text-sm text-gray-600">Closed Today</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation?.conversationId}
            onSelect={handleSelectConversation}
          />
        </div>

        {/* Conversation Panel */}
        <div className="flex-1 bg-gray-50">
          <ConversationPanel
            conversation={selectedConversation}
            onClose={handleClosePanel}
            currentUserId={user?._id}
          />
        </div>
      </div>
    </div>
  );
}
