import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FollowerPointerCard } from './ui/following-pointer';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Save, 
  RefreshCw, 
  Lock, 
  Unlock, 
  Loader2,
  Users,
  AlertTriangle,
  Crown,
  Shield
} from 'lucide-react';
import { useRealtimeAppointment } from '@/hooks/useRealtimeAppointment';
import { useWebSocket } from '@/lib/websocket';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AppointmentData {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
}

interface RealtimeAppointmentEditorProps {
  appointmentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  isAdmin?: boolean;
  initialData?: AppointmentData;
  onSave?: (data: AppointmentData) => Promise<void>;
  onCancel?: () => void;
}

export function RealtimeAppointmentEditor({
  appointmentId,
  userId,
  userName,
  userEmail,
  isAdmin = false,
  initialData,
  onSave,
  onCancel,
}: RealtimeAppointmentEditorProps) {
  const [formData, setFormData] = useState<AppointmentData>(
    initialData || {
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showTakeoverDialog, setShowTakeoverDialog] = useState(false);
  const [takeoverLoading, setTakeoverLoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Real-time appointment hook
  const {
    currentLock,
    userCursors,
    lockLoading,
    lockError,
    acquireLock,
    releaseLock,
    forceReleaseLock,
    updateCursorPosition,
  } = useRealtimeAppointment(appointmentId, userId, { name: userName, email: userEmail });

  // WebSocket takeover functionality
  const { requestTakeover, forceTakeover } = useWebSocket();

  // Derived state
  const isLocked = !!currentLock;
  const isCurrentUserLockOwner = currentLock?.userId === userId;
  const canEdit = isCurrentUserLockOwner; // Only allow editing when user has the lock
  const lockOwnerName = currentLock?.userInfo?.name || 'Unknown User';

  // Handle mouse movement for cursor tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCurrentUserLockOwner || !editorRef.current) return;

    const rect = editorRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateCursorPosition(appointmentId, userId, { x, y });
  }, [isCurrentUserLockOwner, appointmentId, userId, updateCursorPosition]);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof AppointmentData, value: string) => {
    if (!canEdit) return;
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, [canEdit]);

  // Handle lock acquisition
  const handleAcquireLock = useCallback(async () => {
    const success = await acquireLock(appointmentId, userId, { name: userName, email: userEmail });
    if (success) {
      toast.success('Lock acquired successfully');
    } else {
      toast.error('Failed to acquire lock');
    }
  }, [acquireLock, appointmentId, userId, userName, userEmail]);

  // Handle lock release
  const handleReleaseLock = useCallback(async () => {
    const success = await releaseLock(appointmentId, userId);
    if (success) {
      toast.success('Lock released successfully');
    } else {
      toast.error('Failed to release lock');
    }
  }, [releaseLock, appointmentId, userId]);

  // Handle force lock release (admin only)
  const handleForceReleaseLock = useCallback(async () => {
    if (!isAdmin) return;
    
    const success = await forceReleaseLock(appointmentId, userId);
    if (success) {
      toast.success('Lock forcibly released');
    } else {
      toast.error('Failed to force release lock');
    }
  }, [forceReleaseLock, appointmentId, userId, isAdmin]);

  // Handle takeover functionality
  const handleRequestTakeover = useCallback(async () => {
    if (!isAdmin) {
      // Non-admin users request control
      setShowTakeoverDialog(true);
      return;
    }

    // Admin force takeover
    try {
      setTakeoverLoading(true);
      await forceTakeover(appointmentId);
      toast.success('Administrative takeover successful');
      setShowTakeoverDialog(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to force takeover';
      toast.error(message);
    } finally {
      setTakeoverLoading(false);
    }
  }, [isAdmin, forceTakeover, appointmentId]);

  const handleConfirmTakeover = useCallback(async () => {
    try {
      setTakeoverLoading(true);
      
      if (isAdmin) {
        await forceTakeover(appointmentId);
        toast.success('Administrative takeover successful');
      } else {
        await requestTakeover(appointmentId);
        toast.success('Takeover request sent to administrators');
        toast.info('You will be notified when your request is processed');
      }
      
      setShowTakeoverDialog(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process takeover';
      toast.error(message);
    } finally {
      setTakeoverLoading(false);
    }
  }, [isAdmin, forceTakeover, requestTakeover, appointmentId]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isCurrentUserLockOwner) {
      toast.error('You must start editing first by clicking "Start Editing" to acquire the lock');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.date || !formData.time) {
      toast.error('Date and time are required');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      if (onSave) {
        await onSave(formData);
        toast.success('Appointment saved successfully');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save appointment';
      setSaveError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [canEdit, formData, onSave]);

  // Format time remaining for lock expiry
  const formatTimeRemaining = useCallback((expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const remaining = Math.max(0, expiry - now);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Live time remaining update
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  useEffect(() => {
    if (!currentLock?.expiresAt) {
      setTimeRemaining('');
      return;
    }

    const interval = setInterval(() => {
      // currentLock.expiresAt is already a string, no need to call toISOString()
      const expiresAtString = typeof currentLock.expiresAt === 'string' 
        ? currentLock.expiresAt 
        : currentLock.expiresAt.toISOString();
      setTimeRemaining(formatTimeRemaining(expiresAtString));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentLock?.expiresAt, formatTimeRemaining]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with Connection Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Edit Appointment
          </h1>
          <p className="text-muted-foreground">
            Real-time collaborative editing with lock management
          </p>
        </div>

        {/* Active Users Count */}
        {userCursors.size > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {userCursors.size} other user{userCursors.size !== 1 ? 's' : ''} active
          </Badge>
        )}
      </div>

      {/* Lock Status Card */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            "rounded-lg border p-4 transition-all duration-200",
            isLocked && !isCurrentUserLockOwner
              ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
              : isCurrentUserLockOwner
              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
              : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                isLocked && !isCurrentUserLockOwner
                  ? "bg-red-100 dark:bg-red-900/50"
                  : isCurrentUserLockOwner
                  ? "bg-green-100 dark:bg-green-900/50"
                  : "bg-gray-100 dark:bg-gray-900/50"
              )}>
                {lockLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                ) : isLocked ? (
                  <Lock className={cn(
                    "h-5 w-5",
                    isCurrentUserLockOwner ? "text-green-600" : "text-red-600"
                  )} />
                ) : (
                  <Unlock className="h-5 w-5 text-gray-600" />
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">
                    {lockLoading
                      ? 'Processing...'
                      : isLocked && !isCurrentUserLockOwner
                      ? `Locked by ${lockOwnerName}`
                      : isCurrentUserLockOwner
                      ? 'You have control'
                      : 'Available for editing'
                    }
                  </h3>
                  {isAdmin && isLocked && !isCurrentUserLockOwner && (
                    <Crown className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isCurrentUserLockOwner && timeRemaining
                    ? `Lock expires in ${timeRemaining}`
                    : isLocked && !isCurrentUserLockOwner
                    ? 'Wait for the lock to be released or contact an admin'
                    : 'Click "Start Editing" to begin making changes'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isLocked && (
                <Button 
                  onClick={handleAcquireLock} 
                  disabled={lockLoading}
                  className="flex items-center gap-2"
                >
                  {lockLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Start Editing
                </Button>
              )}
              
              {isCurrentUserLockOwner && (
                <Button 
                  variant="outline" 
                  onClick={handleReleaseLock} 
                  disabled={lockLoading}
                  className="flex items-center gap-2"
                >
                  {lockLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                  Release Lock
                </Button>
              )}

              {isAdmin && isLocked && !isCurrentUserLockOwner && (
                <Button 
                  variant="destructive" 
                  onClick={handleForceReleaseLock} 
                  disabled={lockLoading}
                  className="flex items-center gap-2"
                >
                  {lockLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Crown className="h-4 w-4" />
                  )}
                  Force Release
                </Button>
              )}

              {/* Takeover Control Button */}
              {isLocked && !isCurrentUserLockOwner && (
                <Button 
                  variant={isAdmin ? "destructive" : "secondary"}
                  onClick={handleRequestTakeover} 
                  disabled={lockLoading || takeoverLoading}
                  className="flex items-center gap-2"
                >
                  {takeoverLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isAdmin ? (
                    <Shield className="h-4 w-4" />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                  {takeoverLoading ? (
                    isAdmin ? 'Taking Over...' : 'Requesting...'
                  ) : (
                    isAdmin ? 'Force Takeover' : 'Request Control'
                  )}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Error Messages */}
      {(lockError || saveError) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {lockError || saveError}
          </AlertDescription>
        </Alert>
      )}

      {/* Collaborative Editing Area */}
      <FollowerPointerCard
        title={`${userName} (${userEmail})`}
        className="border rounded-lg p-1"
      >
        <div
          ref={editorRef}
          onMouseMove={handleMouseMove}
          className="relative p-6 bg-white dark:bg-gray-900 rounded-lg min-h-[600px]"
        >
          {/* Other Users' Cursors */}
          {Array.from(userCursors.values()).map((cursor) => (
            <motion.div
              key={cursor.userId}
              className="absolute z-10 pointer-events-none"
              style={{
                left: cursor.position.x,
                top: cursor.position.y,
                color: cursor.color,
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <div 
                className="w-3 h-3 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: cursor.color }}
              />
              <div 
                className="mt-1 px-2 py-1 rounded text-xs text-white shadow-lg whitespace-nowrap"
                style={{ backgroundColor: cursor.color }}
              >
                {cursor.userInfo.name}
              </div>
            </motion.div>
          ))}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Appointment Title *
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter appointment title"
                disabled={!canEdit}
                className={cn(
                  "text-lg transition-all duration-200",
                  !canEdit && "opacity-50 cursor-not-allowed"
                )}
                required
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date *
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  disabled={!canEdit}
                  className={cn(!canEdit && "opacity-50 cursor-not-allowed")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time *
                </Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  disabled={!canEdit}
                  className={cn(!canEdit && "opacity-50 cursor-not-allowed")}
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter meeting location or video call link"
                disabled={!canEdit}
                className={cn(!canEdit && "opacity-50 cursor-not-allowed")}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Add appointment details, agenda, or notes"
                rows={6}
                disabled={!canEdit}
                className={cn(!canEdit && "opacity-50 cursor-not-allowed")}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4 relative z-20">
              <Button
                type="submit"
                disabled={!canEdit || isSaving}
                className="flex items-center gap-2 relative z-30"
                style={{ pointerEvents: 'auto' }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSaving}
                className="relative z-30"
                style={{ pointerEvents: 'auto' }}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto relative z-30"
                title="Refresh data"
                style={{ pointerEvents: 'auto' }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </FollowerPointerCard>

      {/* Help Text */}
      <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h4 className="font-medium mb-2">Real-time Collaboration Features:</h4>
        <ul className="space-y-1 list-disc list-inside">
          <li>🔒 <strong>Lock Management:</strong> Acquire a lock to edit, release when done</li>
          <li>👥 <strong>Live Cursors:</strong> See where other users are working in real-time</li>
          <li>🔄 <strong>Auto-sync:</strong> Changes are synchronized across all connected users</li>
          <li>👑 <strong>Admin Override:</strong> Administrators can force-release locks when needed</li>
          <li>🎯 <strong>Takeover Control:</strong> Request or force control when appointment is locked</li>
        </ul>
      </div>

      {/* Takeover Confirmation Dialog */}
      <AlertDialog open={showTakeoverDialog} onOpenChange={setShowTakeoverDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {isAdmin ? (
                <>
                  <Shield className="h-5 w-5 text-red-500" />
                  Force Takeover Lock
                </>
              ) : (
                <>
                  <Users className="h-5 w-5 text-blue-500" />
                  Request Lock Control
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAdmin ? (
                <>
                  This will immediately remove the lock from{' '}
                  <strong>{lockOwnerName}</strong> and grant it to you.
                  This action cannot be undone and the current user will lose
                  any unsaved changes.
                </>
              ) : (
                <>
                  This will send a request to administrators to take control
                  of this appointment from <strong>{lockOwnerName}</strong>.
                  You will be notified when your request is processed.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={takeoverLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTakeover}
              disabled={takeoverLoading}
              className={isAdmin ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {takeoverLoading ? (
                isAdmin ? 'Forcing Takeover...' : 'Sending Request...'
              ) : (
                isAdmin ? 'Force Takeover' : 'Send Request'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 