"use client";
import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconReport,
  IconLock,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Appointment } from "@/components/Appointment";
import { LockManagement } from "@/components/LockManagement";
import { LockProvider } from "@/lib/contexts/LockContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RealtimeAppointmentEditor } from "@/components/RealtimeAppointmentEditor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/hooks/useSocket";
import { Wifi, WifiOff, Edit3, ArrowLeft, Sun, Moon, LogOutIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

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

interface AppointmentData {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState("appointments");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, isAdmin } = useAuth();
  
  // Debug logging
  useEffect(() => {
    console.log('Dashboard - User:', user);
    console.log('Dashboard - isAdmin:', isAdmin);
  }, [user, isAdmin]);
  const { isConnected } = useSocket();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate user color for collaborative features
  const userColor = React.useMemo(() => {
    if (!user?.id) return '#0ea5e9';
    const colors = [
      '#0ea5e9', '#737373', '#14b8a6', '#22c55e',
      '#3b82f6', '#ef4444', '#eab308', '#f97316',
      '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16'
    ];
    let hash = 0;
    for (let i = 0; i < user.id.length; i++) {
      hash = ((hash << 5) - hash + user.id.charCodeAt(i)) & 0xffffffff;
    }
    return colors[Math.abs(hash) % colors.length];
  }, [user?.id]);

  useEffect(() => {
    const fetchSession = async () => {
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      console.log(data);
      if (data.error) {
        router.push("/auth/signin");
      }
    };
    fetchSession();
  }, [router]);

  const handleRealtimeEdit = (appointment: Appointment) => {
    console.log('handleRealtimeEdit called with:', appointment.title);
    console.log('Current activeTab before change:', activeTab);
    setSelectedAppointment(appointment);
    setActiveTab("realtime");
    console.log('Set activeTab to: realtime');
  };

  const handleLockAppointment = (appointment: Appointment) => {
    console.log('handleLockAppointment called with:', appointment.title);
    console.log('Current activeTab before change:', activeTab);
    setSelectedAppointment(appointment);
    setActiveTab("locks");
    console.log('Set activeTab to: locks');
  };

  const handleExitRealtimeEdit = () => {
    setActiveTab("appointments");
  };

  const handleRealtimeSave = async (data: AppointmentData) => {
    if (!selectedAppointment) {
      toast.error('No appointment selected');
      return;
    }

    try {
      // Convert form data to backend format
      const startDateTime = new Date(`${data.date}T${data.time}`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default 1 hour duration

      const appointmentData = {
        title: data.title,
        description: data.description,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        location: data.location || null,
        status: selectedAppointment.status, // Keep existing status
        organizer: selectedAppointment.organizer,
        attendees: selectedAppointment.attendees,
      };

      console.log('Saving appointment data:', appointmentData);

      // Update the appointment via API
      const response = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update appointment');
      }

      const updatedAppointment = await response.json();
      console.log('Appointment updated successfully:', updatedAppointment);

      // Release the lock automatically
      try {
        const lockResponse = await fetch(`/api/appointments/${selectedAppointment.id}/release-lock`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.id }),
        });

        if (lockResponse.ok) {
          console.log('Lock released successfully');
          toast.success('Changes saved and lock released');
        } else {
          console.warn('Failed to release lock, but appointment was saved');
          toast.success('Changes saved (but lock release failed)');
        }
      } catch (lockError) {
        console.error('Error releasing lock:', lockError);
        toast.success('Changes saved (but lock release failed)');
      }

      // Redirect to appointments tab automatically
      setActiveTab("appointments");
      
      // Clear selected appointment and trigger refresh
      setSelectedAppointment(null);
      setRefreshTrigger(prev => prev + 1);

    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save appointment';
      toast.error(errorMessage);
      throw error; // Re-throw to let the RealtimeAppointmentEditor handle it
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      router.replace('/auth/signin');
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/auth/signin');
    }
  };

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: (
        <IconReport className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: mounted ? (theme === "dark" ? "Light" : "Dark") : "Theme",
      href: "#",
      icon: mounted ? (
        theme === "dark" ? (
          <Sun className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
        ) : (
          <Moon className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
        )
      ) : (
        <Sun className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
      onClick: handleThemeToggle,
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <LogOutIcon className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
      onClick: handleLogout,
    },
  ];

  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800 relative",
        "h-screen"
      )}
    >      
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10 bg-white dark:bg-neutral-900 relative z-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: `${user?.name || "User"} • ${isAdmin ? "Admin" : "User"}`,
                href: "#",
                icon: (
                  <div className="relative">
                    <Image
                      src="/avatar-placeholder.png"
                      className="h-7 w-7 shrink-0 rounded-full"
                      width={50}
                      height={50}
                      alt="Avatar"
                    />
                    {isAdmin && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full border border-white dark:border-neutral-900 flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">A</span>
                      </div>
                    )}
                  </div>
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      <div className="flex flex-1">
        <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl border border-neutral-200 bg-white/95 backdrop-blur-sm p-2 md:p-10 dark:border-neutral-700 dark:bg-neutral-900/95 overflow-y-auto relative z-10">
          
          {/* Selected Appointment Banner */}
          {selectedAppointment && (
            <div className="mb-6 rounded-lg border-l-4 border-l-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedAppointment.title}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {new Date(selectedAppointment.startDate).toLocaleString()} • {selectedAppointment.location}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-medium",
                    selectedAppointment.status === "scheduled"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : selectedAppointment.status === "completed"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                  )}
                >
                  {selectedAppointment.status}
                </span>
              </div>
            </div>
          )}

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => {
            console.log('Tab changing from', activeTab, 'to', value);
            setActiveTab(value);
          }} className="space-y-6 flex-1 flex flex-col overflow-hidden">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
                <TabsTrigger value="appointments" className="flex items-center gap-2">
                  <IconReport className="h-4 w-4" />
                  Appointments
                </TabsTrigger>
                <TabsTrigger value="locks" className="flex items-center gap-2">
                  <IconLock className="h-4 w-4" />
                  Locks
                </TabsTrigger>
                <TabsTrigger value="realtime" className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Real-time Editor
                </TabsTrigger>
              </TabsList>
              
              {/* Real-time connection status */}
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Badge variant="default" className="flex items-center space-x-1">
                    <Wifi className="h-3 w-3" />
                    <span>Connected</span>
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center space-x-1">
                    <WifiOff className="h-3 w-3" />
                    <span>Disconnected</span>
                  </Badge>
                )}
              </div>
            </div>

            {/* Appointment CRUD Tab */}
            <TabsContent value="appointments" className="space-y-6 flex-1 overflow-y-auto">
              <Appointment
                userId={user?.id || ""}
                onAppointmentSelect={handleLockAppointment}
                onAppointmentEdit={handleRealtimeEdit}
                selectedAppointmentId={selectedAppointment?.id}
                refreshTrigger={refreshTrigger}
              />
            </TabsContent>

            {/* Lock Management Tab */}
            <TabsContent value="locks" className="space-y-6 flex-1 overflow-y-auto">
              <LockProvider
                appointmentId={selectedAppointment?.id}
                userId={user?.id || ""}
              >
                <LockManagement
                  selectedAppointmentId={selectedAppointment?.id}
                  userId={user?.id || ""}
                  userName={user?.name || ""}
                  userEmail={user?.email || ""}
                  userColor={userColor}
                  isAdmin={isAdmin}
                />
              </LockProvider>
            </TabsContent>

            {/* Real-time Editor Tab */}
            <TabsContent value="realtime" className="space-y-6 flex-1 overflow-y-auto">
              {selectedAppointment ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Edit3 className="h-5 w-5" />
                          Real-time Appointment Editor
                        </CardTitle>
                        <CardDescription>
                          Collaborate with other users in real-time to edit this appointment
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleExitRealtimeEdit}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to List
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <RealtimeAppointmentEditor
                      appointmentId={selectedAppointment.id}
                      userId={user?.id || ""}
                      userName={user?.name || ""}
                      userEmail={user?.email || ""}
                      isAdmin={isAdmin}
                      initialData={{
                        id: selectedAppointment.id,
                        title: selectedAppointment.title,
                        description: selectedAppointment.description,
                        date: new Date(selectedAppointment.startDate).toISOString().split('T')[0],
                        time: new Date(selectedAppointment.startDate).toTimeString().slice(0, 5),
                        location: selectedAppointment.location || '',
                      }}
                      onSave={handleRealtimeSave}
                      onCancel={handleExitRealtimeEdit}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Edit3 className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Appointment Selected</h3>
                    <p className="text-muted-foreground mb-4">
                      Select an appointment from the Appointments tab to start real-time editing
                    </p>
                    <Button 
                      onClick={() => setActiveTab("appointments")}
                      className="flex items-center gap-2"
                    >
                      <IconReport className="h-4 w-4" />
                      Go to Appointments
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </div>
  );
}

const Logo = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = mounted && theme === "dark" ? "/logo.png" : "/logo-nobg.png";

  return (
    <a
      href="#"
      className="relative z-20 flex items-center justify-start space-x-2 py-1 text-md font-normal"
    >
      <Image
        src={logoSrc}
        className="shrink-0"
        width={28}
        height={28}
        alt="Logo"
      />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-semibold whitespace-pre"
      >
        SyncPoint
      </motion.span>
    </a>
  );
};

const LogoIcon = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = mounted && theme === "dark" ? "/logo.png" : "/logo-nobg.png";

  return (
    <a
      href="#"
      className="relative z-20 flex items-center justify-start space-x-2 py-1 text-sm font-normal"
    >
      <Image
        src={logoSrc}
        className="shrink-0"
        alt="Logo"
        width={28}
        height={28}
      />
    </a>
  );
};

