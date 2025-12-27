'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

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

interface ChatWindowProps {
  messages: Message[];
  otherUser: {
    _id: string;
    fullName: string;
    username: string;
    isOnline: boolean;
    lastSeen?: Date;
  } | null;
  isTyping: boolean;
  onSendMessage: (content: string) => void;
  onTyping: () => void;
  onStopTyping: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  otherUser,
  isTyping,
  onSendMessage,
  onTyping,
  onStopTyping,
}) => {
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    // Trigger typing indicator
    onTyping();
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    
    onSendMessage(messageInput.trim());
    setMessageInput('');
    onStopTyping();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Hôm qua ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'dd/MM/yyyy HH:mm');
    }
  };

  if (!otherUser) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center p-8">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Chào mừng đến với V-Check Chat
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Chọn một cuộc trò chuyện từ danh sách bên trái hoặc tìm kiếm người dùng để bắt đầu nhắn tin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 bg-white shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {otherUser.fullName.charAt(0).toUpperCase()}
            </div>
            {otherUser.isOnline && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{otherUser.fullName}</h2>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              {otherUser.isOnline ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                  <span className="text-green-600 font-medium">Đang hoạt động</span>
                </>
              ) : (
                otherUser.lastSeen && (
                  <span>
                    Hoạt động {format(new Date(otherUser.lastSeen), 'HH:mm dd/MM', { locale: vi })}
                  </span>
                )
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
        {messages.map((message, index) => {
          const isOwn = message.sender._id === (user?._id || user?.id);
          const isLastFromUser = index > 0 && messages[index - 1].sender._id === message.sender._id;
          const showAvatar = !isOwn && (!isLastFromUser || index === 0);

          return (
            <div
              key={message._id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
            >
              <div className={`flex max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                {/* Avatar for received messages */}
                {!isOwn && (
                  <div className="w-8 flex-shrink-0">
                    {showAvatar ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-bold">
                        {message.sender.fullName.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-8" />
                    )}
                  </div>
                )}

                <div
                  className={`px-5 py-3 shadow-sm relative ${
                    isOwn
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                      : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'
                  }`}
                >
                  <p className="break-words leading-relaxed text-[15px]">{message.content}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                    isOwn ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    <span>{formatMessageTime(new Date(message.timestamp))}</span>
                    {isOwn && (
                      <span className="ml-1">
                        {message.status === 'read' && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                          </svg>
                        )}
                        {message.status !== 'read' && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-4xl mx-auto">
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Gửi ảnh (Chưa hỗ trợ)"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              placeholder="Nhập tin nhắn..."
              className="w-full pl-5 pr-12 py-3 bg-gray-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
            />
            <button
              type="submit"
              disabled={!messageInput.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <svg className="w-5 h-5 transform rotate-90 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
