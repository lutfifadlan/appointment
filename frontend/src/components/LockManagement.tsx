import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import { 
  Lock, 
  Unlock, 
  Shield, 
  Clock, 
  Users, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  Calendar
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
import { useAppointmentLock } from '@/hooks/useAppointmentLock';
import { CollaborativeCursor } from './CollaborativeCursor';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

interface LockHistoryItem {
  id: string;
  appointmentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: 'acquired' | 'released' | 'expired' | 'force_released';
  timestamp: string;
  duration?: number; // in seconds
  releasedBy?: string; // for force releases
}

interface LockManagementProps {
  selectedAppointmentId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userColor: string;
  isAdmin?: boolean;
}

export function LockManagement({
  selectedAppointmentId,
  userId,
  userName,
  userEmail,
  userColor,
  isAdmin = false,
}: LockManagementProps) {
  const {
    lock,
    isLoading,
    error,
    acquireLock,
    releaseLock,
    forceReleaseLock,
    hasLock,
    isLocked,
    canAttemptLock,
    fetchLockStatus,
  } = useAppointmentLock(selectedAppointmentId || '');

  const [lockHistory, setLockHistory] = useState<LockHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [lockStatistics, setLockStatistics] = useState<{
    totalAcquisitions: number;
    totalReleases: number;
    totalExpired: number;
    totalForceReleases: number;
    averageDuration: number;
    uniqueUsers: number;
  } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');

  // Fetch lock history when appointment is selected
  useEffect(() => {
    if (selectedAppointmentId) {
      fetchLockHistory();
      fetchLockStatus(selectedAppointmentId);
    }
  }, [selectedAppointmentId]);

  // Simulate connection monitoring (in real app, this would be actual WebSocket status)
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real app, this would check actual WebSocket connection
      setConnectionStatus('connected');
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchLockHistory = async () => {
    if (!selectedAppointmentId) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`http://localhost:8088/api/v1/appointments/${selectedAppointmentId}/lock-history`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Transform the backend data to match our frontend interface
        const transformedHistory: LockHistoryItem[] = result.data.map((item: {
          id: string;
          appointmentId: string;
          userId: string;
          userName: string;
          userEmail: string;
          action: 'acquired' | 'released' | 'expired' | 'force_released';
          timestamp: string;
          duration?: number;
          releasedBy?: string;
        }) => ({
          id: item.id,
          appointmentId: item.appointmentId,
          userId: item.userId,
          userName: item.userName,
          userEmail: item.userEmail,
          action: item.action,
          timestamp: item.timestamp,
          duration: item.duration,
          releasedBy: item.releasedBy,
        }));
        
        setLockHistory(transformedHistory);
      } else {
        throw new Error(result.message || 'Failed to fetch lock history');
      }
    } catch (error) {
      console.error('Failed to fetch lock history:', error);
      toast.error('Failed to load lock history');
      // Fallback to empty array on error
      setLockHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchLockStatistics = async () => {
    if (!selectedAppointmentId) return;
    
    try {
      const response = await fetch(`http://localhost:8088/api/v1/appointments/${selectedAppointmentId}/lock-statistics`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setLockStatistics(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch lock statistics');
      }
    } catch (error) {
      console.error('Failed to fetch lock statistics:', error);
      // Don't show error toast for statistics as it's not critical
      setLockStatistics(null);
    }
  };

  const handleAcquireLock = useCallback(async () => {
    if (!selectedAppointmentId) {
      toast.error('Please select an appointment first');
      return;
    }

    const success = await acquireLock();
    if (success) {
      toast.success('Lock acquired successfully');
      // Refresh history to show the new acquisition
      fetchLockHistory();
    }
  }, [selectedAppointmentId, acquireLock]);

  const handleReleaseLock = useCallback(async () => {
    const success = await releaseLock();
    if (success) {
      toast.success('Lock released successfully');
      // Refresh history to show the release
      fetchLockHistory();
    }
  }, [releaseLock]);

  const handleForceRelease = useCallback(async () => {
    if (!selectedAppointmentId) return;
    
    const success = await forceReleaseLock();
    if (success) {
      toast.success('Lock forcefully released');
      // Refresh history to show the force release
      fetchLockHistory();
    }
  }, [selectedAppointmentId, forceReleaseLock]);

  const handleRefreshStatus = useCallback(async () => {
    if (!selectedAppointmentId) return;
    await fetchLockStatus(selectedAppointmentId);
    await fetchLockHistory();
    toast.info('Lock status refreshed');
  }, [selectedAppointmentId, fetchLockStatus]);

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'disconnected': return 'text-red-500';
      case 'reconnecting': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return CheckCircle;
      case 'disconnected': return XCircle;
      case 'reconnecting': return RefreshCw;
      default: return Activity;
    }
  };

  const getActionColor = (action: LockHistoryItem['action']) => {
    switch (action) {
      case 'acquired': return 'bg-blue-100 text-blue-800';
      case 'released': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      case 'force_released': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: LockHistoryItem['action']) => {
    switch (action) {
      case 'acquired': return Lock;
      case 'released': return Unlock;
      case 'expired': return Clock;
      case 'force_released': return Shield;
      default: return Activity;
    }
  };

  const ConnectionIcon = getConnectionStatusIcon();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lock Management</h2>
          <p className="text-muted-foreground">
            Manage collaborative editing locks and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionIcon 
            className={`h-4 w-4 ${getConnectionStatusColor()} ${connectionStatus === 'reconnecting' ? 'animate-spin' : ''}`} 
          />
          <span className={`text-sm ${getConnectionStatusColor()}`}>
            {connectionStatus}
          </span>
        </div>
      </div>

      {/* No Appointment Selected */}
      {!selectedAppointmentId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Appointment Selected</h3>
            <p className="text-muted-foreground text-center">
              Please select an appointment from the Appointment Management tab to view and manage locks.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Current Lock Status */}
      {selectedAppointmentId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Current Lock Status
            </CardTitle>
            <CardDescription>
              Real-time lock status for the selected appointment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Lock Status Display */}
              <div className="border rounded-lg p-4">
                {isLocked ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-red-500" />
                      <span className="font-semibold text-red-700">Appointment is Locked</span>
                      {hasLock() && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          You own this lock
                        </Badge>
                      )}
                    </div>
                    
                    {lock && (
                      <div className="bg-muted rounded-lg p-3 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Locked by:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{lock.userInfo.name}</span>
                              <span className="text-muted-foreground">({lock.userInfo.email})</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Expires:</span>
                            <p className="font-medium">
                              {formatDistanceToNow(lock.expiresAt, { addSuffix: true })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(lock.expiresAt, 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                          {lock.version && (
                            <div>
                              <span className="text-muted-foreground">Version:</span>
                              <p className="font-medium">{lock.version}</p>
                            </div>
                          )}
                          {lock.lastActivity && (
                            <div>
                              <span className="text-muted-foreground">Last Activity:</span>
                              <p className="font-medium">
                                {formatDistanceToNow(lock.lastActivity, { addSuffix: true })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Unlock className="h-5 w-5 text-green-500" />
                    <span className="font-semibold text-green-700">Appointment is Available</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Ready to lock
                    </Badge>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {!isLocked && (
                  <Button
                    onClick={handleAcquireLock}
                    disabled={isLoading || !canAttemptLock}
                    className="flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    {isLoading ? 'Acquiring...' : 'Acquire Lock'}
                  </Button>
                )}

                {hasLock() && (
                  <Button
                    onClick={handleReleaseLock}
                    disabled={isLoading}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Unlock className="h-4 w-4" />
                    {isLoading ? 'Releasing...' : 'Release Lock'}
                  </Button>
                )}

                {isAdmin && isLocked && !hasLock() && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="flex items-center gap-2"
                        disabled={isLoading}
                      >
                        <Shield className="h-4 w-4" />
                        Force Release
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Force Release Lock</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will immediately release the lock from {lock?.userInfo.name}. 
                          The user may lose unsaved changes. This action cannot be undone.
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

                <Button
                  onClick={handleRefreshStatus}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {/* Rate Limiting Warning */}
              {!canAttemptLock && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Rate limit reached. Please wait before attempting to acquire the lock again.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collaborative Features */}
      {selectedAppointmentId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Collaborative Features
            </CardTitle>
            <CardDescription>
              Real-time collaboration tools for the selected appointment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Live Cursors</span>
                <Badge variant="outline">Active</Badge>
              </div>
              
              <CollaborativeCursor
                userId={userId}
                userName={userName}
                userColor={userColor}
                appointmentId={selectedAppointmentId}
                isEnabled={true}
              />

              <div className="text-sm text-muted-foreground">
                • Mouse movements are shared in real-time
                • Only visible when viewing the same appointment
                • Automatically cleaned up after 10 seconds of inactivity
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lock History */}
      {selectedAppointmentId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Lock History
            </CardTitle>
            <CardDescription>
              Recent lock activities and audit trail for this appointment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                <span>Loading lock history...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {lockHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No lock history available</p>
                    <p className="text-sm">Lock activities will appear here</p>
                  </div>
                ) : (
                  lockHistory.map((historyItem) => {
                    const ActionIcon = getActionIcon(historyItem.action);
                    return (
                      <div
                        key={historyItem.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ActionIcon className="h-4 w-4" />
                            <Badge className={getActionColor(historyItem.action)}>
                              {historyItem.action.replace('_', ' ')}
                            </Badge>
                            <div>
                              <span className="font-medium">{historyItem.userName}</span>
                              <span className="text-muted-foreground text-sm ml-2">
                                ({historyItem.userEmail})
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(parseISO(historyItem.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
                          <div>
                            <span className="block">Time:</span>
                            {format(parseISO(historyItem.timestamp), 'MMM dd, HH:mm')}
                          </div>
                          {historyItem.duration && (
                            <div>
                              <span className="block">Duration:</span>
                              {Math.floor(historyItem.duration / 60)}m {historyItem.duration % 60}s
                            </div>
                          )}
                          {historyItem.releasedBy && (
                            <div>
                              <span className="block">Released by:</span>
                              {historyItem.releasedBy}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lock Statistics */}
      {selectedAppointmentId && lockHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Lock Statistics
            </CardTitle>
            <CardDescription>
              Usage metrics for this appointment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {lockHistory.filter(h => h.action === 'acquired').length}
                </div>
                <div className="text-sm text-muted-foreground">Total Acquisitions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {lockHistory.filter(h => h.action === 'released').length}
                </div>
                <div className="text-sm text-muted-foreground">Normal Releases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {lockHistory.filter(h => h.action === 'expired').length}
                </div>
                <div className="text-sm text-muted-foreground">Expired</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {lockHistory.filter(h => h.action === 'force_released').length}
                </div>
                <div className="text-sm text-muted-foreground">Force Released</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 