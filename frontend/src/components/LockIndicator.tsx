import { useEffect, useState } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Lock, Unlock, Shield, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface LockIndicatorProps {
  appointmentId: string;
  isAdmin?: boolean;
  showTakeoverButton?: boolean;
  onLockStatusChange?: (isLocked: boolean, lockedBy: string | null) => void;
}

export function LockIndicator({ 
  appointmentId, 
  isAdmin = false, 
  showTakeoverButton = true,
  onLockStatusChange 
}: LockIndicatorProps) {
  const { lockState, acquireLock, releaseLock, requestTakeover, forceTakeover } = useWebSocket();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showTakeoverDialog, setShowTakeoverDialog] = useState(false);
  const [lastActivity, setLastActivity] = useState<string>('Unknown');

  // Calculate time remaining and format it
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (lockState.lockExpiresAt) {
      interval = setInterval(() => {
        const remaining = Math.max(0, lockState.lockExpiresAt! - Date.now());
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          clearInterval(interval);
          toast.info('Lock has expired');
        }
      }, 1000);

      // Set initial value
      const remaining = Math.max(0, lockState.lockExpiresAt - Date.now());
      setTimeRemaining(remaining);
    } else {
      setTimeRemaining(null);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockState.lockExpiresAt]);

  // Update last activity
  useEffect(() => {
    if (lockState.isLocked && lockState.lockedBy) {
      setLastActivity('Just now');
      
      const activityTimer = setTimeout(() => {
        setLastActivity('Recently');
      }, 30000); // After 30 seconds, show "Recently"
      
      return () => clearTimeout(activityTimer);
    }
  }, [lockState.isLocked, lockState.lockedBy]);

  // Notify parent of lock status changes
  useEffect(() => {
    if (onLockStatusChange) {
      onLockStatusChange(lockState.isLocked, lockState.lockedBy);
    }
  }, [lockState.isLocked, lockState.lockedBy, onLockStatusChange]);

  const handleLockToggle = async () => {
    try {
      setIsLoading(true);
      
      if (lockState.isLocked) {
        await releaseLock(appointmentId);
        toast.success('Lock released successfully');
      } else {
        await acquireLock(appointmentId);
        toast.success('Lock acquired successfully');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to handle lock';
      toast.error(message);
      
      // Handle specific error cases
      if (message.includes('already locked')) {
        toast.info('Someone else has acquired the lock. Try requesting control.');
      } else if (message.includes('rate limit')) {
        toast.warning('Too many attempts. Please wait before trying again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeover = async (confirmed: boolean = false) => {
    if (!confirmed && !isAdmin) {
      setShowTakeoverDialog(true);
      return;
    }

    try {
      setIsLoading(true);
      setShowTakeoverDialog(false);
      
      if (isAdmin) {
        await forceTakeover(appointmentId, user?.id || '', { name: user?.name || '', email: user?.email || '' });
        toast.success('Administrative takeover successful');
      } else {
        await requestTakeover(appointmentId);
        toast.success('Takeover request sent to administrators');
        toast.info('You will be notified when your request is processed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to request takeover';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeRemaining = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getStatusColor = () => {
    if (!lockState.isLocked) return 'text-green-500';
    if (timeRemaining && timeRemaining < 60000) return 'text-yellow-500'; // Less than 1 minute
    return 'text-red-500';
  };

  const getLockIcon = () => {
    if (!lockState.isLocked) return Unlock;
    if (timeRemaining && timeRemaining < 60000) return Clock;
    return Lock;
  };

  const LockIcon = getLockIcon();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={lockState.isLocked ? 'locked' : 'unlocked'}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center gap-3 p-3 bg-background/90 backdrop-blur-sm border rounded-lg shadow-sm"
      >
        <div className="flex items-center gap-2">
          <LockIcon className={`h-4 w-4 ${getStatusColor()}`} />
          
          {lockState.isLocked ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Locked by {lockState.lockedBy}
                </span>
                <span className="text-xs text-muted-foreground">
                  • {lastActivity}
                </span>
              </div>
              
              {timeRemaining !== null && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className={`text-xs ${getStatusColor()}`}>
                    Expires in {formatTimeRemaining(timeRemaining)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm font-medium text-green-600">
              Available for editing
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {!lockState.isLocked && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLockToggle}
              disabled={isLoading}
            >
              {isLoading ? 'Acquiring...' : 'Acquire Lock'}
            </Button>
          )}

          {lockState.isLocked && lockState.lockedBy && (
            <>
              {/* Show release button if current user owns the lock */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLockToggle}
                disabled={isLoading}
              >
                {isLoading ? 'Releasing...' : 'Release Lock'}
              </Button>

              {/* Show takeover option for others */}
              {showTakeoverButton && (
                <AlertDialog open={showTakeoverDialog} onOpenChange={setShowTakeoverDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant={isAdmin ? "destructive" : "secondary"}
                      size="sm"
                      disabled={isLoading}
                    >
                      {isAdmin ? (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Force Takeover
                        </>
                      ) : (
                        <>
                          <Users className="h-3 w-3 mr-1" />
                          Request Control
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {isAdmin ? 'Force Takeover Lock' : 'Request Lock Control'}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {isAdmin ? (
                          <>
                            This will immediately remove the lock from{' '}
                            <strong>{lockState.lockedBy}</strong> and grant it to you.
                            This action cannot be undone and the current user will lose
                            any unsaved changes.
                          </>
                        ) : (
                          <>
                            This will send a request to administrators to take control
                            of this appointment from <strong>{lockState.lockedBy}</strong>.
                            You will be notified when your request is processed.
                          </>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleTakeover(true)}
                        className={isAdmin ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                      >
                        {isAdmin ? 'Force Takeover' : 'Send Request'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 