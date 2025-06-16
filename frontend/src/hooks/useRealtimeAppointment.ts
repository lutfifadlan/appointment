import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AppointmentLock } from '@/lib/types/appointment';

interface CursorPosition {
  x: number;
  y: number;
}

interface UserCursor {
  userId: string;
  position: CursorPosition;
  userInfo: {
    name: string;
    email: string;
  };
  color: string;
  lastSeen: number;
}



interface RealtimeAppointmentState {
  isConnected: boolean;
  currentLock: AppointmentLock | null;
  userCursors: Map<string, UserCursor>;
  lockLoading: boolean;
  lockError: string | null;
}

interface RealtimeAppointmentActions {
  subscribeToAppointment: (appointmentId: string) => void;
  unsubscribeFromAppointment: (appointmentId: string) => void;
  updateCursorPosition: (appointmentId: string, userId: string, position: CursorPosition) => void;
  acquireLock: (appointmentId: string, userId: string, userInfo: { name: string; email: string }) => Promise<boolean>;
  releaseLock: (appointmentId: string, userId: string) => Promise<boolean>;
  forceReleaseLock: (appointmentId: string, adminId: string) => Promise<boolean>;
}

export const useRealtimeAppointment = (
  appointmentId: string,
  userId: string,
  userInfo: { name: string; email: string } // eslint-disable-line @typescript-eslint/no-unused-vars
): RealtimeAppointmentState & RealtimeAppointmentActions => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentLock, setCurrentLock] = useState<AppointmentLock | null>(null);
  const [userCursors, setUserCursors] = useState<Map<string, UserCursor>>(new Map());
  const [lockLoading, setLockLoading] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const cursorUpdateTimeout = useRef<NodeJS.Timeout | null>(null);

  // Color palette for user cursors
  const getUserColor = useCallback((userId: string): string => {
    const colors = [
      '#0ea5e9', '#737373', '#14b8a6', '#22c55e', 
      '#3b82f6', '#ef4444', '#eab308', '#8b5cf6'
    ];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  }, []);

  // Fetch initial lock status
  const fetchInitialLockStatus = useCallback(async () => {
    if (!appointmentId) return;
    
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/lock-status`);
      if (response.ok) {
        const data = await response.json();
        if (data.lock) {
          console.log('📄 Initial lock status:', data.lock);
          setCurrentLock(data.lock);
        } else {
          setCurrentLock(null);
        }
        setLockError(null);
      }
    } catch (error) {
      console.error('Failed to fetch initial lock status:', error);
      setLockError('Failed to fetch lock status');
    }
  }, [appointmentId]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!appointmentId) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8088';
    
    try {
      socketRef.current = io(wsUrl, {
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 5000,
      });

      const socket = socketRef.current;

      // Connection events
      socket.on('connect', () => {
        console.log('🔌 Connected to WebSocket server');
        setIsConnected(true);
        setLockError(null);
        
        // Auto-subscribe to current appointment
        socket.emit('subscribe', appointmentId);
        
        // Fetch initial lock status
        fetchInitialLockStatus();
      });

      socket.on('connect_error', (error) => {
        console.warn('🔌 Socket connection error:', error);
        setIsConnected(false);
        setLockError('Connection failed. Retrying...');
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from WebSocket server:', reason);
        setIsConnected(false);
        setUserCursors(new Map()); // Clear cursors on disconnect
      });

      // Lock events
      socket.on('lock-acquired', (data: { appointmentId: string; lock: AppointmentLock }) => {
        if (data.appointmentId === appointmentId) {
          console.log('🔒 Lock acquired:', data.lock);
          setCurrentLock(data.lock);
          setLockError(null);
        }
      });

      socket.on('lock-released', (data: { appointmentId: string }) => {
        if (data.appointmentId === appointmentId) {
          console.log('🔓 Lock released');
          setCurrentLock(null);
          setLockError(null);
        }
      });

      socket.on('lock-update', (data: { appointmentId: string; lock: AppointmentLock | null }) => {
        if (data.appointmentId === appointmentId) {
          console.log('🔄 Lock updated:', data.lock);
          setCurrentLock(data.lock);
          setLockError(null);
        }
      });

      socket.on('admin-takeover', (data: { appointmentId: string; adminId: string; adminInfo: { name: string; email: string } }) => {
        if (data.appointmentId === appointmentId) {
          console.log('👑 Admin takeover by:', data.adminInfo.name);
          setCurrentLock(null);
          setLockError(`Admin ${data.adminInfo.name} has taken control of this appointment`);
        }
      });

      // Cursor events
      socket.on('cursor-update', (data: { userId: string; position: CursorPosition }) => {
        if (data.userId !== userId) { // Don't show own cursor
          setUserCursors(prev => {
            const newCursors = new Map(prev);
            const existingCursor = newCursors.get(data.userId);
            
            newCursors.set(data.userId, {
              userId: data.userId,
              position: data.position,
              userInfo: existingCursor?.userInfo || { name: 'Unknown User', email: '' },
              color: existingCursor?.color || getUserColor(data.userId),
              lastSeen: Date.now(),
            });
            
            return newCursors;
          });
        }
      });

      // Cleanup cursors for inactive users
      const cleanupInterval = setInterval(() => {
        const now = Date.now();
        setUserCursors(prev => {
          const newCursors = new Map(prev);
          for (const [userId, cursor] of newCursors) {
            if (now - cursor.lastSeen > 10000) { // Remove after 10 seconds of inactivity
              newCursors.delete(userId);
            }
          }
          return newCursors;
        });
      }, 5000);

      return () => {
        clearInterval(cleanupInterval);
        if (cursorUpdateTimeout.current) {
          clearTimeout(cursorUpdateTimeout.current);
        }
        socket.disconnect();
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setLockError('Failed to connect to real-time server');
    }
  }, [appointmentId, userId, getUserColor, fetchInitialLockStatus]);

  // Subscribe to appointment updates
  const subscribeToAppointment = useCallback((appointmentId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe', appointmentId);
    }
  }, []);

  // Unsubscribe from appointment updates
  const unsubscribeFromAppointment = useCallback((appointmentId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe', appointmentId);
    }
  }, []);

  // Update cursor position with throttling
  const updateCursorPosition = useCallback((appointmentId: string, userId: string, position: CursorPosition) => {
    if (!socketRef.current?.connected) return;

    // Throttle cursor updates to avoid overwhelming the server
    if (cursorUpdateTimeout.current) {
      clearTimeout(cursorUpdateTimeout.current);
    }

    cursorUpdateTimeout.current = setTimeout(() => {
      socketRef.current?.emit('cursor-position', {
        appointmentId,
        userId,
        position
      });
    }, 50); // Update every 50ms
  }, []);

  // Acquire lock with loading state
  const acquireLock = useCallback(async (
    appointmentId: string, 
    userId: string, 
    userInfo: { name: string; email: string }
  ): Promise<boolean> => {
    setLockLoading(true);
    setLockError(null);

    try {
      const response = await fetch(`/api/appointments/${appointmentId}/acquire-lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userInfo,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentLock(data.lock);
        return true;
      } else {
        setLockError(data.message);
        return false;
      }
    } catch (error) {
      console.error('Error acquiring lock:', error);
      setLockError('Failed to acquire lock');
      return false;
    } finally {
      setLockLoading(false);
    }
  }, []);

  // Release lock with loading state
  const releaseLock = useCallback(async (appointmentId: string, userId: string): Promise<boolean> => {
    setLockLoading(true);
    setLockError(null);

    try {
      const response = await fetch(`/api/appointments/${appointmentId}/release-lock`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentLock(null);
        return true;
      } else {
        setLockError(data.message);
        return false;
      }
    } catch (error) {
      console.error('Error releasing lock:', error);
      setLockError('Failed to release lock');
      return false;
    } finally {
      setLockLoading(false);
    }
  }, []);

  // Force release lock (admin only)
  const forceReleaseLock = useCallback(async (appointmentId: string, adminId: string): Promise<boolean> => {
    setLockLoading(true);
    setLockError(null);

    try {
      const response = await fetch(`/api/appointments/${appointmentId}/force-release-lock`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentLock(null);
        return true;
      } else {
        setLockError(data.message);
        return false;
      }
    } catch (error) {
      console.error('Error force releasing lock:', error);
      setLockError('Failed to force release lock');
      return false;
    } finally {
      setLockLoading(false);
    }
  }, []);

  return {
    // State
    isConnected,
    currentLock,
    userCursors,
    lockLoading,
    lockError,
    
    // Actions
    subscribeToAppointment,
    unsubscribeFromAppointment,
    updateCursorPosition,
    acquireLock,
    releaseLock,
    forceReleaseLock,
  };
}; 