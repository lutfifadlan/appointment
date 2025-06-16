import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only initialize socket if we're not in a test environment
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    try {
      // Initialize socket connection
      socketRef.current = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
        withCredentials: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 5000,
      });

      socketRef.current.on('connect', () => {
        setIsConnected(true);
      });

      socketRef.current.on('connect_error', (error) => {
        console.warn('Socket connection error:', error);
        setIsConnected(false);
      });

      socketRef.current.on('disconnect', () => {
        setIsConnected(false);
      });

      // Cleanup on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    } catch (error) {
      console.warn('Failed to initialize socket:', error);
      setIsConnected(false);
    }
  }, []);

  return {
    socket: isConnected ? socketRef.current : null,
    isConnected,
  };
}; 