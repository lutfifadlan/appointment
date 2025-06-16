import { useEffect, useState } from 'react';
import { useWebSocket } from '@/lib/websocket';

interface UseLockedFormProps {
  appointmentId: string;
  onLockAcquired?: () => void;
  onLockReleased?: () => void;
}

export function useLockedForm({ appointmentId, onLockAcquired, onLockReleased }: UseLockedFormProps) {
  const { lockState, acquireLock, releaseLock } = useWebSocket();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (lockState.isLocked) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [lockState.isLocked]);

  const handleLock = async () => {
    try {
      setIsLoading(true);
      if (lockState.isLocked) {
        await releaseLock(appointmentId);
        onLockReleased?.();
      } else {
        await acquireLock(appointmentId);
        onLockAcquired?.();
      }
    } catch (error) {
      console.error('Lock operation failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLocked: lockState.isLocked,
    lockedBy: lockState.lockedBy,
    isLoading,
    handleLock,
  };
} 