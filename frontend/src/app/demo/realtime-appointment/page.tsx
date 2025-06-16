"use client";

import React, { useState } from 'react';
import { RealtimeAppointmentEditor } from '@/components/RealtimeAppointmentEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Zap, 
  Lock, 
  MousePointer, 
  Wifi, 
  Monitor,
  Smartphone,
  Tablet,
  InfoIcon 
} from 'lucide-react';

interface DemoUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  device: 'desktop' | 'tablet' | 'mobile';
}

const demoUsers: DemoUser[] = [
  { id: 'user1', name: 'Alice Johnson', email: 'alice@company.com', isAdmin: true, device: 'desktop' },
  { id: 'user2', name: 'Bob Smith', email: 'bob@company.com', isAdmin: false, device: 'tablet' },
  { id: 'user3', name: 'Carol Davis', email: 'carol@company.com', isAdmin: false, device: 'mobile' },
];

const demoAppointmentData = {
  id: 'demo-appointment-123',
  title: 'Q4 Strategy Planning Meeting',
  description: 'Quarterly business review and strategic planning session for the upcoming quarter. We will discuss revenue targets, market expansion opportunities, and resource allocation.',
  date: '2024-01-15',
  time: '14:00',
  location: 'Conference Room A / Zoom: https://zoom.us/j/123456789',
};

export default function RealtimeAppointmentDemo() {
  const [selectedUser, setSelectedUser] = useState<DemoUser>(demoUsers[0]);

  const handleSave = async (data: unknown) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Saving appointment:', data);
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'desktop': return <Monitor className="h-3 w-3" />;
      case 'tablet': return <Tablet className="h-3 w-3" />;
      case 'mobile': return <Smartphone className="h-3 w-3" />;
      default: return <Monitor className="h-3 w-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Real-time Appointment Collaboration
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            Experience live collaborative editing with WebSocket technology
          </p>
          
          {/* Feature Highlights */}
          <div className="flex justify-center gap-4 mb-6">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              Live Updates
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Smart Locking
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <MousePointer className="h-3 w-3" />
              Live Cursors
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Real-time Sync
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* User Simulation Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Simulate User
                </CardTitle>
                <CardDescription>
                  Switch between different users to see collaborative features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {demoUsers.map((user) => (
                  <Button
                    key={user.id}
                    variant={selectedUser.id === user.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {getDeviceIcon(user.device)}
                      <div className="text-left flex-1">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                      {user.isAdmin && (
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <InfoIcon className="h-5 w-5" />
                  How to Test
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="space-y-2">
                  <p><strong>1. Switch Users:</strong> Select different users from the list above</p>
                  <p><strong>2. Acquire Lock:</strong> Click &quot;Start Editing&quot; to gain control</p>
                  <p><strong>3. Live Cursors:</strong> Move your mouse to see cursor tracking</p>
                  <p><strong>4. Collaborative:</strong> Open in multiple tabs to see real-time updates</p>
                  <p><strong>5. Admin Override:</strong> Test admin force-release functionality</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor">Live Editor</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
              </TabsList>
              
              <TabsContent value="editor" className="mt-4">
                <Alert className="mb-4">
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Currently editing as:</strong> {selectedUser.name} ({selectedUser.email})
                    {selectedUser.isAdmin && <Badge variant="secondary" className="ml-2">Admin</Badge>}
                  </AlertDescription>
                </Alert>

                <RealtimeAppointmentEditor
                  appointmentId={demoAppointmentData.id}
                  userId={selectedUser.id}
                  userName={selectedUser.name}
                  userEmail={selectedUser.email}
                  isAdmin={selectedUser.isAdmin}
                  initialData={demoAppointmentData}
                  onSave={handleSave}
                  onCancel={() => console.log('Cancelled')}
                />
              </TabsContent>
              
              <TabsContent value="features" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Lock Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Acquire locks before editing</li>
                        <li>• Auto-release after timeout</li>
                        <li>• Admin force-release capability</li>
                        <li>• Conflict resolution</li>
                        <li>• Optimistic locking with versioning</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MousePointer className="h-5 w-5" />
                        Live Cursors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Real-time cursor tracking</li>
                        <li>• User identification</li>
                        <li>• Smooth animations</li>
                        <li>• Auto-cleanup inactive cursors</li>
                        <li>• Throttled updates (50ms)</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wifi className="h-5 w-5" />
                        WebSocket Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Real-time bidirectional communication</li>
                        <li>• Automatic reconnection</li>
                        <li>• Connection status monitoring</li>
                        <li>• Room-based subscriptions</li>
                        <li>• Event-driven architecture</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Throttled cursor updates</li>
                        <li>• Efficient event handling</li>
                        <li>• Memory leak prevention</li>
                        <li>• Optimized re-renders</li>
                        <li>• Graceful error handling</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Technical Implementation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold mb-2">Frontend Technologies:</h4>
                        <ul className="space-y-1">
                          <li>• Next.js 15 with App Router</li>
                          <li>• TypeScript for type safety</li>
                          <li>• Socket.IO Client for WebSocket</li>
                          <li>• Framer Motion for animations</li>
                          <li>• Tailwind CSS for styling</li>
                          <li>• React Hooks for state management</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Backend Technologies:</h4>
                        <ul className="space-y-1">
                          <li>• Node.js with Express</li>
                          <li>• Socket.IO Server</li>
                          <li>• TypeORM with PostgreSQL</li>
                          <li>• Optimistic locking</li>
                          <li>• RESTful API design</li>
                          <li>• Comprehensive error handling</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
} 