'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { config } from '@/lib/config';

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
  attachmentUrl?: string;
}

interface TypingUser {
  userId: string;
  isTyping: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  sendMessage: (receiverId: string, content: string, type?: 'text' | 'image' | 'file') => void;
  startTyping: (receiverId: string) => void;
  stopTyping: (receiverId: string) => void;
  markAsRead: (messageId: string) => void;
  onMessageReceive: (callback: (message: Message) => void) => (() => void) | undefined;
  onMessageSent: (callback: (message: Message) => void) => (() => void) | undefined;
  onTyping: (callback: (data: TypingUser) => void) => (() => void) | undefined;
  onUserOnline: (callback: (data: { userId: string }) => void) => (() => void) | undefined;
  onUserOffline: (callback: (data: { userId: string; lastSeen: Date }) => void) => (() => void) | undefined;
  onMessageRead: (callback: (data: { messageId: string; readAt: Date }) => void) => (() => void) | undefined;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const BACKEND_URL = config.backendUrl;
    
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      // Authenticate the socket connection
      newSocket.emit('authenticate', user._id || user.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  const sendMessage = useCallback((
    receiverId: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text'
  ) => {
    if (!socket || !user) return;
    
    socket.emit('message:send', {
      senderId: user._id || user.id,
      receiverId,
      content,
      type,
    });
  }, [socket, user]);

  const startTyping = useCallback((receiverId: string) => {
    if (!socket || !user) return;
    socket.emit('typing:start', { senderId: user._id || user.id, receiverId });
  }, [socket, user]);

  const stopTyping = useCallback((receiverId: string) => {
    if (!socket || !user) return;
    socket.emit('typing:stop', { senderId: user._id || user.id, receiverId });
  }, [socket, user]);

  const markAsRead = useCallback((messageId: string) => {
    if (!socket || !user) return;
    socket.emit('message:read', { messageId, userId: user._id || user.id });
  }, [socket, user]);

  const onMessageReceive = useCallback((callback: (message: Message) => void) => {
    if (!socket) return;
    socket.on('message:receive', callback);
    return () => {
      socket.off('message:receive', callback);
    };
  }, [socket]);

  const onMessageSent = useCallback((callback: (message: Message) => void) => {
    if (!socket) return;
    socket.on('message:sent', callback);
    return () => {
      socket.off('message:sent', callback);
    };
  }, [socket]);

  const onTyping = useCallback((callback: (data: TypingUser) => void) => {
    if (!socket) return;
    socket.on('typing:user', callback);
    return () => {
      socket.off('typing:user', callback);
    };
  }, [socket]);

  const onUserOnline = useCallback((callback: (data: { userId: string }) => void) => {
    if (!socket) return;
    socket.on('user:online', callback);
    return () => {
      socket.off('user:online', callback);
    };
  }, [socket]);

  const onUserOffline = useCallback((callback: (data: { userId: string; lastSeen: Date }) => void) => {
    if (!socket) return;
    socket.on('user:offline', callback);
    return () => {
      socket.off('user:offline', callback);
    };
  }, [socket]);

  const onMessageRead = useCallback((callback: (data: { messageId: string; readAt: Date }) => void) => {
    if (!socket) return;
    socket.on('message:read', callback);
    return () => {
      socket.off('message:read', callback);
    };
  }, [socket]);

  const value: SocketContextType = {
    socket,
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
    onMessageRead,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
