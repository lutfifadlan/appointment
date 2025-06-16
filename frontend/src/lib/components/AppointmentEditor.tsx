import React, { useState, useEffect } from 'react';
import { useLock } from '../contexts/LockContext';
import { Appointment } from '../types/appointment';
import { useFollowingPointer } from '../hooks/useFollowingPointer';
import FollowingPointer from './FollowingPointer';
import { Lock, Unlock, Clock, AlertCircle } from 'lucide-react';

interface AppointmentEditorProps {
  appointment: Appointment;
  userId: string;
  userInfo: { name: string; email: string; isAdmin?: boolean };
  onSave: (updatedAppointment: Appointment) => Promise<void>;
  isCreating?: boolean;
}

export const AppointmentEditor: React.FC<AppointmentEditorProps> = ({
  appointment,
  userId,
  userInfo,
  onSave,
  isCreating = false
}) => {
  const [formData, setFormData] = useState<Appointment>(appointment);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  const {
    isLocked,
    isCurrentUserLockOwner,
    currentLock,
    lockLoading,
    lockError,
    acquireLock,
    releaseLock,
    forceReleaseLock,
    updateUserPosition,
    userCursors
  } = useLock();

  // Get current user's cursor position
  const position = useFollowingPointer({ throttleAmount: 50 });

  // Update cursor position when it changes
  useEffect(() => {
    if (isCurrentUserLockOwner && appointment.id && userId) {
      updateUserPosition(appointment.id, userId, position);
    }
  }, [position, isCurrentUserLockOwner, appointment.id, userId, updateUserPosition]);

  // Calculate time left for the lock
  useEffect(() => {
    if (!currentLock || !isLocked) {
      setTimeLeft(0);
      return;
    }

    const expiresAt = new Date(currentLock.expiresAt).getTime();
    
    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const timeLeftMs = Math.max(0, expiresAt - now);
      setTimeLeft(Math.floor(timeLeftMs / 1000));
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    
    return () => clearInterval(interval);
  }, [currentLock, isLocked]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'startDate' | 'endDate') => {
    const date = new Date(e.target.value);
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  const handleAcquireLock = async () => {
    if (appointment.id && userId) {
      await acquireLock(appointment.id, userId, userInfo);
    }
  };

  const handleReleaseLock = async () => {
    if (appointment.id && userId) {
      await releaseLock(appointment.id, userId);
    }
  };

  const handleForceReleaseLock = async () => {
    if (appointment.id && userId && userInfo.isAdmin) {
      await forceReleaseLock(appointment.id, userId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isCreating && !isCurrentUserLockOwner) {
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveError(null);
      await onSave(formData);
    } catch (error) {
      console.error('Error saving appointment:', error);
      setSaveError('Failed to save appointment');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimeLeft = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Lock status and controls - only show for existing appointments */}
      {!isCreating && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          {isLocked ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${isCurrentUserLockOwner ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    {isCurrentUserLockOwner ? (
                      <Lock className="h-5 w-5 text-green-600" />
                    ) : (
                      <Unlock className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {isCurrentUserLockOwner ? 'You have control' : 'Currently being edited'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {isCurrentUserLockOwner 
                        ? 'You can edit this appointment'
                        : `Locked by ${currentLock?.userInfo.name || 'another user'}`}
                    </p>
                  </div>
                </div>
                
                {isCurrentUserLockOwner && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {formatTimeLeft(timeLeft)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                {isCurrentUserLockOwner ? (
                  <button
                    onClick={handleReleaseLock}
                    disabled={lockLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Release Control
                  </button>
                ) : userInfo.isAdmin ? (
                  <button
                    onClick={handleForceReleaseLock}
                    disabled={lockLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                  >
                    Force Take Control
                  </button>
                ) : (
                  <button
                    onClick={handleAcquireLock}
                    disabled={lockLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    Request Control
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-gray-100">
                  <Unlock className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Available for editing</h3>
                  <p className="text-sm text-gray-500">No one is currently editing this appointment</p>
                </div>
              </div>
              <button
                onClick={handleAcquireLock}
                disabled={lockLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                {lockLoading ? 'Loading...' : 'Start Editing'}
              </button>
            </div>
          )}
          
          {lockError && (
            <div className="mt-3 flex items-center space-x-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{lockError}</span>
            </div>
          )}
        </div>
      )}

      {/* Appointment form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              disabled={!isCreating && !isCurrentUserLockOwner}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                !isCreating && !isCurrentUserLockOwner ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={!isCreating && !isCurrentUserLockOwner}
              rows={4}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                !isCreating && !isCurrentUserLockOwner ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="datetime-local"
                id="startDate"
                name="startDate"
                value={formData.startDate instanceof Date ? formData.startDate.toISOString().slice(0, 16) : ''}
                onChange={(e) => handleDateChange(e, 'startDate')}
                disabled={!isCreating && !isCurrentUserLockOwner}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  !isCreating && !isCurrentUserLockOwner ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
                required
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="datetime-local"
                id="endDate"
                name="endDate"
                value={formData.endDate instanceof Date ? formData.endDate.toISOString().slice(0, 16) : ''}
                onChange={(e) => handleDateChange(e, 'endDate')}
                disabled={!isCreating && !isCurrentUserLockOwner}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  !isCreating && !isCurrentUserLockOwner ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : isCreating ? 'Create Appointment' : 'Save Changes'}
          </button>
        </div>

        {saveError && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{saveError}</span>
          </div>
        )}
      </form>

      {/* Collaborative cursors - only show for existing appointments */}
      {!isCreating && isLocked && (
        <div className="relative">
          {Object.entries(userCursors).map(([cursorUserId, cursor]) => (
            <FollowingPointer
              key={cursorUserId}
              userId={cursorUserId}
              userName={cursor.userInfo.name}
              x={cursor.position?.x || 0}
              y={cursor.position?.y || 0}
              color={cursorUserId === currentLock?.userId ? '#ef4444' : '#3b82f6'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentEditor;
