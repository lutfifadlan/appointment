"use client";
import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconArrowLeft,
  IconSettings,
  IconReport,
  IconLock,
  IconLockOpen,
  IconUser,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useAppointmentLock } from "@/hooks/useAppointmentLock";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "next/navigation";

interface Appointment {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: "scheduled" | "completed" | "cancelled";
  location?: string;
  organizer?: string;
  attendees?: string[];
  version: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { user, isAdmin } = useAuth();
  const { socket } = useSocket();

  const {
    lock,
    isLoading: isLockLoading,
    error: lockError,
    acquireLock,
    releaseLock,
    forceReleaseLock,
    hasLock,
    isLocked,
  } = useAppointmentLock(selectedAppointment?.id || "");

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

    const fetchAppointments = async () => {
      try {
        const response = await fetch("/api/appointments");
        const data = await response.json();
        
        // Check if data is an array
        if (!Array.isArray(data)) {
          console.error("Received invalid data format:", data);
          setAppointments([]);
          return;
        }
        
        setAppointments(data);
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
        setAppointments([]);
      }
    };

    fetchAppointments();
  }, []);

  useEffect(() => {
    if (!socket || !selectedAppointment) return;

    socket.on("appointment-update", (updatedAppointment: Appointment) => {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === updatedAppointment.id ? updatedAppointment : apt
        )
      );
    });

    return () => {
      socket.off("appointment-update");
    };
  }, [socket, selectedAppointment]);

  const handleAppointmentSelect = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleLockToggle = async () => {
    if (!selectedAppointment) return;

    if (hasLock()) {
      await releaseLock();
    } else {
      await acquireLock();
    }
  };

  const handleForceRelease = async () => {
    if (!selectedAppointment || !isAdmin) return;
    await forceReleaseLock();
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
      label: "Settings",
      href: "#",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
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
        <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl border border-neutral-200 bg-white p-2 md:p-10 dark:border-neutral-700 dark:bg-neutral-900">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className={cn(
                  "cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md",
                  selectedAppointment?.id === appointment.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-neutral-200 dark:border-neutral-700"
                )}
                onClick={() => handleAppointmentSelect(appointment)}
              >
                <h3 className="font-semibold">{appointment.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {new Date(appointment.startDate).toLocaleString()}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-xs",
                      appointment.status === "scheduled"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : appointment.status === "completed"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                    )}
                  >
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selectedAppointment && (
            <div className="mt-8 rounded-lg border border-neutral-200 p-6 dark:border-neutral-700">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">{selectedAppointment.title}</h2>
                <div className="flex items-center gap-4">
                  {isLocked && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <IconUser className="h-4 w-4" />
                      <span>
                        Locked by: {lock?.userInfo.name} (
                        {new Date(lock!.expiresAt).toLocaleTimeString()})
                      </span>
                    </div>
                  )}
                  <button
                    onClick={handleLockToggle}
                    disabled={isLockLoading}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                      hasLock()
                        ? "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                    )}
                  >
                    {hasLock() ? (
                      <>
                        <IconLockOpen className="h-4 w-4" />
                        Release Lock
                      </>
                    ) : (
                      <>
                        <IconLock className="h-4 w-4" />
                        Acquire Lock
                      </>
                    )}
                  </button>
                  {isAdmin && isLocked && !hasLock() && (
                    <button
                      onClick={handleForceRelease}
                      className="flex items-center gap-2 rounded-md bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-800 transition-colors hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
                    >
                      Force Release
                    </button>
                  )}
                </div>
              </div>

              {lockError && (
                <div className="mb-4 rounded-md bg-red-100 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                  {lockError}
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-semibold">Details</h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Start:</span>{" "}
                      {new Date(selectedAppointment.startDate).toLocaleString()}
                    </p>
                    <p>
                      <span className="font-medium">End:</span>{" "}
                      {new Date(selectedAppointment.endDate).toLocaleString()}
                    </p>
                    <p>
                      <span className="font-medium">Location:</span>{" "}
                      {selectedAppointment.location || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Organizer:</span>{" "}
                      {selectedAppointment.organizer || "N/A"}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">Description</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {selectedAppointment.description || "No description provided"}
                  </p>
                </div>
              </div>

              {selectedAppointment.attendees && selectedAppointment.attendees.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-2 font-semibold">Attendees</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAppointment.attendees.map((attendee, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-neutral-100 px-3 py-1 text-sm dark:bg-neutral-800"
                      >
                        {attendee}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
