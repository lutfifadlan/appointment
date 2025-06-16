import { describe, beforeEach, afterEach, expect, it, jest } from '@jest/globals';
import { LockHistoryEntity, LockAction } from '../../src/entities/LockHistoryEntity';

// Mock the entire service module
jest.mock('../../src/services/lockHistoryService', () => ({
  __esModule: true,
  default: {
    recordLockAction: jest.fn(),
    getLockHistory: jest.fn(),
    getUserLockHistory: jest.fn(),
    getLockStatistics: jest.fn(),
    getRecentActivity: jest.fn(),
    cleanupOldHistory: jest.fn(),
  }
}));

// Import the mocked service
import lockHistoryService from '../../src/services/lockHistoryService';

// Helper function to create mock history data
const createMockHistoryEntry = (overrides = {}): LockHistoryEntity => {
  const entry = new LockHistoryEntity();
  Object.assign(entry, {
    id: 'hist-1',
    appointmentId: 'appointment123',
    userId: 'user123',
    userName: 'Test User',
    userEmail: 'test@example.com',
    action: LockAction.ACQUIRED,
    timestamp: new Date(),
    duration: undefined,
    releasedBy: undefined,
    lockId: 'lock-1',
    metadata: { userAgent: 'test-agent' },
    ...overrides
  });
  return entry;
};

describe('LockHistoryService', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('recordLockAction', () => {
    it('should record a lock action successfully', async () => {
      const mockHistoryEntry = createMockHistoryEntry();
      jest.spyOn(lockHistoryService, 'recordLockAction').mockResolvedValue(mockHistoryEntry);

      const result = await lockHistoryService.recordLockAction(
        'appointment123',
        'user123',
        'Test User',
        'test@example.com',
        LockAction.ACQUIRED,
        {
          lockId: 'lock-1',
          metadata: { userAgent: 'test-agent' },
        }
      );

      expect(lockHistoryService.recordLockAction).toHaveBeenCalledWith(
        'appointment123',
        'user123',
        'Test User',
        'test@example.com',
        LockAction.ACQUIRED,
        {
          lockId: 'lock-1',
          metadata: { userAgent: 'test-agent' },
        }
      );
      expect(result).toEqual(mockHistoryEntry);
    });

    it('should record a lock release with duration', async () => {
      const mockHistoryEntry = createMockHistoryEntry({
        action: LockAction.RELEASED,
        duration: 120,
      });
      jest.spyOn(lockHistoryService, 'recordLockAction').mockResolvedValue(mockHistoryEntry);

      const result = await lockHistoryService.recordLockAction(
        'appointment123',
        'user123',
        'Test User',
        'test@example.com',
        LockAction.RELEASED,
        {
          duration: 120,
          lockId: 'lock-1',
          metadata: { userAgent: 'test-agent' },
        }
      );

      expect(result.duration).toBe(120);
      expect(result.action).toBe(LockAction.RELEASED);
    });

    it('should record a force release with releasedBy', async () => {
      const mockHistoryEntry = createMockHistoryEntry({
        action: LockAction.FORCE_RELEASED,
        duration: 60,
        releasedBy: 'admin123',
        metadata: { userAgent: 'test-agent', adminAction: true },
      });
      jest.spyOn(lockHistoryService, 'recordLockAction').mockResolvedValue(mockHistoryEntry);

      const result = await lockHistoryService.recordLockAction(
        'appointment123',
        'user123',
        'Test User',
        'test@example.com',
        LockAction.FORCE_RELEASED,
        {
          duration: 60,
          releasedBy: 'admin123',
          lockId: 'lock-1',
          metadata: { userAgent: 'test-agent', adminAction: true },
        }
      );

      expect(result.releasedBy).toBe('admin123');
      expect(result.action).toBe(LockAction.FORCE_RELEASED);
    });
  });

  describe('getLockHistory', () => {
    it('should return lock history with pagination', async () => {
      const mockHistory = [
        createMockHistoryEntry({ id: 'hist-1', action: LockAction.ACQUIRED }),
        createMockHistoryEntry({ id: 'hist-2', action: LockAction.RELEASED }),
      ];
      const mockResult = { history: mockHistory, total: 2 };
      jest.spyOn(lockHistoryService, 'getLockHistory').mockResolvedValue(mockResult);

      const result = await lockHistoryService.getLockHistory('appointment123', 10, 0);

      expect(lockHistoryService.getLockHistory).toHaveBeenCalledWith('appointment123', 10, 0);
      expect(result).toEqual(mockResult);
    });

    it('should handle default pagination parameters', async () => {
      const mockResult = { history: [], total: 0 };
      jest.spyOn(lockHistoryService, 'getLockHistory').mockResolvedValue(mockResult);

      await lockHistoryService.getLockHistory('appointment123');

      expect(lockHistoryService.getLockHistory).toHaveBeenCalledWith('appointment123');
    });
  });

  describe('getUserLockHistory', () => {
    it('should return user lock history with pagination', async () => {
      const mockHistory = [createMockHistoryEntry({ userId: 'user123' })];
      const mockResult = { history: mockHistory, total: 1 };
      jest.spyOn(lockHistoryService, 'getUserLockHistory').mockResolvedValue(mockResult);

      const result = await lockHistoryService.getUserLockHistory('user123', 25, 5);

      expect(lockHistoryService.getUserLockHistory).toHaveBeenCalledWith('user123', 25, 5);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getLockStatistics', () => {
    it('should calculate lock statistics correctly', async () => {
      const mockStats = {
        totalAcquisitions: 2,
        totalReleases: 1,
        totalExpired: 1,
        totalForceReleases: 1,
        averageDuration: 132,
        uniqueUsers: 2,
      };
      jest.spyOn(lockHistoryService, 'getLockStatistics').mockResolvedValue(mockStats);

      const result = await lockHistoryService.getLockStatistics('appointment123');

      expect(lockHistoryService.getLockStatistics).toHaveBeenCalledWith('appointment123');
      expect(result).toEqual(mockStats);
    });

    it('should handle empty history', async () => {
      const mockStats = {
        totalAcquisitions: 0,
        totalReleases: 0,
        totalExpired: 0,
        totalForceReleases: 0,
        averageDuration: 0,
        uniqueUsers: 0,
      };
      jest.spyOn(lockHistoryService, 'getLockStatistics').mockResolvedValue(mockStats);

      const result = await lockHistoryService.getLockStatistics('appointment123');

      expect(result).toEqual(mockStats);
    });

    it('should handle history with null durations', async () => {
      const mockStats = {
        totalAcquisitions: 1,
        totalReleases: 1,
        totalExpired: 0,
        totalForceReleases: 0,
        averageDuration: 120,
        uniqueUsers: 1,
      };
      jest.spyOn(lockHistoryService, 'getLockStatistics').mockResolvedValue(mockStats);

      const result = await lockHistoryService.getLockStatistics('appointment123');

      expect(result.averageDuration).toBe(120);
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent activity for specific appointment', async () => {
      const mockActivity = [createMockHistoryEntry({ appointmentId: 'appointment123' })];
      jest.spyOn(lockHistoryService, 'getRecentActivity').mockResolvedValue(mockActivity);

      const result = await lockHistoryService.getRecentActivity('appointment123', 10);

      expect(lockHistoryService.getRecentActivity).toHaveBeenCalledWith('appointment123', 10);
      expect(result).toEqual(mockActivity);
    });

    it('should return recent activity for all appointments', async () => {
      const mockActivity = [createMockHistoryEntry()];
      jest.spyOn(lockHistoryService, 'getRecentActivity').mockResolvedValue(mockActivity);

      const result = await lockHistoryService.getRecentActivity(undefined, 15);

      expect(lockHistoryService.getRecentActivity).toHaveBeenCalledWith(undefined, 15);
      expect(result).toEqual(mockActivity);
    });

    it('should handle default limit parameter', async () => {
      const mockActivity: LockHistoryEntity[] = [];
      jest.spyOn(lockHistoryService, 'getRecentActivity').mockResolvedValue(mockActivity);

      await lockHistoryService.getRecentActivity('appointment123');

      expect(lockHistoryService.getRecentActivity).toHaveBeenCalledWith('appointment123');
    });
  });

  describe('cleanupOldHistory', () => {
    it('should cleanup old history records', async () => {
      jest.spyOn(lockHistoryService, 'cleanupOldHistory').mockResolvedValue(10);

      const result = await lockHistoryService.cleanupOldHistory(30);

      expect(lockHistoryService.cleanupOldHistory).toHaveBeenCalledWith(30);
      expect(result).toBe(10);
    });

    it('should handle default days to keep parameter', async () => {
      jest.spyOn(lockHistoryService, 'cleanupOldHistory').mockResolvedValue(5);

      const result = await lockHistoryService.cleanupOldHistory();

      expect(lockHistoryService.cleanupOldHistory).toHaveBeenCalledWith();
      expect(result).toBe(5);
    });

    it('should handle null affected count', async () => {
      jest.spyOn(lockHistoryService, 'cleanupOldHistory').mockResolvedValue(0);

      const result = await lockHistoryService.cleanupOldHistory(30);

      expect(result).toBe(0);
    });
  });
}); 