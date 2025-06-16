"use client";
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppointmentCRUD } from './AppointmentCRUD';
import { LockManagement } from './LockManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { 
  Calendar, 
  Lock, 
  Users, 
  Shield, 
  Activity,
  FileText,
  HelpCircle
} from 'lucide-react';

interface Appointment {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: 'draft' | 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface AppointmentDashboardProps {
  userId: string;
  userName: string;
  userEmail: string;
  isAdmin?: boolean;
}

export function AppointmentDashboard({
  userId,
  userName,
  userEmail,
  isAdmin = false,
}: AppointmentDashboardProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState('appointments');

  // Generate a consistent color for the user
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

  const handleAppointmentSelect = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setActiveTab('locks'); // Switch to lock management when appointment is selected
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Appointment System
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Manage appointments and collaborative editing locks
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">{userName}</p>
                <p className="text-sm text-gray-600">{userEmail}</p>
              </div>
              {isAdmin && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              )}
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: userColor }}
              >
                {userName.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Selected Appointment Banner */}
        {selectedAppointment && (
          <Card className="mb-6 border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedAppointment.title}</CardTitle>
                  <CardDescription>
                    {selectedAppointment.date} at {selectedAppointment.time} • {selectedAppointment.location}
                  </CardDescription>
                </div>
                <Badge 
                  variant={selectedAppointment.status === 'scheduled' ? 'default' : 'secondary'}
                >
                  {selectedAppointment.status}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Appointment Management
            </TabsTrigger>
            <TabsTrigger value="locks" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Lock Management
            </TabsTrigger>
          </TabsList>

          {/* Appointment CRUD Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="grid gap-6">
              {/* Section Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Appointment Data Management</CardTitle>
                      <CardDescription>
                        Create, read, update, and delete appointment information
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <h3 className="font-medium">Create</h3>
                      <p className="text-sm text-gray-600">Add new appointments</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <h3 className="font-medium">Read & Update</h3>
                      <p className="text-sm text-gray-600">View and modify details</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Activity className="h-8 w-8 mx-auto mb-2 text-red-600" />
                      <h3 className="font-medium">Delete</h3>
                      <p className="text-sm text-gray-600">Remove appointments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Appointment CRUD Component */}
              <AppointmentCRUD
                userId={userId}
                userName={userName}
                onAppointmentSelect={handleAppointmentSelect}
                selectedAppointmentId={selectedAppointment?.id}
              />
            </div>
          </TabsContent>

          {/* Lock Management Tab */}
          <TabsContent value="locks" className="space-y-6">
            <div className="grid gap-6">
              {/* Section Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Lock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle>Collaborative Lock Management</CardTitle>
                      <CardDescription>
                        Control editing permissions and real-time collaboration
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Lock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <h3 className="font-medium">Acquire</h3>
                      <p className="text-sm text-gray-600">Get editing rights</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <h3 className="font-medium">Collaborate</h3>
                      <p className="text-sm text-gray-600">Real-time cursors</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Activity className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <h3 className="font-medium">Monitor</h3>
                      <p className="text-sm text-gray-600">Track activities</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-red-600" />
                      <h3 className="font-medium">Admin Control</h3>
                      <p className="text-sm text-gray-600">Force operations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Lock Management Component */}
              <LockManagement
                selectedAppointmentId={selectedAppointment?.id}
                userId={userId}
                userName={userName}
                userEmail={userEmail}
                userColor={userColor}
                isAdmin={isAdmin}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-blue-600">📅 Appointment Management</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• <strong>Create:</strong> Add new appointments with all details</li>
                  <li>• <strong>Read:</strong> View appointment information and metadata</li>
                  <li>• <strong>Update:</strong> Modify appointment details and status</li>
                  <li>• <strong>Delete:</strong> Remove appointments with confirmation</li>
                  <li>• <strong>Status Tracking:</strong> Draft, scheduled, completed, cancelled</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-amber-600">🔒 Lock Management</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• <strong>Acquire:</strong> Get exclusive editing rights (5 min timeout)</li>
                  <li>• <strong>Release:</strong> Give up editing control manually</li>
                  <li>• <strong>Monitor:</strong> View real-time lock status and history</li>
                  <li>• <strong>Collaborate:</strong> See other users&apos; cursors in real-time</li>
                  <li>• <strong>Admin Override:</strong> Force release locks when needed</li>
                </ul>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                <strong>Tip:</strong> Select an appointment in the Management tab to see its lock status and collaborate in real-time
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 