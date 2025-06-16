"use client";
import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconArrowLeft,
  IconReport,
  IconLock,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { AppointmentCRUD } from "@/components/AppointmentCRUD";
import { LockManagement } from "@/components/LockManagement";
import { LockProvider } from "@/lib/contexts/LockContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function Dashboard() {
  const router = useRouter();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState("appointments");
  const { user, isAdmin } = useAuth();

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

  const handleAppointmentSelect = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setActiveTab("locks"); // Switch to lock management when appointment is selected
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

  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: (
        <IconReport className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
      onClick: handleLogout,
    },
  ];

  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800",
        "h-screen"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
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
                label: user?.name || "User",
                href: "#",
                icon: (
                  <Image
                    src="/avatar-placeholder.png"
                    className="h-7 w-7 shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      <div className="flex flex-1">
        <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl border border-neutral-200 bg-white p-2 md:p-10 dark:border-neutral-700 dark:bg-neutral-900 overflow-y-auto">
          
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="appointments" className="flex items-center gap-2">
                <IconReport className="h-4 w-4" />
                Appointment Management
              </TabsTrigger>
              <TabsTrigger value="locks" className="flex items-center gap-2">
                <IconLock className="h-4 w-4" />
                Lock Management
              </TabsTrigger>
            </TabsList>

            {/* Appointment CRUD Tab */}
            <TabsContent value="appointments" className="space-y-6 flex-1 overflow-y-auto">
              <AppointmentCRUD
                userId={user?.id || ""}
                onAppointmentSelect={handleAppointmentSelect}
                selectedAppointmentId={selectedAppointment?.id}
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
          </Tabs>

        </div>
      </div>
    </div>
  );
}

const Logo = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center justify-start space-x-2 py-1 text-md font-normal"
    >
      <Image
        src="/logo-nobg.png"
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
  return (
    <a
      href="#"
      className="relative z-20 flex items-center justify-start space-x-2 py-1 text-sm font-normal"
    >
      <Image
        src="/logo-nobg.png"
        className="shrink-0"
        alt="Logo"
        width={28}
        height={28}
      />
    </a>
  );
};

