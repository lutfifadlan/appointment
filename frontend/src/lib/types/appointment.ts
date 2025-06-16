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

export interface Appointment {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: string;
  // Add other appointment fields as needed
}

// Lock History Types
export interface LockHistoryItem {
  id: string;
  appointmentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: 'acquired' | 'released' | 'expired' | 'force_released';
  timestamp: Date;
  duration?: number; // Duration in seconds
  releasedBy?: string; // For force releases
  lockId?: string;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
    optimisticLocking?: boolean;
    expectedVersion?: number;
    actualVersion?: number;
    [key: string]: unknown;
  };
}

export interface LockStatistics {
  totalAcquisitions: number;
  totalReleases: number;
  totalExpired: number;
  totalForceReleases: number;
  averageDuration: number; // In seconds
  uniqueUsers: number;
}

export interface LockHistoryResponse {
  success: boolean;
  data: LockHistoryItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface LockStatisticsResponse {
  success: boolean;
  data: LockStatistics;
}
