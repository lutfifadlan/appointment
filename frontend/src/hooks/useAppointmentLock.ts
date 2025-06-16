import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';

interface LockInfo {
  userId: string;
  userInfo: {
    name: string;
    email: string;
  };
  expiresAt: Date;
  version?: number; // Add versioning for optimistic locking
  lastActivity?: Date;
}

interface LockAttempt {
  timestamp: number;
  success: boolean;
}

export const useAppointmentLock = (appointmentId: string) => {
  const [lock, setLock] = useState<LockInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();
  const { user, isAdmin } = useAuth();
  
  // Rate limiting state
  const [lockAttempts, setLockAttempts] = useState<LockAttempt[]>([]);
  const lockVersionRef = useRef<number>(0);
  
  // Rate limiting constants
  const MAX_ATTEMPTS = 5;
  const RATE_LIMIT_WINDOW = 60000; // 1 minute
  const RETRY_COOLDOWN = 5000; // 5 seconds
  const [canAttemptLock, setCanAttemptLock] = useState(true);

  // Check rate limiting
  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    const recentAttempts = lockAttempts.filter(attempt => now - attempt.timestamp < RATE_LIMIT_WINDOW);
    
    if (recentAttempts.length >= MAX_ATTEMPTS) {
      const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
      if (failedAttempts.length >= 3) {
        setCanAttemptLock(false);
        setError(`Too many failed attempts. Please wait ${Math.ceil(RETRY_COOLDOWN / 1000)} seconds.`);
        
        setTimeout(() => {
          setCanAttemptLock(true);
          setError(null);
        }, RETRY_COOLDOWN);
        
        return false;
      }
    }
    return true;
  }, [lockAttempts]);

  // Record lock attempt
  const recordAttempt = useCallback((success: boolean) => {
    const attempt: LockAttempt = {
      timestamp: Date.now(),
      success,
    };
    
    setLockAttempts(prev => [...prev.slice(-9), attempt]); // Keep last 10 attempts
  }, []);

  // Input sanitization for WebSocket messages
  const sanitizeLockData = useCallback((data: unknown): LockInfo | null => {
    if (typeof data !== 'object' || !data || data === null) return null;
    
    const obj = data as Record<string, unknown>;
    
    if (typeof obj.userId !== 'string' || 
        typeof obj.userInfo !== 'object' || 
        !obj.userInfo ||
        typeof obj.expiresAt !== 'string') {
      return null;
    }
    
    const userInfo = obj.userInfo as Record<string, unknown>;
    if (typeof userInfo.name !== 'string' || typeof userInfo.email !== 'string') {
      return null;
    }

    return {
      userId: obj.userId.slice(0, 50), // Limit length
      userInfo: {
        name: userInfo.name.slice(0, 100),
        email: userInfo.email.slice(0, 100),
      },
      expiresAt: new Date(obj.expiresAt),
      version: typeof obj.version === 'number' ? obj.version : 0,
      lastActivity: typeof obj.lastActivity === 'string' ? new Date(obj.lastActivity) : new Date(),
    };
  }, []);

  useEffect(() => {
    if (!socket || !appointmentId) return;

    socket.emit('join-appointment', appointmentId);

    socket.on('lock-update', (lockData: unknown) => {
      const sanitizedLock = sanitizeLockData(lockData);
      setLock(sanitizedLock);
      if (sanitizedLock?.version) {
        lockVersionRef.current = sanitizedLock.version;
      }
    });

    socket.on('lock-conflict', (data: { message: string; currentLock: unknown }) => {
      const sanitizedLock = sanitizeLockData(data.currentLock);
      setLock(sanitizedLock);
      setError(`Lock conflict: ${data.message}`);
      recordAttempt(false);
    });

    socket.on('lock-expired', (data: { appointmentId: string }) => {
      if (data.appointmentId === appointmentId) {
        setLock(null);
        setError('Your lock has expired due to inactivity');
      }
    });

    return () => {
      socket.emit('leave-appointment', appointmentId);
      socket.off('lock-update');
      socket.off('lock-conflict');
      socket.off('lock-expired');
    };
  }, [socket, appointmentId, sanitizeLockData, recordAttempt]);

  const acquireLock = useCallback(async (showLoadingToast = true) => {
    if (!user || !canAttemptLock) return false;
    
    if (!checkRateLimit()) return false;
    
    setIsLoading(true);
    setError(null);

    try {
      const requestData = {
        userId: user.id,
        userInfo: {
          name: user.name,
          email: user.email,
        },
        isAdmin,
        version: lockVersionRef.current, // Include version for optimistic locking
        timestamp: Date.now(),
      };

      if (showLoadingToast) {
        console.log('🔒 Acquiring lock...', { appointmentId, userId: user.id });
      }

      const response = await fetch(`/api/appointments/${appointmentId}/acquire-lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!data.success) {
        recordAttempt(false);
        
        // Handle specific conflict types with enhanced error messages
        if (data.code === 'LOCK_CONFLICT') {
          setError(`🔒 Lock is currently held by ${data.currentOwner}. Expires in ${data.expiresIn}`);
        } else if (data.code === 'VERSION_CONFLICT') {
          setError('🔄 Lock state has changed. Please refresh and try again.');
        } else {
          setError(data.message);
        }
        
        return false;
      }

      recordAttempt(true);
      
      // Update local version
      if (data.lock?.version) {
        lockVersionRef.current = data.lock.version;
      }
      
      if (showLoadingToast) {
        console.log('✅ Lock acquired successfully', data.lock);
      }
      
      return true;
    } catch (error) {
      recordAttempt(false);
      setError('🌐 Network error while acquiring lock');
      console.error('Lock acquisition error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, user, isAdmin, canAttemptLock, checkRateLimit, recordAttempt]);

  const releaseLock = useCallback(async () => {
    if (!user) return false;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/${appointmentId}/release-lock`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          isAdmin,
          version: lockVersionRef.current,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message);
        return false;
      }

      // Reset version on successful release
      lockVersionRef.current = 0;
      return true;
    } catch (error) {
      setError('Failed to release lock');
      console.error('Lock release error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, user, isAdmin]);

  const forceReleaseLock = useCallback(async () => {
    if (!isAdmin || !user) return false;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/${appointmentId}/force-release-lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: user.id,
          reason: 'Administrative override',
          timestamp: Date.now(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message);
        return false;
      }

      lockVersionRef.current = 0;
      return true;
    } catch (error) {
      setError('Failed to force release lock');
      console.error('Force release error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, user, isAdmin]);

  const fetchLockStatus = useCallback(async (appointmentId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/appointments/${appointmentId}/lock-status`);
      const data = await response.json();
      
      if (data.lock) {
        const sanitizedLock = sanitizeLockData(data.lock);
        setLock(sanitizedLock);
        if (sanitizedLock?.version) {
          lockVersionRef.current = sanitizedLock.version;
        }
      } else {
        setLock(null);
        lockVersionRef.current = 0;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching lock status:', error);
      setError('Failed to fetch lock status');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sanitizeLockData]);

  const hasLock = useCallback(() => {
    if (!lock || !user) return false;
    return lock.userId === user.id;
  }, [lock, user]);

  // Heartbeat to maintain lock activity
  useEffect(() => {
    if (!hasLock() || !appointmentId || !user) return;

    const heartbeat = setInterval(() => {
      fetch(`/api/appointments/${appointmentId}/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          timestamp: Date.now(),
        }),
      }).catch(console.error);
    }, 30000); // Send heartbeat every 30 seconds

    return () => clearInterval(heartbeat);
  }, [hasLock, appointmentId, user]);

  return {
    lock,
    isLoading,
    error,
    acquireLock,
    releaseLock,
    forceReleaseLock,
    hasLock,
    isLocked: !!lock,
    canAttemptLock,
    lockVersion: lockVersionRef.current,
    fetchLockStatus,
  };
}; 