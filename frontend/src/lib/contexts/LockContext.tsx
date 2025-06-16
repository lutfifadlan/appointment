import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { AppointmentLock, LockResponse } from '../types/appointment';

interface LockContextType {
  isLocked: boolean;
  isCurrentUserLockOwner: boolean;
  currentLock: AppointmentLock | null;
  lockLoading: boolean;
  lockError: string | null;
  acquireLock: (appointmentId: string, userId: string, userInfo: { name: string; email: string }, expectedVersion?: number) => Promise<LockResponse>;
  releaseLock: (appointmentId: string, userId: string, expectedVersion?: number) => Promise<LockResponse>;
  forceReleaseLock: (appointmentId: string, adminId: string) => Promise<LockResponse>;
  updateUserPosition: (appointmentId: string, userId: string, position: { x: number; y: number }, expectedVersion?: number) => Promise<LockResponse>;
  userCursors: Record<string, { position: { x: number; y: number }; userInfo: { name: string; email: string } }>;
  currentVersion: number;
  versionConflictCount: number;
  resetVersionConflict: () => void;
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
  disabled?: boolean;
}

export const LockProvider: React.FC<LockProviderProps> = ({ 
  children, 
  appointmentId,
  userId,
  disabled = false
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [currentLock, setCurrentLock] = useState<AppointmentLock | null>(null);
  const [isCurrentUserLockOwner, setIsCurrentUserLockOwner] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [userCursors, setUserCursors] = useState<Record<string, { position: { x: number; y: number }; userInfo: { name: string; email: string } }>>({});
  const [currentVersion, setCurrentVersion] = useState<number>(0);
  const [versionConflictCount, setVersionConflictCount] = useState<number>(0);

  const resetVersionConflict = () => {
    setVersionConflictCount(0);
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (!appointmentId || disabled) return;

    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8088');
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
        if (data.lock) {
          setCurrentVersion(data.lock.version);
          if (userId) {
            setIsCurrentUserLockOwner(data.lock.userId === userId);
          } else {
            setIsCurrentUserLockOwner(false);
          }
        } else {
          setCurrentVersion(0);
          setIsCurrentUserLockOwner(false);
        }
      }
    });

    // Listen for lock acquisition
    newSocket.on('lock-acquired', (data: { appointmentId: string; lock: AppointmentLock }) => {
      if (data.appointmentId === appointmentId) {
        setCurrentLock(data.lock);
        setIsLocked(true);
        setCurrentVersion(data.lock.version);
        if (userId) {
          setIsCurrentUserLockOwner(data.lock.userId === userId);
        }
      }
    });

    // Listen for lock release
    newSocket.on('lock-released', (data: { appointmentId: string; reason?: string; byAdmin?: boolean }) => {
      if (data.appointmentId === appointmentId) {
        console.log('🔓 Lock released:', data.reason || 'User released');
        setCurrentLock(null);
        setIsLocked(false);
        setIsCurrentUserLockOwner(false);
        setCurrentVersion(0);
        resetVersionConflict();

        // Show notification based on the reason for lock release
        if (data.reason === 'expired') {
          console.warn('⏰ Your lock has expired due to inactivity');
        } else if (data.byAdmin) {
          console.warn('👮 Your lock was released by an administrator');
        }
      }
    });

    // Listen for admin takeover
    newSocket.on('admin-takeover', (data: { 
      appointmentId: string; 
      adminId: string; 
      adminInfo: { name: string; email: string } 
    }) => {
      if (data.appointmentId === appointmentId) {
        console.log('👮 Admin takeover by:', data.adminInfo.name);
        setCurrentLock(null);
        setIsLocked(false);
        setIsCurrentUserLockOwner(false);
        setCurrentVersion(0);
        resetVersionConflict();
        
        // Show notification about admin takeover
        console.warn(`Admin ${data.adminInfo.name} has taken control of this appointment`);
      }
    });

    // Listen for automatic cleanup notifications
    newSocket.on('lock-expired', (data: { appointmentId: string; expiredLock: AppointmentLock }) => {
      if (data.appointmentId === appointmentId && data.expiredLock.userId === userId) {
        console.warn('⏰ Your lock has expired automatically due to inactivity');
        setCurrentLock(null);
        setIsLocked(false);
        setIsCurrentUserLockOwner(false);
        setCurrentVersion(0);
        resetVersionConflict();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, userId, disabled]);

  // Auto-refresh lock every 4 minutes to prevent expiration (which happens at 5 minutes)
  // This also ensures version incrementation happens regularly
  useEffect(() => {
    if (!isCurrentUserLockOwner || !appointmentId || !userId || !currentLock) return;

    const refreshLock = async () => {
      console.log('🔄 Auto-refreshing lock to prevent expiration...');
      
      try {
        const response = await fetch(`/api/appointments/${appointmentId}/acquire-lock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId, 
            userInfo: {
              name: currentLock.userInfo.name,
              email: currentLock.userInfo.email
            },
            expectedVersion: currentVersion
          }),
        });
        
        const refreshResult: LockResponse = await response.json();

        if (refreshResult.success && refreshResult.lock) {
          console.log('✅ Lock auto-refresh successful, version:', refreshResult.lock.version);
          setCurrentLock(refreshResult.lock);
          setCurrentVersion(refreshResult.lock.version);
          resetVersionConflict();
        } else {
          console.warn('⚠️ Lock auto-refresh failed:', refreshResult.message);
          
          // If auto-refresh fails, it might mean someone else has the lock now
          if (refreshResult.conflictDetails) {
            setVersionConflictCount(prev => prev + 1);
            setCurrentVersion(refreshResult.conflictDetails.currentVersion);
          }
        }
      } catch (error) {
        console.error('❌ Lock auto-refresh error:', error);
      }
    };

    const interval = setInterval(refreshLock, 4 * 60 * 1000); // 4 minutes

    return () => clearInterval(interval);
  }, [isCurrentUserLockOwner, appointmentId, userId, currentLock, currentVersion]);

  // Release lock on component unmount or tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isCurrentUserLockOwner && appointmentId && userId) {
        // Synchronous API call to release lock before page unload
        navigator.sendBeacon(
          `${process.env.BACKEND_API_URL || 'http://localhost:8088/api/v1'}/appointments/${appointmentId}/release-lock`,
          JSON.stringify({ userId, expectedVersion: currentVersion })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also try to release lock on component unmount
      if (isCurrentUserLockOwner && appointmentId && userId) {
        releaseLock(appointmentId, userId, currentVersion).catch(console.error);
      }
    };
  }, [isCurrentUserLockOwner, appointmentId, userId, currentVersion]);

  const fetchLockStatus = async (appointmentId: string) => {
    try {
      setLockLoading(true);
      setLockError(null);
      
      const response = await fetch(`/api/appointments/${appointmentId}/lock-status`);
      const data = await response.json();
      
      if (data.lock) {
        setCurrentLock(data.lock);
        setIsLocked(true);
        setCurrentVersion(data.lock.version);
        if (userId) {
          setIsCurrentUserLockOwner(data.lock.userId === userId);
        }
      } else {
        setCurrentLock(null);
        setIsLocked(false);
        setIsCurrentUserLockOwner(false);
        setCurrentVersion(0);
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
    userInfo: { name: string; email: string },
    expectedVersion?: number
  ): Promise<LockResponse> => {
    if (disabled) return { success: false, message: 'Lock operations are disabled' };
    
    try {
      setLockLoading(true);
      setLockError(null);
      
      const response = await fetch(`/api/appointments/${appointmentId}/acquire-lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId, 
          userInfo,
          expectedVersion: expectedVersion ?? currentVersion
        }),
      });
      
      const data: LockResponse = await response.json();
      
      if (data.success && data.lock) {
        setCurrentLock(data.lock);
        setIsLocked(true);
        setIsCurrentUserLockOwner(true);
        setCurrentVersion(data.lock.version);
        resetVersionConflict();
      } else {
        setLockError(data.message);
        
        // Handle version conflicts
        if (data.conflictDetails) {
          setVersionConflictCount(prev => prev + 1);
          setCurrentVersion(data.conflictDetails.currentVersion);
          
          // If there's a current lock from the response, update it
          if (data.lock) {
            setCurrentLock(data.lock);
            setIsLocked(true);
            setIsCurrentUserLockOwner(data.lock.userId === userId);
          }
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error acquiring lock:', error);
      const errorResponse: LockResponse = { success: false, message: 'Failed to acquire lock' };
      setLockError(errorResponse.message);
      return errorResponse;
    } finally {
      setLockLoading(false);
    }
  };

  const releaseLock = async (
    appointmentId: string, 
    userId: string, 
    expectedVersion?: number
  ): Promise<LockResponse> => {
    if (disabled) return { success: false, message: 'Lock operations are disabled' };
    
    try {
      setLockLoading(true);
      setLockError(null);
      
      const response = await fetch(`/api/appointments/${appointmentId}/release-lock`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId,
          expectedVersion: expectedVersion ?? currentVersion
        }),
      });
      
      const data: LockResponse = await response.json();
      
      if (data.success) {
        setCurrentLock(null);
        setIsLocked(false);
        setIsCurrentUserLockOwner(false);
        setCurrentVersion(0);
        resetVersionConflict();
      } else {
        setLockError(data.message);
        
        // Handle version conflicts
        if (data.conflictDetails) {
          setVersionConflictCount(prev => prev + 1);
          setCurrentVersion(data.conflictDetails.currentVersion);
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error releasing lock:', error);
      const errorResponse: LockResponse = { success: false, message: 'Failed to release lock' };
      setLockError(errorResponse.message);
      return errorResponse;
    } finally {
      setLockLoading(false);
    }
  };

  const forceReleaseLock = async (appointmentId: string, adminId: string): Promise<LockResponse> => {
    if (disabled) return { success: false, message: 'Lock operations are disabled' };
    
    try {
      setLockLoading(true);
      setLockError(null);
      
      const response = await fetch(`/api/appointments/${appointmentId}/force-release-lock`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminId }),
      });
      
      const data: LockResponse = await response.json();
      
      if (data.success) {
        setCurrentLock(null);
        setIsLocked(false);
        setIsCurrentUserLockOwner(false);
        setCurrentVersion(0);
        resetVersionConflict();
      } else {
        setLockError(data.message);
      }
      
      return data;
    } catch (error) {
      console.error('Error force releasing lock:', error);
      const errorResponse: LockResponse = { success: false, message: 'Failed to force release lock' };
      setLockError(errorResponse.message);
      return errorResponse;
    } finally {
      setLockLoading(false);
    }
  };

  const updateUserPosition = async (
    appointmentId: string, 
    userId: string, 
    position: { x: number; y: number },
    expectedVersion?: number
  ): Promise<LockResponse> => {
    if (disabled) return { success: false, message: 'Lock operations are disabled' };
    
    try {
      // Update position via WebSocket for real-time updates
      if (socket) {
        socket.emit('cursor-position', {
          appointmentId,
          userId,
          position
        });
      }
      
      // Also update via REST API to refresh lock timeout with optimistic locking
      const response = await fetch(`/api/appointments/${appointmentId}/update-position`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId, 
          position,
          expectedVersion: expectedVersion ?? currentVersion
        }),
      });
      
      const data: LockResponse = await response.json();
      
      if (data.success && data.lock) {
        // Update the current version if position update succeeded
        setCurrentVersion(data.lock.version);
        setCurrentLock(data.lock);
      } else if (data.conflictDetails) {
        // Handle version conflicts
        setVersionConflictCount(prev => prev + 1);
        setCurrentVersion(data.conflictDetails.currentVersion);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating position:', error);
      return { success: false, message: 'Failed to update position' };
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
        userCursors,
        currentVersion,
        versionConflictCount,
        resetVersionConflict
      }}
    >
      {children}
    </LockContext.Provider>
  );
};
