import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { AppointmentLock } from '../types/appointment';

// API base URL - should be configured based on environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088/api';

interface LockContextType {
  isLocked: boolean;
  isCurrentUserLockOwner: boolean;
  currentLock: AppointmentLock | null;
  lockLoading: boolean;
  lockError: string | null;
  acquireLock: (appointmentId: string, userId: string, userInfo: { name: string; email: string }) => Promise<boolean>;
  releaseLock: (appointmentId: string, userId: string) => Promise<boolean>;
  forceReleaseLock: (appointmentId: string, adminId: string) => Promise<boolean>;
  updateUserPosition: (appointmentId: string, userId: string, position: { x: number; y: number }) => Promise<void>;
  userCursors: Record<string, { position: { x: number; y: number }; userInfo: { name: string; email: string } }>;
}

const LockContext = createContext<LockContextType | undefined>(undefined);

export const useLock = () => {
  const context = useContext(LockContext);
  if (!context) {
    throw new Error('useLock must be used within a LockProvider');
  }
  return context;
};

interface LockProviderProps {
  children: ReactNode;
  appointmentId?: string;
  userId?: string;
}

export const LockProvider: React.FC<LockProviderProps> = ({ 
  children, 
  appointmentId,
  userId 
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [currentLock, setCurrentLock] = useState<AppointmentLock | null>(null);
  const [isCurrentUserLockOwner, setIsCurrentUserLockOwner] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [userCursors, setUserCursors] = useState<Record<string, { position: { x: number; y: number }; userInfo: { name: string; email: string } }>>({});

  // Initialize WebSocket connection
  useEffect(() => {
    if (!appointmentId) return;

    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      newSocket.emit('subscribe', appointmentId);
    });

    // Listen for lock updates
    newSocket.on('lock-update', (data: { appointmentId: string; lock: AppointmentLock | null }) => {
      if (data.appointmentId === appointmentId) {
        setCurrentLock(data.lock);
        setIsLocked(!!data.lock);
        if (data.lock && userId) {
          setIsCurrentUserLockOwner(data.lock.userId === userId);
        } else {
          setIsCurrentUserLockOwner(false);
        }
      }
    });

    // Listen for lock acquisition
    newSocket.on('lock-acquired', (data: { appointmentId: string; lock: AppointmentLock }) => {
      if (data.appointmentId === appointmentId) {
        setCurrentLock(data.lock);
        setIsLocked(true);
        if (userId) {
          setIsCurrentUserLockOwner(data.lock.userId === userId);
        }
      }
    });

    // Listen for lock release
    newSocket.on('lock-released', (data: { appointmentId: string }) => {
      if (data.appointmentId === appointmentId) {
        setCurrentLock(null);
        setIsLocked(false);
        setIsCurrentUserLockOwner(false);
      }
    });

    // Listen for admin takeover
    newSocket.on('admin-takeover', (data: { 
      appointmentId: string; 
      adminId: string; 
      adminInfo: { name: string; email: string } 
    }) => {
      if (data.appointmentId === appointmentId) {
        setCurrentLock(null);
        setIsLocked(false);
        setIsCurrentUserLockOwner(false);
        // Show notification about admin takeover
        console.log(`Admin ${data.adminInfo.name} has taken control of this appointment`);
      }
    });

    // Listen for cursor updates
    newSocket.on('cursor-update', (data: { 
      userId: string; 
      position: { x: number; y: number };
      userInfo?: { name: string; email: string };
    }) => {
      if (data.userId !== userId) {
        setUserCursors(prev => ({
          ...prev,
          [data.userId]: {
            position: data.position,
            userInfo: data.userInfo || { name: `User ${data.userId.substring(0, 4)}`, email: '' }
          }
        }));
      }
    });

    // Check initial lock status
    fetchLockStatus(appointmentId);

    return () => {
      if (newSocket) {
        newSocket.emit('unsubscribe', appointmentId);
        newSocket.disconnect();
      }
    };
  }, [appointmentId, userId]);

  // Auto-refresh lock every 4 minutes to prevent expiration (which happens at 5 minutes)
  useEffect(() => {
    if (!isCurrentUserLockOwner || !appointmentId || !userId || !currentLock) return;

    const interval = setInterval(() => {
      // Re-acquire the lock to refresh it
      acquireLock(appointmentId, userId, {
        name: currentLock.userInfo.name,
        email: currentLock.userInfo.email
      });
    }, 4 * 60 * 1000); // 4 minutes

    return () => clearInterval(interval);
  }, [isCurrentUserLockOwner, appointmentId, userId, currentLock]);

  // Release lock on component unmount or tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isCurrentUserLockOwner && appointmentId && userId) {
        // Synchronous API call to release lock before page unload
        navigator.sendBeacon(
          `${API_BASE_URL}/appointments/${appointmentId}/release-lock`,
          JSON.stringify({ userId })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also try to release lock on component unmount
      if (isCurrentUserLockOwner && appointmentId && userId) {
        releaseLock(appointmentId, userId).catch(console.error);
      }
    };
  }, [isCurrentUserLockOwner, appointmentId, userId]);

  const fetchLockStatus = async (appointmentId: string) => {
    try {
      setLockLoading(true);
      setLockError(null);
      
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/lock-status`);
      const data = await response.json();
      
      if (data.lock) {
        setCurrentLock(data.lock);
        setIsLocked(true);
        if (userId) {
          setIsCurrentUserLockOwner(data.lock.userId === userId);
        }
      } else {
        setCurrentLock(null);
        setIsLocked(false);
        setIsCurrentUserLockOwner(false);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching lock status:', error);
      setLockError('Failed to fetch lock status');
      return null;
    } finally {
      setLockLoading(false);
    }
  };

  const acquireLock = async (
    appointmentId: string, 
    userId: string, 
    userInfo: { name: string; email: string }
  ): Promise<boolean> => {
    try {
      setLockLoading(true);
      setLockError(null);
      
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/acquire-lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, userInfo }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentLock(data.lock);
        setIsLocked(true);
        setIsCurrentUserLockOwner(true);
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
  };

  const releaseLock = async (appointmentId: string, userId: string): Promise<boolean> => {
    try {
      setLockLoading(true);
      setLockError(null);
      
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/release-lock`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentLock(null);
        setIsLocked(false);
        setIsCurrentUserLockOwner(false);
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
  };

  const forceReleaseLock = async (appointmentId: string, adminId: string): Promise<boolean> => {
    try {
      setLockLoading(true);
      setLockError(null);
      
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/force-release-lock`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentLock(null);
        setIsLocked(false);
        setIsCurrentUserLockOwner(false);
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
  };

  const updateUserPosition = async (
    appointmentId: string, 
    userId: string, 
    position: { x: number; y: number }
  ): Promise<void> => {
    try {
      // Update position via WebSocket for real-time updates
      if (socket) {
        socket.emit('cursor-position', {
          appointmentId,
          userId,
          position
        });
      }
      
      // Also update via REST API to refresh lock timeout
      await fetch(`${API_BASE_URL}/appointments/${appointmentId}/update-position`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, position }),
      });
    } catch (error) {
      console.error('Error updating position:', error);
    }
  };

  return (
    <LockContext.Provider
      value={{
        isLocked,
        isCurrentUserLockOwner,
        currentLock,
        lockLoading,
        lockError,
        acquireLock,
        releaseLock,
        forceReleaseLock,
        updateUserPosition,
        userCursors
      }}
    >
      {children}
    </LockContext.Provider>
  );
};
