'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

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

interface ConversationListProps {
  conversations: Conversation[];
  selectedUserId: string | null;
  onSelectConversation: (userId: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedUserId,
  onSelectConversation,
}) => {
  return (
    <div className="w-full h-full overflow-y-auto bg-white">
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="font-medium">Chưa có cuộc trò chuyện nào</p>
          <p className="text-sm mt-1">Tìm kiếm người dùng để bắt đầu</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {conversations.map((conversation) => {
            const isSelected = selectedUserId === conversation.userId;
            return (
              <button
                key={conversation.userId}
                onClick={() => onSelectConversation(conversation.userId)}
                className={`w-full p-4 transition-all duration-200 text-left hover:bg-gray-50 ${
                  isSelected ? 'bg-blue-50 border-l-4 border-blue-500 pl-[1.25rem]' : 'pl-4 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {conversation.fullName.charAt(0).toUpperCase()}
                    </div>
                    {conversation.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white ring-1 ring-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-semibold truncate text-[15px] ${
                        isSelected ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {conversation.fullName}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate pr-2 ${
                        conversation.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'
                      }`}>
                        {conversation.lastMessage.sender === conversation.userId ? '' : 'Bạn: '}
                        {conversation.lastMessage.type === 'image' && '📷 Hình ảnh'}
                        {conversation.lastMessage.type === 'file' && '📎 Tệp đính kèm'}
                        {conversation.lastMessage.type === 'text' && conversation.lastMessage.content}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 shadow-sm min-w-[1.25rem] text-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
