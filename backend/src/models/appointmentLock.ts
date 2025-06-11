export interface AppointmentLock {
  appointmentId: string;
  userId: string;
  userInfo: { 
    name: string; 
    email: string;
    position?: { x: number; y: number }; // Bonus: position data
  };
  expiresAt: Date;
  createdAt: Date;
}

export interface LockResponse {
  success: boolean;
  message: string;
  lock?: AppointmentLock;
}
