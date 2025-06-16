import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, User, Save, Plus, Edit, Trash2, Eye, CalendarIcon, Lock, Unlock, Clock as ClockIcon, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
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

interface Appointment {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string | null;
  organizer: string | null;
  attendees: string[] | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

interface LockInfo {
  userInfo?: {
    name?: string;
  };
  expiresAt?: string;
}

interface AppointmentCRUDProps {
  userId: string;
  onAppointmentSelect?: (appointment: Appointment) => void;
  selectedAppointmentId?: string;
}

// Real-time lock-aware form wrapper component with WebSocket integration
function LockAwareForm({ 
  appointmentId, 
  userId, 
  children, 
  isDisabled, 
  onLockStatusChange 
}: { 
  appointmentId?: string;
  userId: string;
  children: React.ReactNode;
  isDisabled: boolean;
  onLockStatusChange?: (isLocked: boolean, lockedBy: string | null) => void;
}) {
  const [lockStatus, setLockStatus] = useState<{ isLocked: boolean; lockedBy: string | null; expiresAt: number | null }>({
    isLocked: false,
    lockedBy: null,
    expiresAt: null
  });
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Real-time lock status updates using WebSocket
  useEffect(() => {
    if (!appointmentId) return;

    // Import socket.io client and setup real-time connection
    import('socket.io-client').then(({ io }) => {
      const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8088', {
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 5000,
      });

      socket.on('connect', () => {
        console.log('🔌 Connected to real-time server');
        // Subscribe to appointment updates
        socket.emit('subscribe', appointmentId);
      });

      socket.on('disconnect', () => {
        console.log('🔌 Disconnected from real-time server');
      });

      // Listen for real-time lock updates
      socket.on('lock-acquired', (data: { appointmentId: string; lock: LockInfo }) => {
        if (data.appointmentId === appointmentId) {
          console.log('🔒 Lock acquired in real-time:', data.lock);
          setLockStatus({
            isLocked: true,
            lockedBy: data.lock?.userInfo?.name || null,
            expiresAt: data.lock?.expiresAt ? new Date(data.lock.expiresAt).getTime() : null
          });
          onLockStatusChange?.(true, data.lock?.userInfo?.name || null);
        }
      });

      socket.on('lock-released', (data: { appointmentId: string }) => {
        if (data.appointmentId === appointmentId) {
          console.log('🔓 Lock released in real-time');
          setLockStatus({
            isLocked: false,
            lockedBy: null,
            expiresAt: null
          });
          onLockStatusChange?.(false, null);
        }
      });

      socket.on('lock-update', (data: { appointmentId: string; lock: LockInfo | null }) => {
        if (data.appointmentId === appointmentId) {
          console.log('🔄 Lock updated in real-time:', data.lock);
          if (data.lock) {
            setLockStatus({
              isLocked: true,
              lockedBy: data.lock?.userInfo?.name || null,
              expiresAt: data.lock?.expiresAt ? new Date(data.lock.expiresAt).getTime() : null
            });
            onLockStatusChange?.(true, data.lock?.userInfo?.name || null);
          } else {
            setLockStatus({
              isLocked: false,
              lockedBy: null,
              expiresAt: null
            });
            onLockStatusChange?.(false, null);
          }
        }
      });

      // Initial fetch of lock status
      const fetchInitialLockStatus = async () => {
        try {
          const response = await fetch(`/api/appointments/${appointmentId}/lock-status`);
          if (response.ok) {
            const data = await response.json();
            setLockStatus({
              isLocked: !!data.lock,
              lockedBy: data.lock?.userInfo?.name || null,
              expiresAt: data.lock?.expiresAt ? new Date(data.lock.expiresAt).getTime() : null
            });
            onLockStatusChange?.(!!data.lock, data.lock?.userInfo?.name || null);
          }
        } catch (error) {
          console.error('Failed to fetch initial lock status:', error);
        }
      };

      fetchInitialLockStatus();

      return () => {
        socket.disconnect();
      };
    }).catch(error => {
      console.error('Failed to setup real-time connection:', error);
    });
  }, [appointmentId, onLockStatusChange]);

  // Update countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (lockStatus.expiresAt) {
      interval = setInterval(() => {
        const remaining = Math.max(0, lockStatus.expiresAt! - Date.now());
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          clearInterval(interval);
          setLockStatus(prev => ({ ...prev, isLocked: false, lockedBy: null, expiresAt: null }));
        }
      }, 1000);

      // Set initial value
      const remaining = Math.max(0, lockStatus.expiresAt - Date.now());
      setTimeRemaining(remaining);
    } else {
      setTimeRemaining(null);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockStatus.expiresAt]);

  const formatTimeRemaining = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const isFormLocked = lockStatus.isLocked && lockStatus.lockedBy !== userId;

  return (
    <div className="space-y-4">
      {/* Lock Status Indicator */}
      {appointmentId && lockStatus.isLocked && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200",
              isFormLocked 
                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200"
                : "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200"
            )}
          >
            <div className="flex items-center gap-3">
              {isFormLocked ? (
                <Lock className="h-5 w-5" />
              ) : (
                <Unlock className="h-5 w-5" />
              )}
              <div>
                <p className="font-medium">
                  {isFormLocked 
                    ? `Currently being edited by ${lockStatus.lockedBy}` 
                    : `You are editing this appointment`
                  }
                </p>
                {timeRemaining !== null && (
                  <div className="flex items-center gap-1 text-sm opacity-80">
                    <ClockIcon className="h-3 w-3" />
                    <span>
                      {isFormLocked ? 'Available in' : 'Lock expires in'} {formatTimeRemaining(timeRemaining)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {isFormLocked && (
              <AlertTriangle className="h-5 w-5" />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Form content with disabled state */}
      <div className={cn(
        "transition-opacity duration-200",
        (isDisabled || isFormLocked) && "opacity-60 pointer-events-none"
      )}>
        {children}
      </div>

      {/* Disabled overlay message */}
      {(isDisabled || isFormLocked) && (
        <Alert className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {isFormLocked 
              ? `This appointment is currently being edited by ${lockStatus.lockedBy}. Please wait for them to finish or try again later.`
              : 'Form is currently disabled for editing.'
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function AppointmentCRUD({
  userId,
  onAppointmentSelect,
  selectedAppointmentId,
}: AppointmentCRUDProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    status: 'scheduled' as Appointment['status'],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lockStatuses, setLockStatuses] = useState<Record<string, { isLocked: boolean; lockedBy: string | null }>>({});

  // Fetch appointments on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/appointments');
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const data = await response.json();
      setAppointments(data);
      
      // Fetch lock status for each appointment
      const lockPromises = data.map(async (appointment: Appointment) => {
        try {
          const lockResponse = await fetch(`/api/appointments/${appointment.id}/lock-status`);
          if (lockResponse.ok) {
            const lockData = await lockResponse.json();
            return {
              id: appointment.id,
              isLocked: !!lockData.lock,
              lockedBy: lockData.lock?.userInfo?.name || null
            };
          }
        } catch (error) {
          console.error(`Failed to fetch lock status for ${appointment.id}:`, error);
        }
        return { id: appointment.id, isLocked: false, lockedBy: null };
      });

      const lockResults = await Promise.all(lockPromises);
      const lockStatusMap = lockResults.reduce((acc, result) => {
        acc[result.id] = { isLocked: result.isLocked, lockedBy: result.lockedBy };
        return acc;
      }, {} as Record<string, { isLocked: boolean; lockedBy: string | null }>);
      
      setLockStatuses(lockStatusMap);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      status: 'scheduled',
    });
    setIsCreating(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateNew = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleEdit = (appointment: Appointment) => {
    // Check if appointment is locked by someone else
    const lockStatus = lockStatuses[appointment.id];
    if (lockStatus?.isLocked && lockStatus.lockedBy !== userId) {
      toast.error(`This appointment is currently being edited by ${lockStatus.lockedBy}`);
      return;
    }

    // Redirect to real-time editor tab instead of editing locally
    if (onAppointmentSelect) {
      onAppointmentSelect(appointment);
    } else {
      toast.error('Real-time editor is not available');
    }
  };



  const handleSave = useCallback(async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.date || !formData.time) {
      toast.error('Date and time are required');
      return;
    }

    setIsSaving(true);
    try {
      // Convert form data to backend format
      const startDateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default 1 hour duration

      const appointmentData = {
        title: formData.title,
        description: formData.description,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        location: formData.location || null,
        status: formData.status,
        organizer: null,
        attendees: null,
      };

      // Create new appointment
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) throw new Error('Failed to create appointment');

      const newAppointment = await response.json();
      setAppointments(prev => [...prev, newAppointment]);
      toast.success('Appointment created successfully');

      resetForm();
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save appointment');
    } finally {
      setIsSaving(false);
    }
  }, [formData]);

  const handleDelete = useCallback(async (appointment: Appointment) => {
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete appointment');

      setAppointments(prev => prev.filter(apt => apt.id !== appointment.id));
      toast.success('Appointment deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete appointment');
    }
  }, []);

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const formatAppointmentDateTime = (startDate: string) => {
    if (!startDate) {
      return {
        date: 'Invalid Date',
        time: 'Invalid Time',
      };
    }
    
    try {
      const date = parseISO(startDate);
      return {
        date: format(date, 'MMM dd, yyyy'),
        time: format(date, 'HH:mm'),
      };
    } catch {
      return {
        date: 'Invalid Date',
        time: 'Invalid Time',
      };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading appointments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Appointment
            </CardTitle>
            <CardDescription>
              Fill in the details below to create a new appointment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LockAwareForm
              appointmentId={undefined}
              userId={userId}
              isDisabled={isSaving}
              onLockStatusChange={() => {}}
            >
              <form className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter appointment title"
                    required
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? format(new Date(formData.date), "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData.date ? new Date(formData.date) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              handleInputChange('date', format(date, 'yyyy-MM-dd'));
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time *
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
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
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter meeting location or video call link"
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
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Add appointment details, agenda, or notes"
                    rows={4}
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4">
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Create Appointment
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </LockAwareForm>
          </CardContent>
        </Card>
      )}

      {/* Create Button */}
      {!isCreating && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Appointments</h2>
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Appointment
          </Button>
        </div>
      )}

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Appointments</CardTitle>
          <CardDescription>
            View and manage all your appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No appointments found</p>
                <p className="text-sm">Create your first appointment to get started</p>
              </div>
            ) : (
              appointments.map((appointment) => {
                const { date, time } = formatAppointmentDateTime(appointment.startDate);
                return (
                  <div
                    key={appointment.id}
                    className={`border rounded-lg p-4 space-y-3 transition-colors ${
                      appointment.id === selectedAppointmentId 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{appointment.title}</h3>
                          {/* Lock Status Indicator */}
                          {lockStatuses[appointment.id]?.isLocked && (
                            <div className="flex items-center gap-1 text-xs">
                              <Lock className="h-3 w-3 text-red-500" />
                              <span className="text-red-600 font-medium">
                                {lockStatuses[appointment.id].lockedBy === userId 
                                  ? 'Editing' 
                                  : `Locked by ${lockStatuses[appointment.id].lockedBy}`
                                }
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {appointment.location || 'No location'}
                          </span>
                        </div>
                        {appointment.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {appointment.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        {appointment.createdAt && (
                          <>
                            Created: {format(parseISO(appointment.createdAt), 'MMM dd, yyyy')}
                            {appointment.updatedAt && appointment.updatedAt !== appointment.createdAt && (
                              <span className="ml-2">
                                • Updated: {format(parseISO(appointment.updatedAt), 'MMM dd, yyyy')}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAppointmentSelect?.(appointment)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Select
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(appointment)}
                          disabled={lockStatuses[appointment.id]?.isLocked && lockStatuses[appointment.id]?.lockedBy !== userId}
                          className={cn(
                            "flex items-center gap-1",
                            lockStatuses[appointment.id]?.isLocked && lockStatuses[appointment.id]?.lockedBy !== userId
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          )}
                          title={
                            lockStatuses[appointment.id]?.isLocked && lockStatuses[appointment.id]?.lockedBy !== userId
                              ? `Currently being edited by ${lockStatuses[appointment.id]?.lockedBy}`
                              : "Edit appointment"
                          }
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={lockStatuses[appointment.id]?.isLocked && lockStatuses[appointment.id]?.lockedBy !== userId}
                              className={cn(
                                "flex items-center gap-1 text-destructive hover:text-destructive",
                                lockStatuses[appointment.id]?.isLocked && lockStatuses[appointment.id]?.lockedBy !== userId
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              )}
                              title={
                                lockStatuses[appointment.id]?.isLocked && lockStatuses[appointment.id]?.lockedBy !== userId
                                  ? `Cannot delete while being edited by ${lockStatuses[appointment.id]?.lockedBy}`
                                  : "Delete appointment"
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{appointment.title}&quot;? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(appointment)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 