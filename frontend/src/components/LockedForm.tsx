import { ReactNode, useEffect, useState, useCallback } from 'react';
import { LockIndicator } from './LockIndicator';
import { CollaborativeCursor } from './CollaborativeCursor';
import { useAppointmentLock } from '@/hooks/useAppointmentLock';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Clock, Users, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface LockedFormProps {
  appointmentId: string;
  isAdmin?: boolean;
  userId: string;
  userName: string;
  userColor: string;
  children: ReactNode;
  onLockAcquired?: () => void;
  onLockReleased?: () => void;
  onLockConflict?: (lockedBy: string) => void;
  onFormSubmit?: (formData: FormData) => Promise<boolean>;
  enableCollaborativeCursors?: boolean;
  className?: string;
}

export function LockedForm({
  appointmentId,
  isAdmin = false,
  userId,
  userName,
  userColor,
  children,
  onLockAcquired,
  onLockReleased,
  onLockConflict,
  onFormSubmit,
  enableCollaborativeCursors = true,
  className = '',
}: LockedFormProps) {
  const { 
    lock, 
    isLoading, 
    error, 
    hasLock, 
    isLocked
  } = useAppointmentLock(appointmentId);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [conflictResolution, setConflictResolution] = useState<'manual' | 'auto' | null>(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Connection lost - working offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle lock status changes
  const handleLockStatusChange = useCallback((isLocked: boolean, lockedBy: string | null) => {
    if (isLocked && lockedBy && lockedBy !== userId) {
      // Someone else has the lock
      if (onLockConflict) {
        onLockConflict(lockedBy);
      }
      
      // Show conflict resolution options
      setConflictResolution('manual');
    } else if (isLocked && lockedBy === userId) {
      // Current user has the lock
      if (onLockAcquired) {
        onLockAcquired();
      }
      setConflictResolution(null);
    } else if (!isLocked) {
      // Lock released
      if (onLockReleased) {
        onLockReleased();
      }
      setConflictResolution(null);
    }
  }, [userId, onLockAcquired, onLockReleased, onLockConflict]);

  // Auto-save functionality when user has lock
  useEffect(() => {
    if (!hasLock() || !autoSaveEnabled) return;

    const autoSaveInterval = setInterval(() => {
      // Trigger auto-save - you can customize this to save form data
      setLastSaved(new Date());
      
      // Optional: Emit save event for parent components to handle
      const saveEvent = new CustomEvent('autoSave', {
        detail: { appointmentId, userId, timestamp: new Date() }
      });
      window.dispatchEvent(saveEvent);
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [hasLock, autoSaveEnabled, appointmentId, userId]);

  // Handle form submission with conflict resolution
  const handleFormSubmit = useCallback(async (formData: FormData) => {
    if (!hasLock()) {
      toast.error('You must have a lock to save changes');
      return false;
    }

    if (onFormSubmit) {
      return await onFormSubmit(formData);
    }

    try {
      // Default form submission logic
      const submissionData = {
        ...Object.fromEntries(formData),
        version: lock?.version || 0,
        timestamp: Date.now(),
        userId,
      };

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.code === 'VERSION_CONFLICT') {
          toast.error('Someone else has modified this appointment. Please refresh and try again.');
          return false;
        }
        throw new Error(error.message);
      }

      setLastSaved(new Date());
      toast.success('Changes saved successfully');
      return true;
    } catch (error) {
      toast.error('Failed to save changes');
      console.error('Form submission error:', error);
      return false;
    }
  }, [hasLock, lock, appointmentId, userId, onFormSubmit]);

  const isFormDisabled = isLocked && !hasLock();

  // Expose handleFormSubmit to parent components
  useEffect(() => {
    const formElement = document.querySelector(`[data-appointment-form="${appointmentId}"]`) as HTMLFormElement;
    if (formElement) {
      const handleSubmit = (e: Event) => {
        e.preventDefault();
        const formData = new FormData(formElement);
        handleFormSubmit(formData);
      };
      
      formElement.addEventListener('submit', handleSubmit);
      return () => formElement.removeEventListener('submit', handleSubmit);
    }
  }, [appointmentId, handleFormSubmit]);

  return (
    <div className={`relative ${className}`}>
      {/* Connection Status */}
      <div className="fixed top-4 right-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2"
        >
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
        </motion.div>
      </div>

      {/* Lock Indicator */}
      <div className="sticky top-0 z-40 mb-4">
        <LockIndicator
          appointmentId={appointmentId}
          isAdmin={isAdmin}
          onLockStatusChange={handleLockStatusChange}
        />
      </div>

      {/* Error Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4"
          >
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conflict Resolution */}
      <AnimatePresence>
        {conflictResolution === 'manual' && lock && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4"
          >
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    <strong>{lock.userInfo.name}</strong> is currently editing this appointment.
                  </span>
                  <div className="flex gap-2">
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          // This will be handled by LockIndicator
                          setConflictResolution(null);
                        }}
                      >
                        Take Control
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConflictResolution(null)}
                    >
                      Continue Viewing
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-save Status */}
      {hasLock() && lastSaved && (
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
          >
            Auto-save: {autoSaveEnabled ? 'On' : 'Off'}
          </Button>
        </div>
      )}

      {/* Main Form Content */}
      <motion.div
        animate={{
          opacity: isFormDisabled ? 0.5 : 1,
          filter: isFormDisabled ? 'blur(2px)' : 'none',
        }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        {/* Overlay for disabled form */}
        {isFormDisabled && (
          <div className="absolute inset-0 z-10 bg-background/20 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center p-6 bg-background/90 rounded-lg border shadow-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Form is locked</p>
              <p className="text-sm text-muted-foreground">
                {lock ? `Being edited by ${lock.userInfo.name}` : 'Someone else is editing'}
              </p>
            </div>
          </div>
        )}

        {/* Form fields will be passed as children */}
        <div 
          className={isFormDisabled ? 'pointer-events-none' : ''}
          data-appointment-form={appointmentId}
        >
          {children}
        </div>
      </motion.div>

      {/* Collaborative Cursors */}
      {enableCollaborativeCursors && (
        <CollaborativeCursor
          userId={userId}
          userName={userName}
          userColor={userColor}
          appointmentId={appointmentId}
          isEnabled={!isFormDisabled}
        />
      )}

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm">Processing...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 