import { describe, beforeEach, afterEach, expect, it, jest } from '@jest/globals';
import { Repository, MoreThan, LessThan, DeleteResult } from 'typeorm';
import { LockService, IWebsocketService } from '../../src/services/lockService';
import { AppointmentLockEntity } from '../../src/entities/AppointmentLockEntity';
import { AppointmentLock } from '../../src/models/appointmentLock';

// Mock declarations must be at the top
jest.mock('../../src/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

jest.mock('../../src/services/websocketService', () => ({
  __esModule: true,
  default: {
    notifyLockAcquired: jest.fn(),
    notifyLockReleased: jest.fn(),
    notifyAdminTakeover: jest.fn(),
    notifyLockChange: jest.fn()
  }
}));

// Mock TypeORM operators
jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm') as Record<string, unknown>;
  return {
    ...actual,
    MoreThan: jest.fn((value) => ({ type: 'MoreThan', value })),
    LessThan: jest.fn((value) => ({ type: 'LessThan', value }))
  };
});

// Create mock websocket service
const mockWebsocketService: IWebsocketService = {
  notifyLockAcquired: jest.fn(),
  notifyLockReleased: jest.fn(),
  notifyAdminTakeover: jest.fn(),
  notifyLockChange: jest.fn()
};

// Create the mock repository
const mockRepository = {
  findOne: jest.fn(),
  delete: jest.fn(),
  save: jest.fn(),
  remove: jest.fn()
} as unknown as Repository<AppointmentLockEntity>;

// Create a new instance of LockService for each test
let lockService: LockService;

// Helper function to create mock lock data
const createMockLock = (overrides = {}): AppointmentLockEntity => {
  const lock = new AppointmentLockEntity();
  Object.assign(lock, {
    id: 'test-lock-id',
    appointmentId: 'test-appointment-id',
    userId: 'test-user-id',
    userInfo: { name: 'Test User', email: 'test@example.com' },
    expiresAt: new Date(Date.now() + 3600000),
    createdAt: new Date(),
    ...overrides
  });
  return lock;
};

describe('LockService', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    // Create a new instance for each test with the mock dependencies
    lockService = new LockService(mockRepository, mockWebsocketService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getLockStatus', () => {
    it('should return not locked status when no lock exists', async () => {
      jest.spyOn(mockRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(mockRepository, 'delete').mockResolvedValue({ affected: 0, raw: [] });

      const result = await lockService.getLockStatus('test-appointment-id');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Appointment is not locked');
      expect(result.lock).toBeUndefined();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { 
          appointmentId: 'test-appointment-id',
          expiresAt: expect.objectContaining({ type: 'MoreThan' })
        }
      });
      expect(mockRepository.delete).toHaveBeenCalledWith({
        appointmentId: 'test-appointment-id',
        expiresAt: expect.objectContaining({ type: 'LessThan' })
      });
    });

    it('should return locked status when active lock exists', async () => {
      const mockLock = createMockLock();
      jest.spyOn(mockRepository, 'findOne').mockResolvedValue(mockLock);

      const result = await lockService.getLockStatus('test-appointment-id');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Appointment is locked');
      expect(result.lock).toBeDefined();
      expect(result.lock?.appointmentId).toBe('test-appointment-id');
      expect(result.lock?.userId).toBe('test-user-id');
    });
  });

  describe('acquireLock', () => {
    it('should acquire lock successfully', async () => {
      const mockLock = createMockLock();
      jest.spyOn(mockRepository, 'findOne').mockImplementation(async (options) => {
        const where = options?.where as { appointmentId?: string };
        if (where?.appointmentId === 'test-appointment-id') {
          return null;
        }
        return mockLock;
      });
      jest.spyOn(mockRepository, 'save').mockResolvedValue(mockLock);

      const result = await lockService.acquireLock('test-appointment-id', 'test-user-id', {
        name: 'Test User',
        email: 'test@example.com'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Lock acquired successfully');
      expect(result.lock).toEqual(expect.objectContaining({
        appointmentId: 'test-appointment-id',
        userId: 'test-user-id',
        userInfo: { name: 'Test User', email: 'test@example.com' }
      }));
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { 
          appointmentId: 'test-appointment-id',
          expiresAt: MoreThan(new Date())
        }
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockWebsocketService.notifyLockAcquired).toHaveBeenCalledWith(
        'test-appointment-id',
        expect.objectContaining({
          appointmentId: 'test-appointment-id',
          userId: 'test-user-id'
        })
      );
    });

    it('should return error when lock already exists', async () => {
      const existingLock = createMockLock({
        userId: 'other-user-id',
        userInfo: { name: 'Other User', email: 'other@example.com' }
      });
      jest.spyOn(mockRepository, 'findOne').mockImplementation(async (options) => {
        const where = options?.where as { appointmentId?: string };
        if (where?.appointmentId === 'test-appointment-id') {
          return existingLock;
        }
        return null;
      });

      const result = await lockService.acquireLock('test-appointment-id', 'test-user-id', {
        name: 'Test User',
        email: 'test@example.com'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(`Appointment is currently locked by ${existingLock.userInfo.name}`);
      expect(result.lock).toEqual(expect.objectContaining({
        appointmentId: 'test-appointment-id',
        userId: 'other-user-id',
        userInfo: { name: 'Other User', email: 'other@example.com' }
      }));
    });

    it('should update existing lock if owned by same user', async () => {
      const existingLock = createMockLock();
      const updatedLock = createMockLock({ expiresAt: new Date(Date.now() + 7200000) });
      jest.spyOn(mockRepository, 'findOne').mockImplementation(async (options) => {
        const where = options?.where as { appointmentId?: string };
        if (where?.appointmentId === 'test-appointment-id') {
          return existingLock;
        }
        return null;
      });
      jest.spyOn(mockRepository, 'save').mockResolvedValue(updatedLock);

      const result = await lockService.acquireLock('test-appointment-id', 'test-user-id', {
        name: 'Test User',
        email: 'test@example.com'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Lock acquired successfully');
      expect(result.lock).toEqual(expect.objectContaining({
        appointmentId: 'test-appointment-id',
        userId: 'test-user-id',
        userInfo: { name: 'Test User', email: 'test@example.com' }
      }));
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('releaseLock', () => {
    it('should release lock successfully', async () => {
      const mockLock = createMockLock();
      jest.spyOn(mockRepository, 'findOne').mockResolvedValue(mockLock);
      jest.spyOn(mockRepository, 'remove').mockResolvedValue(mockLock);

      const result = await lockService.releaseLock('test-appointment-id', 'test-user-id');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Lock released successfully');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { appointmentId: 'test-appointment-id' }
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockLock);
      expect(mockWebsocketService.notifyLockReleased).toHaveBeenCalledWith('test-appointment-id');
    });

    it('should return error when lock not found', async () => {
      jest.spyOn(mockRepository, 'findOne').mockResolvedValue(null);

      const result = await lockService.releaseLock('test-appointment-id', 'test-user-id');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Appointment is not locked');
    });

    it('should return error when user is not the lock owner', async () => {
      const mockLock = createMockLock({ userId: 'other-user-id' });
      jest.spyOn(mockRepository, 'findOne').mockResolvedValue(mockLock);

      const result = await lockService.releaseLock('test-appointment-id', 'test-user-id');
      expect(result.success).toBe(false);
      expect(result.message).toBe('You do not have permission to release this lock');
      expect(result.lock).toEqual(expect.objectContaining({
        appointmentId: 'test-appointment-id',
        userId: 'other-user-id',
        userInfo: { name: 'Test User', email: 'test@example.com' }
      }));
    });
  });

  describe('forceReleaseLock', () => {
    it('should force release lock successfully', async () => {
      const mockLock = createMockLock();
      jest.spyOn(mockRepository, 'findOne').mockResolvedValue(mockLock);
      jest.spyOn(mockRepository, 'remove').mockResolvedValue(mockLock);

      const result = await lockService.forceReleaseLock('test-appointment-id', 'admin-id');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Lock forcibly released by admin (admin-id)');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { appointmentId: 'test-appointment-id' }
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockLock);
      expect(mockWebsocketService.notifyAdminTakeover).toHaveBeenCalledWith(
        'test-appointment-id',
        'admin-id',
        { name: 'Admin', email: 'admin@example.com' }
      );
    });

    it('should return error when lock not found', async () => {
      jest.spyOn(mockRepository, 'findOne').mockResolvedValue(null);

      const result = await lockService.forceReleaseLock('test-appointment-id', 'admin-id');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Appointment is not locked');
    });
  });

  describe('updateUserPosition', () => {
    it('should update position successfully', async () => {
      const mockLock = createMockLock();
      const updatedLock = createMockLock({
        userInfo: { 
          ...mockLock.userInfo,
          position: { x: 100, y: 200 }
        }
      });
      jest.spyOn(mockRepository, 'findOne').mockResolvedValue(mockLock);
      jest.spyOn(mockRepository, 'save').mockResolvedValue(updatedLock);

      const result = await lockService.updateUserPosition(
        'test-appointment-id',
        'test-user-id',
        { x: 100, y: 200 }
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Position updated and lock refreshed');
      expect(result.lock).toEqual(expect.objectContaining({
        appointmentId: 'test-appointment-id',
        userId: 'test-user-id',
        userInfo: { 
          name: 'Test User', 
          email: 'test@example.com',
          position: { x: 100, y: 200 }
        }
      }));
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should return error when lock not found', async () => {
      jest.spyOn(mockRepository, 'findOne').mockResolvedValue(null);

      const result = await lockService.updateUserPosition(
        'test-appointment-id',
        'test-user-id',
        { x: 100, y: 200 }
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('You do not have an active lock on this appointment');
    });

    it('should return error when user is not the lock owner', async () => {
      const mockLock = createMockLock({ userId: 'other-user-id' });
      jest.spyOn(mockRepository, 'findOne').mockResolvedValue(mockLock);

      const result = await lockService.updateUserPosition(
        'test-appointment-id',
        'test-user-id',
        { x: 100, y: 200 }
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('You do not have an active lock on this appointment');
    });
  });
});

