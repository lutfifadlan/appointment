export interface AppointmentLock {
  appointmentId: string;
  userId: string;
  userInfo: { 
    name: string; 
    email: string;
    position?: { x: number; y: number };
  };
  expiresAt: Date;
  createdAt: Date;
}

export interface LockResponse {
  success: boolean;
  message: string;
  lock?: AppointmentLock;
}

export interface Appointment {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: string;
  // Add other appointment fields as needed
}
