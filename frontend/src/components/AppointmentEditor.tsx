import React, { useState, useCallback } from 'react';
import { LockedForm } from './LockedForm';
import { FollowerPointerCard } from './ui/following-pointer';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, User, Save, RefreshCw } from 'lucide-react';

interface AppointmentEditorProps {
  appointmentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  isAdmin?: boolean;
  initialData?: {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
  };
}

export function AppointmentEditor({
  appointmentId,
  userId,
  userName,
  userEmail,
  isAdmin = false,
  initialData,
}: AppointmentEditorProps) {
  const [formData, setFormData] = useState(initialData || {
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Generate a consistent color for the user based on their ID
  const userColor = React.useMemo(() => {
    const colors = [
      '#0ea5e9', '#737373', '#14b8a6', '#22c55e',
      '#3b82f6', '#ef4444', '#eab308', '#f97316',
      '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16'
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
    }
    return colors[Math.abs(hash) % colors.length];
  }, [userId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = useCallback(async (formData: FormData): Promise<boolean> => {
    setIsSaving(true);
    try {
      // Convert FormData to object
      const data = Object.fromEntries(formData);
      
      // Add metadata for optimistic locking
      const submissionData = {
        ...data,
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
        version: Date.now(), // Simple versioning
      };

      // Simulate API call
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save appointment');
      }

      toast.success('Appointment saved successfully!');
      return true;
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save appointment');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [appointmentId, userId]);

  const handleLockAcquired = useCallback(() => {
    toast.success('🔒 You now have editing control');
  }, []);

  const handleLockReleased = useCallback(() => {
    toast.info('🔓 Editing control released');
  }, []);

  const handleLockConflict = useCallback((lockedBy: string) => {
    toast.warning(`⚠️ ${lockedBy} is currently editing this appointment`);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Appointment</h1>
          <p className="text-muted-foreground">
            Make changes to your appointment details with real-time collaboration
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Collaborative Editing Area */}
      <FollowerPointerCard
        title={`${userName} (${userEmail})`}
        className="border rounded-lg p-1"
      >
        <LockedForm
          appointmentId={appointmentId}
          isAdmin={isAdmin}
          userId={userId}
          userName={userName}
          userColor={userColor}
          onLockAcquired={handleLockAcquired}
          onLockReleased={handleLockReleased}
          onLockConflict={handleLockConflict}
          onFormSubmit={handleFormSubmit}
          enableCollaborativeCursors={true}
          className="p-6"
        >
          {/* Form Fields */}
          <form className="space-y-6">
            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Appointment Title
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter appointment title"
                className="text-lg"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time
                </Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
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
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                type="submit"
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
                    Save Changes
                  </>
                )}
              </Button>
              
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </div>
          </form>
        </LockedForm>
      </FollowerPointerCard>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Collaborative Editing Features:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Real-time locking:</strong> Only one person can edit at a time</li>
          <li>• <strong>Live cursors:</strong> See where others are pointing</li>
          <li>• <strong>Auto-save:</strong> Changes are saved automatically</li>
          <li>• <strong>Conflict resolution:</strong> Handles simultaneous edits gracefully</li>
          <li>• <strong>Admin takeover:</strong> Administrators can force take control</li>
          <li>• <strong>Rate limiting:</strong> Prevents spam and abuse</li>
        </ul>
      </div>
    </div>
  );
} 