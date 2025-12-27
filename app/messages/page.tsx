'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/lib/config';
import { ConversationList } from '@/components/ConversationList';
import { ChatWindow } from '@/components/ChatWindow';
import { UserSearch } from '@/components/UserSearch';

interface Message {
  _id: string;
  sender: {
    _id: string;
    username: string;
    fullName: string;
  };
  receiver: {
    _id: string;
    username: string;
    fullName: string;
  };
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  readAt?: Date;
}

interface Conversation {
  userId: string;
  username: string;
  fullName: string;
  isOnline: boolean;
  lastSeen: Date;
  lastMessage: {
    content: string;
    timestamp: Date;
    type: string;
    status: string;
    sender: string;
  };
  unreadCount: number;
}

interface OtherUser {
  _id: string;
  fullName: string;
  username: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export default function MessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    connected,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    onMessageReceive,
    onMessageSent,
    onTyping,
    onUserOnline,
    onUserOffline,
  } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supervisorId, setSupervisorId] = useState<string | null>(null);

  // Load supervisor for officer
  useEffect(() => {
    if (user?.role === 'officer' && user.officeId) {
      loadSupervisor();
    }
  }, [user]);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  // Setup socket listeners
  useEffect(() => {
    if (!connected) return;

    const cleanup1 = onMessageReceive((message: Message) => {
      // Update messages if conversation is open
      if (
        selectedUserId === message.sender._id ||
        selectedUserId === message.receiver._id
      ) {
        setMessages((prev) => [...prev, message]);
        
        // Mark as read if conversation is open
        if (selectedUserId === message.sender._id) {
          markAsRead(message._id);
        }
      }
      
      // Update conversations list
      loadConversations();
    });

    const cleanup2 = onMessageSent((message: Message) => {
      setMessages((prev) => [...prev, message]);
      loadConversations();
    });

    const cleanup3 = onTyping((data: { userId: string; isTyping: boolean }) => {
      if (selectedUserId === data.userId) {
        setIsTyping(data.isTyping);
      }
    });

    const cleanup4 = onUserOnline((data: { userId: string }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.userId === data.userId ? { ...conv, isOnline: true } : conv
        )
      );
      
      if (selectedUserId === data.userId && otherUser) {
        setOtherUser({ ...otherUser, isOnline: true });
      }
    });

    const cleanup5 = onUserOffline((data: { userId: string; lastSeen: Date }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.userId === data.userId
            ? { ...conv, isOnline: false, lastSeen: data.lastSeen }
            : conv
        )
      );
      
      if (selectedUserId === data.userId && otherUser) {
        setOtherUser({ ...otherUser, isOnline: false, lastSeen: data.lastSeen });
      }
    });

    return () => {
      cleanup1?.();
      cleanup2?.();
      cleanup3?.();
      cleanup4?.();
      cleanup5?.();
    };
  }, [connected, selectedUserId, otherUser]);

  const loadSupervisor = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${config.backendUrl}/api/users/supervisor`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const supervisor = data.supervisor;
        
        if (supervisor) {
          setSupervisorId(supervisor._id);
          setOtherUser({
            _id: supervisor._id,
            fullName: supervisor.fullName,
            username: supervisor.username,
            isOnline: supervisor.isOnline,
            lastSeen: supervisor.lastSeen,
          });
          setSelectedUserId(supervisor._id);
          loadMessages(supervisor._id);
        }
      } else {
        console.error('No supervisor found');
      }
    } catch (error) {
      console.error('Load supervisor error:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${config.backendUrl}/api/messages/conversations`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Load conversations error:', error);
    }
  };

  const loadMessages = async (userId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${config.backendUrl}/api/messages?userId=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        
        // Mark unread messages as read
        data.messages.forEach((msg: Message) => {
          if (msg.receiver._id === user?._id && msg.status !== 'read') {
            markAsRead(msg._id);
          }
        });
      }
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (userId: string) => {
    setSelectedUserId(userId);
    setIsTyping(false);
    
    // Find user info from conversations
    const conversation = conversations.find((c) => c.userId === userId);
    if (conversation) {
      setOtherUser({
        _id: conversation.userId,
        fullName: conversation.fullName,
        username: conversation.username,
        isOnline: conversation.isOnline,
        lastSeen: conversation.lastSeen,
      });
    }
    
    loadMessages(userId);
  };

  const handleSelectUser = async (userId: string) => {
    setSelectedUserId(userId);
    setIsTyping(false);
    setMessages([]);
    
    // Load user info
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${config.backendUrl}/api/users/search?q=`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const foundUser = data.users.find((u: any) => u._id === userId);
        if (foundUser) {
          setOtherUser({
            _id: foundUser._id,
            fullName: foundUser.fullName,
            username: foundUser.username,
            isOnline: foundUser.isOnline,
            lastSeen: foundUser.lastSeen,
          });
        }
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
    
    loadMessages(userId);
  };

  const handleSendMessage = (content: string) => {
    if (!selectedUserId) return;
    sendMessage(selectedUserId, content);
  };

  const handleTyping = () => {
    if (!selectedUserId) return;
    startTyping(selectedUserId);
  };

  const handleStopTyping = () => {
    if (!selectedUserId) return;
    stopTyping(selectedUserId);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500">Vui lòng đăng nhập để sử dụng tính năng nhắn tin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-sm z-20">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {user.role === 'officer' ? 'Phản hồi' : 'Tin nhắn'}
            </h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Về Dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>
          
          {/* Only show UserSearch for supervisor and admin */}
          {(user.role === 'supervisor' || user.role === 'admin') && (
            <UserSearch onSelectUser={handleSelectUser} />
          )}
          
          {user.role === 'officer' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium">💬 Chat với cấp trên</p>
              <p className="text-xs mt-1 text-blue-600">
                Bạn đang kết nối với giám sát viên của trụ sở
              </p>
            </div>
          )}
          
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className={`flex items-center gap-2 ${connected ? 'text-green-600' : 'text-red-600'}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-600' : 'bg-red-600'}`}></span>
              {connected ? 'Đã kết nối' : 'Mất kết nối'}
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              selectedUserId={selectedUserId}
              onSelectConversation={handleSelectConversation}
            />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Đang tải...</div>
            </div>
          ) : (
            <ChatWindow
              messages={messages}
              otherUser={otherUser}
              isTyping={isTyping}
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              onStopTyping={handleStopTyping}
            />
          )}
      </div>
    </div>
  );
}
