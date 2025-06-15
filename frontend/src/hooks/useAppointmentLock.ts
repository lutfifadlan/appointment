import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';

interface LockInfo {
  userId: string;
  userInfo: {
    name: string;
    email: string;
  };
  expiresAt: Date;
}

export const useAppointmentLock = (appointmentId: string) => {
  const [lock, setLock] = useState<LockInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (!socket || !appointmentId) return;

    socket.emit('join-appointment', appointmentId);

    socket.on('lock-update', (lockData: LockInfo | null) => {
      setLock(lockData);
    });

    return () => {
      socket.emit('leave-appointment', appointmentId);
      socket.off('lock-update');
    };
  }, [socket, appointmentId]);

  const acquireLock = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/appointments/${appointmentId}/acquire-lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userInfo: {
            name: user.name,
            email: user.email,
          },
          isAdmin,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message);
        return false;
      }

      return true;
    } catch {
      setError('Failed to acquire lock');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, user, isAdmin]);

  const releaseLock = useCallback(async () => {
    if (!user) return;
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
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message);
        return false;
      }

      return true;
    } catch {
      setError('Failed to release lock');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, user, isAdmin]);

  const forceReleaseLock = useCallback(async () => {
    if (!isAdmin || !user) return;
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
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message);
        return false;
      }

      return true;
    } catch {
      setError('Failed to force release lock');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, user, isAdmin]);

  const hasLock = useCallback(() => {
    if (!lock || !user) return false;
    return lock.userId === user.id;
  }, [lock, user]);

  return {
    lock,
    isLoading,
    error,
    acquireLock,
    releaseLock,
    forceReleaseLock,
    hasLock,
    isLocked: !!lock,
  };
}; 