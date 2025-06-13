import React, { useState, useEffect } from 'react';
import { useLock } from '../contexts/LockContext';
import { Appointment } from '../types/appointment';
import { useFollowingPointer } from '../hooks/useFollowingPointer';
import FollowingPointer from './FollowingPointer';

interface AppointmentEditorProps {
  appointment: Appointment;
  userId: string;
  userInfo: { name: string; email: string; isAdmin?: boolean };
  onSave: (updatedAppointment: Appointment) => Promise<void>;
}

export const AppointmentEditor: React.FC<AppointmentEditorProps> = ({
  appointment,
  userId,
  userInfo,
  onSave
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
    
    if (!isCurrentUserLockOwner) {
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveError(null);
      await onSave(formData);
      // Optionally release lock after successful save
      // await handleReleaseLock();
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
    <div className="relative">
      {/* Lock status indicator */}
      <div className="mb-4 p-4 rounded-lg bg-gray-50 border">
        {isLocked ? (
          <div className="flex items-center justify-between">
            <div>
              {isCurrentUserLockOwner ? (
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span>You are currently editing this appointment</span>
                  <span className="ml-2 text-sm text-gray-500">
                    (Lock expires in {formatTimeLeft(timeLeft)})
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  <span>
                    This appointment is being edited by {currentLock?.userInfo.name}
                  </span>
                </div>
              )}
            </div>
            <div>
              {isCurrentUserLockOwner ? (
                <button
                  onClick={handleReleaseLock}
                  disabled={lockLoading}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
                >
                  Release Lock
                </button>
              ) : userInfo.isAdmin ? (
                <button
                  onClick={handleForceReleaseLock}
                  disabled={lockLoading}
                  className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md"
                >
                  Force Take Control (Admin)
                </button>
              ) : (
                <button
                  onClick={handleAcquireLock}
                  disabled={lockLoading}
                  className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                >
                  Request Control
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-gray-300 rounded-full mr-2"></span>
              <span>This appointment is available for editing</span>
            </div>
            <button
              onClick={handleAcquireLock}
              disabled={lockLoading}
              className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md"
            >
              {lockLoading ? 'Loading...' : 'Edit Appointment'}
            </button>
          </div>
        )}
        
        {lockError && (
          <div className="mt-2 text-sm text-red-500">{lockError}</div>
        )}
      </div>

      {/* Appointment form */}
      <form onSubmit={handleSubmit} className="space-y-4">
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
            disabled={!isCurrentUserLockOwner}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              !isCurrentUserLockOwner ? 'bg-gray-100' : ''
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
            disabled={!isCurrentUserLockOwner}
            rows={4}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              !isCurrentUserLockOwner ? 'bg-gray-100' : ''
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
              disabled={!isCurrentUserLockOwner}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                !isCurrentUserLockOwner ? 'bg-gray-100' : ''
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
              disabled={!isCurrentUserLockOwner}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                !isCurrentUserLockOwner ? 'bg-gray-100' : ''
              }`}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={handleInputChange as any}
            disabled={!isCurrentUserLockOwner}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              !isCurrentUserLockOwner ? 'bg-gray-100' : ''
            }`}
            required
          >
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {isCurrentUserLockOwner && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {saveError && (
          <div className="mt-2 text-sm text-red-500">{saveError}</div>
        )}
      </form>

      {/* Display other users' cursors */}
      {Object.entries(userCursors).map(([cursorUserId, { position, userInfo }]) => (
        <FollowingPointer
          key={cursorUserId}
          x={position.x}
          y={position.y}
          userName={userInfo.name}
          color={cursorUserId === currentLock?.userId ? '#ef4444' : '#3b82f6'}
        />
      ))}
    </div>
  );
};

export default AppointmentEditor;
