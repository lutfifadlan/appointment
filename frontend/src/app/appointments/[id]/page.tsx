'use client';

import { useState, useEffect } from 'react';
import { LockProvider } from '../../../lib/contexts/LockContext';
import AppointmentEditor from '../../../lib/components/AppointmentEditor';
import { Appointment } from '../../../lib/types/appointment';
import { useParams } from 'next/navigation';

// Mock user data - in a real app, this would come from authentication
const CURRENT_USER = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  isAdmin: true
};

export default function AppointmentPage() {
  const params = useParams();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const appointmentId = params.id as string;

  // Fetch appointment data
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real app, this would be an API call
        const response = await fetch(`http://localhost:8088/api/appointments/${appointmentId}`);
        const data = await response.json();
        
        // For demo purposes, we'll use mock data
        const mockAppointment: Appointment = {
          id: appointmentId,
          title: 'Meeting with Client',
          description: 'Discuss project requirements and timeline',
          startDate: new Date('2025-06-15T10:00:00'),
          endDate: new Date('2025-06-15T11:00:00'),
          status: 'scheduled'
        };
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setAppointment(mockAppointment);
      } catch (err) {
        console.error('Error fetching appointment:', err);
        setError('Failed to load appointment data');
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  const handleSaveAppointment = async (updatedAppointment: Appointment): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:8088/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedAppointment),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save appointment');
      }
      
      // For demo purposes, we'll just update the local state
      setAppointment(updatedAppointment);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Appointment saved:', updatedAppointment);
    } catch (err) {
      console.error('Error saving appointment:', err);
      throw new Error('Failed to save appointment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error || 'Appointment not found'}</div>
      </div>
    );
  }

  return (
    <LockProvider appointmentId={appointmentId} userId={CURRENT_USER.id}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Edit Appointment</h1>
          <p className="text-gray-600">
            Make changes to the appointment details below. Only one user can edit at a time.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <AppointmentEditor
            appointment={appointment}
            userId={CURRENT_USER.id}
            userInfo={{
              name: CURRENT_USER.name,
              email: CURRENT_USER.email,
              isAdmin: CURRENT_USER.isAdmin
            }}
            onSave={handleSaveAppointment}
          />
        </div>
      </div>
    </LockProvider>
  );
}
