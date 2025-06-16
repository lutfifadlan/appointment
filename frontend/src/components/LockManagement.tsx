'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';

import { toast } from 'sonner';
import { 
  Lock, 
  Unlock, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  GitBranch,
  History,
  Clock,
} from 'lucide-react';
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
import { useLock } from '@/lib/contexts/LockContext';

import { LockHistory } from './LockHistory';
import { format, formatDistanceToNow } from 'date-fns';

interface LockManagementProps {
  selectedAppointmentId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userColor?: string;
  isAdmin?: boolean;
}

export function LockManagement({
  selectedAppointmentId,
  userId,
  userName,
  userEmail,
  isAdmin = false,
}: LockManagementProps) {
  const {
    isLocked,
    isCurrentUserLockOwner,
    currentLock,
    lockLoading,
    lockError,
        acquireLock,
    releaseLock,
    forceReleaseLock,
    currentVersion,
    versionConflictCount,
    resetVersionConflict,
  } = useLock();

  const [showVersionConflictAlert, setShowVersionConflictAlert] = useState(false);
  const [lastConflictCount, setLastConflictCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Calculate and update time remaining until lock expires
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentLock?.expiresAt) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const expiresAt = new Date(currentLock.expiresAt).getTime();
        const remaining = Math.max(0, expiresAt - now);
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          clearInterval(interval);
        }
      };

      // Update immediately
      updateTimer();
      
      // Then update every second
      interval = setInterval(updateTimer, 1000);
    } else {
      setTimeRemaining(null);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentLock?.expiresAt]);

  // Format time remaining for display
  const formatTimeRemaining = (ms: number | null): string => {
    if (ms === null) return 'N/A';
    if (ms === 0) return 'Expired';
    
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Get timer color based on remaining time
  const getTimerColor = (ms: number | null): string => {
    if (ms === null) return 'text-muted-foreground';
    if (ms === 0) return 'text-red-600 font-semibold';
    if (ms < 60000) return 'text-red-500 font-medium'; // Less than 1 minute
    if (ms < 120000) return 'text-yellow-600 font-medium'; // Less than 2 minutes
    return 'text-green-600 font-medium';
  };

  // Show version conflict alert when version conflicts occur
  useEffect(() => {
    if (versionConflictCount > lastConflictCount) {
      setShowVersionConflictAlert(true);
      setLastConflictCount(versionConflictCount);
      
      // Show toast notification for version conflicts
      toast.warning('Lock version conflict detected. Please refresh and try again.', {
        duration: 5000,
      });
    }
  }, [versionConflictCount, lastConflictCount]);

  // Listen for lock expiration events
  useEffect(() => {
    if (!isCurrentUserLockOwner && currentLock && lockError?.includes('expired')) {
      toast.warning('Your lock has expired due to inactivity. Please re-acquire the lock to continue editing.', {
        duration: 8000,
      });
    }
  }, [isCurrentUserLockOwner, currentLock, lockError]);

  const handleAcquireLock = useCallback(async () => {
    if (!selectedAppointmentId) {
      toast.error('Please select an appointment first');
      return;
    }

    try {
      const response = await acquireLock(
        selectedAppointmentId, 
        userId, 
        { name: userName, email: userEmail },
        currentVersion
      );
      
      if (response.success) {
        toast.success('Lock acquired successfully');
      } else if (response.conflictDetails) {
        toast.error(`Version conflict: ${response.message}`);
        setShowVersionConflictAlert(true);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('Failed to acquire lock');
      console.error('Lock acquisition error:', error);
    }
  }, [selectedAppointmentId, userId, userName, userEmail, currentVersion, acquireLock]);

  const handleReleaseLock = useCallback(async () => {
    if (!selectedAppointmentId) {
      toast.error('Please select an appointment first');
      return;
    }

    try {
      const response = await releaseLock(selectedAppointmentId, userId, currentVersion);
      
      if (response.success) {
        toast.success('Lock released successfully');
      } else if (response.conflictDetails) {
        toast.error(`Version conflict: ${response.message}`);
        setShowVersionConflictAlert(true);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('Failed to release lock');
      console.error('Lock release error:', error);
    }
  }, [selectedAppointmentId, userId, currentVersion, releaseLock]);

  const handleForceRelease = useCallback(async () => {
    if (!selectedAppointmentId || !isAdmin) {
      toast.error('Admin privileges required');
      return;
    }

    try {
      const response = await forceReleaseLock(selectedAppointmentId, userId);
      
      if (response.success) {
        toast.success('Lock forcefully released');
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('Failed to force release lock');
      console.error('Force release error:', error);
    }
  }, [selectedAppointmentId, userId, isAdmin, forceReleaseLock]);

  const handleResolveVersionConflict = () => {
    resetVersionConflict();
    setShowVersionConflictAlert(false);
    toast.info('Version conflict resolved. Please try your action again.');
  };

  const getLockStatusColor = () => {
    if (!isLocked) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (isCurrentUserLockOwner) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getLockStatusIcon = () => {
    if (!isLocked) return <Unlock className="h-5 w-5" />;
    if (isCurrentUserLockOwner) return <CheckCircle className="h-5 w-5" />;
    return <Lock className="h-5 w-5" />;
  };

  const getVersionBadgeColor = () => {
    if (versionConflictCount > 0) return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (!selectedAppointmentId) {
    return (
      <Card className="h-full">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-gray-400" />
          </div>
          <CardTitle className="text-xl">Lock Management</CardTitle>
          <CardDescription className="text-base">
            Select an appointment to manage its lock status and collaboration features
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Choose an appointment from the list to:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" /> Manage lock permissions
            </li>
            <li className="flex items-center justify-center gap-2">
              <History className="h-4 w-4" /> Track lock history
            </li>
          </ul>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Lock Management</CardTitle>
                <CardDescription>
                  Collaborative editing control for appointment
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getVersionBadgeColor()}>
                <GitBranch className="h-3 w-3 mr-1" />
                v{currentVersion}
              </Badge>
              {versionConflictCount > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {versionConflictCount} conflicts
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Lock Status Display */}
          <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${getLockStatusColor()} transition-all duration-200`}>
            <div className="flex items-center gap-4">
              {getLockStatusIcon()}
              <div>
                <div className="font-semibold text-lg">
                  {!isLocked ? 'Available for Editing' : 
                   isCurrentUserLockOwner ? 'Locked by You' : 
                   `Locked by ${currentLock?.userInfo.name || 'Unknown User'}`}
                </div>
                {currentLock && (
                  <div className="text-sm opacity-75 mt-1">
                    {isCurrentUserLockOwner ? 
                      `Expires ${formatTimeRemaining(timeRemaining)}` :
                      `Locked ${formatDistanceToNow(new Date(currentLock.createdAt), { addSuffix: true })} • ${currentLock.userInfo.email}`
                    }
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className={getTimerColor(timeRemaining)}>
                {!isLocked ? 'Unlocked' : 
                 isCurrentUserLockOwner ? (
                   timeRemaining !== null ? (
                     <span className="flex items-center gap-1">
                       <Clock className="h-3 w-3" />
                       {formatTimeRemaining(timeRemaining)}
                     </span>
                   ) : 'Your Lock'
                 ) : 'Locked'}
              </Badge>
            </div>
          </div>

          {/* Error Display */}
          {lockError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{lockError}</AlertDescription>
            </Alert>
          )}

          {/* Lock Expiration Warning */}
          {isCurrentUserLockOwner && timeRemaining !== null && timeRemaining > 0 && timeRemaining < 120000 && (
            <Alert variant={timeRemaining < 60000 ? "destructive" : "default"} className="mt-4">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                {timeRemaining < 60000 ? (
                  <span className="font-semibold">
                    ⚠️ Your lock expires in {formatTimeRemaining(timeRemaining)}! Save your work or refresh the lock.
                  </span>
                ) : (
                  <span>
                    Your lock expires in {formatTimeRemaining(timeRemaining)}. It will auto-refresh in the background.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {!isLocked && (
              <Button
                onClick={handleAcquireLock}
                disabled={lockLoading}
                className="flex items-center gap-2"
                size="default"
              >
                <Lock className="h-4 w-4" />
                {lockLoading ? 'Acquiring...' : 'Acquire Lock'}
              </Button>
            )}

            {isCurrentUserLockOwner && (
              <Button
                onClick={handleReleaseLock}
                disabled={lockLoading}
                variant="outline"
                className="flex items-center gap-2"
                size="default"
              >
                <Unlock className="h-4 w-4" />
                {lockLoading ? 'Releasing...' : 'Release Lock'}
              </Button>
                        )}

            {isLocked && !isCurrentUserLockOwner && isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={lockLoading}
                    variant="destructive"
                    className="flex items-center gap-2"
                    size="default"
                  >
                    <Shield className="h-4 w-4" />
                    Force Release
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Force Release Lock</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will forcefully release the lock currently held by {currentLock?.userInfo.name}. 
                      This action cannot be undone and may disrupt their work.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleForceRelease}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Force Release
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
 
          </div>

          {/* Lock Details */}
          {currentLock && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Owner</div>
                  <div className="font-medium">{currentLock.userInfo.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Version</div>
                  <div className="font-medium">v{currentLock.version}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div className="font-medium">{format(new Date(currentLock.createdAt), 'MMM d, h:mm a')}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Expires</div>
                  <div className="font-medium">{format(new Date(currentLock.expiresAt), 'MMM d, h:mm a')}</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Lock History and Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Lock History & Statistics
          </CardTitle>
          <CardDescription>
            Track lock activity and view collaboration statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LockHistory 
            appointmentId={selectedAppointmentId}
            autoRefresh={true}
            showStatistics={true}
          />
        </CardContent>
      </Card>

      {/* Version Conflict Alert */}
      <AlertDialog open={showVersionConflictAlert} onOpenChange={setShowVersionConflictAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Version Conflict Detected
            </AlertDialogTitle>
            <AlertDialogDescription>
              The lock version has changed since your last action. This means another user has 
              modified the lock state. Please refresh and try your action again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowVersionConflictAlert(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResolveVersionConflict}>
              Resolve & Retry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </div>
  );
} 