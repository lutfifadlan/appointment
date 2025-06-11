import { AppointmentLock, LockResponse } from '../models/appointmentLock';
import { v4 as uuidv4 } from 'uuid';
import websocketService from './websocketService';

class LockService {
  private locks: Map<string, AppointmentLock> = new Map();
  private lockTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly LOCK_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Get the current lock status for an appointment
   */
  getLockStatus(appointmentId: string): LockResponse {
    const lock = this.locks.get(appointmentId);
    
    if (!lock) {
      return {
        success: true,
        message: 'Appointment is not locked',
      };
    }

    // Check if lock has expired
    if (new Date() > lock.expiresAt) {
      this.releaseLock(appointmentId, lock.userId);
      return {
        success: true,
        message: 'Appointment is not locked',
      };
    }

    return {
      success: true,
      message: 'Appointment is locked',
      lock,
    };
  }

  /**
   * Attempt to acquire a lock on an appointment
   */
  acquireLock(
    appointmentId: string,
    userId: string,
    userInfo: { name: string; email: string; position?: { x: number; y: number } }
  ): LockResponse {
    // Check if appointment is already locked
    const existingLock = this.locks.get(appointmentId);
    
    if (existingLock && existingLock.userId !== userId) {
      // Check if lock has expired
      if (new Date() > existingLock.expiresAt) {
        this.releaseLock(appointmentId, existingLock.userId);
      } else {
        return {
          success: false,
          message: `Appointment is currently locked by ${existingLock.userInfo.name}`,
          lock: existingLock,
        };
      }
    }

    // Create or update lock
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.LOCK_EXPIRY_MS);
    
    const lock: AppointmentLock = {
      appointmentId,
      userId,
      userInfo,
      expiresAt,
      createdAt: now,
    };

    this.locks.set(appointmentId, lock);
    
    // Clear any existing timeout for this appointment
    if (this.lockTimeouts.has(appointmentId)) {
      clearTimeout(this.lockTimeouts.get(appointmentId)!);
    }
    
    // Set timeout to auto-release lock after expiry
    const timeout = setTimeout(() => {
      this.releaseLock(appointmentId, userId);
    }, this.LOCK_EXPIRY_MS);
    
    this.lockTimeouts.set(appointmentId, timeout);

    // Notify clients about the lock acquisition
    websocketService.notifyLockAcquired(appointmentId, lock);

    return {
      success: true,
      message: 'Lock acquired successfully',
      lock,
    };
  }

  /**
   * Release a lock on an appointment
   */
  releaseLock(appointmentId: string, userId: string): LockResponse {
    const lock = this.locks.get(appointmentId);
    
    if (!lock) {
      return {
        success: false,
        message: 'Appointment is not locked',
      };
    }

    // Only the lock owner or an admin can release the lock
    // Admin check would be implemented here in a real application
    if (lock.userId !== userId) {
      return {
        success: false,
        message: 'You do not have permission to release this lock',
        lock,
      };
    }

    // Release the lock
    this.locks.delete(appointmentId);
    
    // Clear the timeout
    if (this.lockTimeouts.has(appointmentId)) {
      clearTimeout(this.lockTimeouts.get(appointmentId)!);
      this.lockTimeouts.delete(appointmentId);
    }

    // Notify clients about the lock release
    websocketService.notifyLockReleased(appointmentId);

    return {
      success: true,
      message: 'Lock released successfully',
    };
  }

  /**
   * Force release a lock (admin only)
   */
  forceReleaseLock(appointmentId: string, adminId: string): LockResponse {
    // In a real application, we would verify that adminId belongs to an admin user
    const lock = this.locks.get(appointmentId);
    
    if (!lock) {
      return {
        success: false,
        message: 'Appointment is not locked',
      };
    }

    // Release the lock
    this.locks.delete(appointmentId);
    
    // Clear the timeout
    if (this.lockTimeouts.has(appointmentId)) {
      clearTimeout(this.lockTimeouts.get(appointmentId)!);
      this.lockTimeouts.delete(appointmentId);
    }

    // Notify clients about the admin takeover
    websocketService.notifyAdminTakeover(appointmentId, adminId, { 
      name: 'Admin', // In a real app, we would get the admin's name
      email: 'admin@example.com' // In a real app, we would get the admin's email
    });

    return {
      success: true,
      message: `Lock forcibly released by admin (${adminId})`,
    };
  }

  /**
   * Update user position (for collaborative cursors)
   */
  updateUserPosition(
    appointmentId: string,
    userId: string,
    position: { x: number; y: number }
  ): LockResponse {
    const lock = this.locks.get(appointmentId);
    
    if (!lock || lock.userId !== userId) {
      return {
        success: false,
        message: 'You do not have an active lock on this appointment',
      };
    }

    // Update position
    lock.userInfo.position = position;
    
    // Reset expiry time to prevent timeout during active editing
    const now = new Date();
    lock.expiresAt = new Date(now.getTime() + this.LOCK_EXPIRY_MS);
    
    // Clear and reset timeout
    if (this.lockTimeouts.has(appointmentId)) {
      clearTimeout(this.lockTimeouts.get(appointmentId)!);
    }
    
    const timeout = setTimeout(() => {
      this.releaseLock(appointmentId, userId);
    }, this.LOCK_EXPIRY_MS);
    
    this.lockTimeouts.set(appointmentId, timeout);

    // We don't need to notify about position updates here
    // as the client will send these directly via WebSocket

    return {
      success: true,
      message: 'Position updated and lock refreshed',
      lock,
    };
  }
}

export default new LockService();
