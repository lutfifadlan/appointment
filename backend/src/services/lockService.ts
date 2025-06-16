import { AppointmentLock, LockResponse } from '../models/appointmentLock';
import websocketService from './websocketService';
import { AppDataSource } from '../config/data-source';
import { AppointmentLockEntity } from '../entities/AppointmentLockEntity';
import { LessThan, MoreThan, Repository } from 'typeorm';
import lockHistoryService from './lockHistoryService';
import { LockAction } from '../entities/LockHistoryEntity';

export interface IWebsocketService {
  notifyLockAcquired: (appointmentId: string, lock: AppointmentLock) => void;
  notifyLockReleased: (appointmentId: string) => void;
  notifyAdminTakeover: (appointmentId: string, adminId: string, adminInfo: { name: string; email: string }) => void;
  notifyLockChange: (appointmentId: string, lock: AppointmentLock | null) => void;
}

export class LockService {
  private readonly LOCK_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  private lockRepository: Repository<AppointmentLockEntity>;
  private websocketService: IWebsocketService;

  constructor(
    repository?: Repository<AppointmentLockEntity>,
    wsService?: IWebsocketService
  ) {
    this.lockRepository = repository || AppDataSource.getRepository(AppointmentLockEntity);
    this.websocketService = wsService || websocketService;
  }
  
  /**
   * Helper method to clean up expired locks
   */
  private async cleanupExpiredLocks(appointmentId: string): Promise<void> {
    const now = new Date();
    
    // Find expired locks before deleting them to record in history
    const expiredLocks = await this.lockRepository.find({
      where: {
        appointmentId,
        expiresAt: LessThan(now)
      }
    });
    
    // Record expired locks in history
    for (const lock of expiredLocks) {
      try {
        const duration = Math.floor((now.getTime() - lock.createdAt.getTime()) / 1000);
        await lockHistoryService.recordLockAction(
          appointmentId,
          lock.userId,
          lock.userInfo.name,
          lock.userInfo.email,
          LockAction.EXPIRED,
          {
            duration,
            lockId: lock.id,
            metadata: {
              userAgent: 'backend-service',
              sessionId: lock.id,
              expiredAt: now.toISOString()
            }
          }
        );
      } catch (error) {
        console.error('Failed to record expired lock in history:', error);
      }
    }
    
    // Delete expired locks
    await this.lockRepository.delete({
      appointmentId,
      expiresAt: LessThan(now)
    });
  }

  /**
   * Convert entity to AppointmentLock interface
   */
  private entityToLock(entity: AppointmentLockEntity): AppointmentLock {
    return {
      appointmentId: entity.appointmentId,
      userId: entity.userId,
      userInfo: entity.userInfo,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt
    };
  }

  /**
   * Get the current lock status for an appointment
   */
  async getLockStatus(appointmentId: string): Promise<LockResponse> {
    // Find lock in database
    const lock = await this.lockRepository.findOne({
      where: { 
        appointmentId,
        expiresAt: MoreThan(new Date()) // Only get non-expired locks
      }
    });
    
    if (!lock) {
      // Clean up any expired locks
      await this.cleanupExpiredLocks(appointmentId);
      
      return {
        success: true,
        message: 'Appointment is not locked',
      };
    }

    return {
      success: true,
      message: 'Appointment is locked',
      lock: this.entityToLock(lock),
    };
  }

  /**
   * Attempt to acquire a lock on an appointment
   */
  async acquireLock(
    appointmentId: string,
    userId: string,
    userInfo: { name: string; email: string; position?: { x: number; y: number } }
  ): Promise<LockResponse> {
    // Check if appointment is already locked
    const existingLock = await this.lockRepository.findOne({
      where: { 
        appointmentId,
        expiresAt: MoreThan(new Date()) 
      }
    });
    
    if (existingLock && existingLock.userId !== userId) {
      return {
        success: false,
        message: `Appointment is currently locked by ${existingLock.userInfo.name}`,
        lock: this.entityToLock(existingLock),
      };
    }

    // Clean up any expired locks
    await this.cleanupExpiredLocks(appointmentId);

    // Create or update lock
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.LOCK_EXPIRY_MS);
    
    // If there's an existing lock by the same user, update it
    let lockEntity: AppointmentLockEntity;
    let isNewLock = false;
    
    if (existingLock) {
      existingLock.expiresAt = expiresAt;
      if (userInfo) {
        existingLock.userInfo = userInfo;
      }
      lockEntity = await this.lockRepository.save(existingLock);
    } else {
      // Create a new lock entity
      lockEntity = new AppointmentLockEntity();
      lockEntity.appointmentId = appointmentId;
      lockEntity.userId = userId;
      lockEntity.userInfo = userInfo;
      lockEntity.expiresAt = expiresAt;
      
      // Save to database
      lockEntity = await this.lockRepository.save(lockEntity);
      isNewLock = true;
    }
    
    const lock = this.entityToLock(lockEntity);
    
    // Record lock acquisition in history (only for new locks)
    if (isNewLock) {
      try {
        await lockHistoryService.recordLockAction(
          appointmentId,
          userId,
          userInfo.name,
          userInfo.email,
          LockAction.ACQUIRED,
          {
            lockId: lockEntity.id,
            metadata: {
              userAgent: 'backend-service', // In a real app, we'd get this from request headers
              sessionId: lockEntity.id
            }
          }
        );
      } catch (error) {
        console.error('Failed to record lock acquisition in history:', error);
        // Don't fail the lock acquisition if history recording fails
      }
    }
    
    // Notify clients about the lock acquisition
    this.websocketService.notifyLockAcquired(appointmentId, lock);

    return {
      success: true,
      message: 'Lock acquired successfully',
      lock,
    };
  }

  /**
   * Release a lock on an appointment
   */
  async releaseLock(appointmentId: string, userId: string): Promise<LockResponse> {
    const lock = await this.lockRepository.findOne({
      where: { appointmentId }
    });
    
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
        lock: this.entityToLock(lock),
      };
    }

    // Calculate duration before removing the lock
    const duration = Math.floor((new Date().getTime() - lock.createdAt.getTime()) / 1000);
    
    // Record lock release in history
    try {
      await lockHistoryService.recordLockAction(
        appointmentId,
        userId,
        lock.userInfo.name,
        lock.userInfo.email,
        LockAction.RELEASED,
        {
          duration,
          lockId: lock.id,
          metadata: {
            userAgent: 'backend-service',
            sessionId: lock.id
          }
        }
      );
    } catch (error) {
      console.error('Failed to record lock release in history:', error);
    }

    // Release the lock by removing it from the database
    await this.lockRepository.remove(lock);

    // Notify clients about the lock release
    this.websocketService.notifyLockReleased(appointmentId);

    return {
      success: true,
      message: 'Lock released successfully',
    };
  }

  /**
   * Force release a lock (admin only)
   */
  async forceReleaseLock(appointmentId: string, adminId: string): Promise<LockResponse> {
    // In a real application, we would verify that adminId belongs to an admin user
    const lock = await this.lockRepository.findOne({
      where: { appointmentId }
    });
    
    if (!lock) {
      return {
        success: false,
        message: 'Appointment is not locked',
      };
    }

    // Calculate duration before removing the lock
    const duration = Math.floor((new Date().getTime() - lock.createdAt.getTime()) / 1000);
    
    // Record force release in history
    try {
      await lockHistoryService.recordLockAction(
        appointmentId,
        lock.userId,
        lock.userInfo.name,
        lock.userInfo.email,
        LockAction.FORCE_RELEASED,
        {
          duration,
          releasedBy: adminId,
          lockId: lock.id,
          metadata: {
            userAgent: 'backend-service',
            sessionId: lock.id,
            adminAction: true
          }
        }
      );
    } catch (error) {
      console.error('Failed to record force release in history:', error);
    }

    // Release the lock by removing it from the database
    await this.lockRepository.remove(lock);

    // Notify clients about the admin takeover
    this.websocketService.notifyAdminTakeover(appointmentId, adminId, { 
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
  async updateUserPosition(
    appointmentId: string,
    userId: string,
    position: { x: number; y: number }
  ): Promise<LockResponse> {
    const lock = await this.lockRepository.findOne({
      where: { appointmentId }
    });
    
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
    
    // Save updated lock to database
    await this.lockRepository.save(lock);

    // We don't need to notify about position updates here
    // as the client will send these directly via WebSocket

    return {
      success: true,
      message: 'Position updated and lock refreshed',
      lock: this.entityToLock(lock),
    };
  }
}

export default new LockService();
