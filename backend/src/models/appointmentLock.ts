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
  version: number; // For optimistic locking
}

export interface LockResponse {
  success: boolean;
  message: string;
  lock?: AppointmentLock;
  conflictDetails?: {
    currentVersion: number;
    expectedVersion: number;
    conflictingUser: {
      name: string;
      email: string;
    };
  };
}

export class OptimisticLockError extends Error {
  constructor(
    public expectedVersion: number,
    public currentVersion: number,
    public conflictingUser: { name: string; email: string },
    message: string
  ) {
    super(message);
    this.name = 'OptimisticLockError';
  }
}
