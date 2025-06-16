"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface LockState {
  isLocked: boolean;
  lockedBy: string | null;
  lockExpiresAt: number | null;
}

interface WebSocketContextType {
  socket: Socket | null;
  lockState: LockState;
  acquireLock: (appointmentId: string) => Promise<void>;
  releaseLock: (appointmentId: string) => Promise<void>;
  requestTakeover: (appointmentId: string) => Promise<void>;
  forceTakeover: (appointmentId: string, userId: string, userInfo: { name: string; email: string }) => Promise<void>;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lockState, setLockState] = useState<LockState>({
    isLocked: false,
    lockedBy: null,
    lockExpiresAt: null,
  });

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8088';
    const socketInstance = io(wsUrl, {
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socketInstance.on('lockStateChanged', (newState: LockState) => {
      setLockState(newState);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const acquireLock = async (appointmentId: string): Promise<void> => {
    if (!socket) return;
    return new Promise((resolve, reject) => {
      socket.emit('acquireLock', { appointmentId }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const releaseLock = async (appointmentId: string): Promise<void> => {
    if (!socket) return;
    return new Promise((resolve, reject) => {
      socket.emit('releaseLock', { appointmentId }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const requestTakeover = async (appointmentId: string): Promise<void> => {
    if (!socket) return;
    return new Promise((resolve, reject) => {
      socket.emit('requestTakeover', { appointmentId }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const forceTakeover = async (appointmentId: string, userId: string, userInfo: { name: string; email: string }): Promise<void> => {
    if (!socket) {
      console.log('❌ No socket connection for forceTakeover');
      return;
    }
    console.log('🚀 Sending forceTakeover:', { appointmentId, userId, userInfo });
    return new Promise((resolve, reject) => {
      socket.emit('forceTakeover', { appointmentId, userId, userInfo }, (response: { success: boolean; error?: string }) => {
        console.log('📨 forceTakeover response:', response);
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const contextValue: WebSocketContextType = {
    socket,
    lockState,
    acquireLock,
    releaseLock,
    requestTakeover,
    forceTakeover,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}; 