import { describe, beforeEach, afterEach, expect, it, jest } from '@jest/globals';
import { Request, Response } from 'express';
import * as lockHistoryController from '../../src/controllers/lockHistoryController';
import lockHistoryServiceImport from '../../src/services/lockHistoryService';
import { LockHistoryEntity, LockAction } from '../../src/entities/LockHistoryEntity';

// Use a properly typed mock for lockHistoryService
const lockHistoryService = lockHistoryServiceImport as jest.Mocked<typeof lockHistoryServiceImport>;

// Mock the lock history service
jest.mock('../../src/services/lockHistoryService');

describe('LockHistoryController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLockHistory', () => {
    it('should return lock history successfully', async () => {
      const mockHistory: LockHistoryEntity[] = [
        {
          id: 'hist-1',
          appointmentId: 'appointment123',
          userId: 'user123',
          userName: 'Test User',
          userEmail: 'test@example.com',
          action: LockAction.ACQUIRED,
          timestamp: new Date(),
          duration: 120,
          releasedBy: undefined,
          lockId: 'lock-1',
          metadata: { userAgent: 'test-agent' },
        },
        {
          id: 'hist-2',
          appointmentId: 'appointment123',
          userId: 'user123',
          userName: 'Test User',
          userEmail: 'test@example.com',
          action: LockAction.RELEASED,
          timestamp: new Date(),
          duration: 120,
          releasedBy: undefined,
          lockId: 'lock-1',
          metadata: { userAgent: 'test-agent' },
        },
      ];

      const mockServiceResponse = {
        history: mockHistory,
        total: 2,
      };

      mockRequest.params = { id: 'appointment123' };
      mockRequest.query = { limit: '50', offset: '0' };

      lockHistoryService.getLockHistory.mockResolvedValue(mockServiceResponse);

      await lockHistoryController.getLockHistory(mockRequest as Request, mockResponse as Response);

      expect(lockHistoryService.getLockHistory).toHaveBeenCalledWith('appointment123', 50, 0);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockHistory,
        total: 2,
        limit: 50,
        offset: 0,
      });
    });

    it('should handle default pagination parameters', async () => {
      const mockServiceResponse = {
        history: [],
        total: 0,
      };

      mockRequest.params = { id: 'appointment123' };
      mockRequest.query = {};

      lockHistoryService.getLockHistory.mockResolvedValue(mockServiceResponse);

      await lockHistoryController.getLockHistory(mockRequest as Request, mockResponse as Response);

      expect(lockHistoryService.getLockHistory).toHaveBeenCalledWith('appointment123', 50, 0);
    });

    it('should handle service errors', async () => {
      mockRequest.params = { id: 'appointment123' };
      mockRequest.query = {};

      lockHistoryService.getLockHistory.mockRejectedValue(new Error('Database error'));

      await lockHistoryController.getLockHistory(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('getLockStatistics', () => {
    it('should return lock statistics successfully', async () => {
      const mockStats = {
        totalAcquisitions: 5,
        totalReleases: 4,
        totalExpired: 1,
        totalForceReleases: 0,
        averageDuration: 180,
        uniqueUsers: 2,
      };

      mockRequest.params = { id: 'appointment123' };

      lockHistoryService.getLockStatistics.mockResolvedValue(mockStats);

      await lockHistoryController.getLockStatistics(mockRequest as Request, mockResponse as Response);

      expect(lockHistoryService.getLockStatistics).toHaveBeenCalledWith('appointment123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });

    it('should handle service errors', async () => {
      mockRequest.params = { id: 'appointment123' };

      lockHistoryService.getLockStatistics.mockRejectedValue(new Error('Database error'));

      await lockHistoryController.getLockStatistics(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('getUserLockHistory', () => {
    it('should return user lock history successfully', async () => {
      const mockHistory: LockHistoryEntity[] = [
        {
          id: 'hist-1',
          appointmentId: 'appointment123',
          userId: 'user123',
          userName: 'Test User',
          userEmail: 'test@example.com',
          action: LockAction.ACQUIRED,
          timestamp: new Date(),
          duration: 120,
          releasedBy: undefined,
          lockId: 'lock-1',
          metadata: { userAgent: 'test-agent' },
        },
      ];

      const mockServiceResponse = {
        history: mockHistory,
        total: 1,
      };

      mockRequest.params = { userId: 'user123' };
      mockRequest.query = { limit: '25', offset: '10' };

      lockHistoryService.getUserLockHistory.mockResolvedValue(mockServiceResponse);

      await lockHistoryController.getUserLockHistory(mockRequest as Request, mockResponse as Response);

      expect(lockHistoryService.getUserLockHistory).toHaveBeenCalledWith('user123', 25, 10);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockHistory,
        total: 1,
        limit: 25,
        offset: 10,
      });
    });

    it('should handle service errors', async () => {
      mockRequest.params = { userId: 'user123' };
      mockRequest.query = {};

      lockHistoryService.getUserLockHistory.mockRejectedValue(new Error('Database error'));

      await lockHistoryController.getUserLockHistory(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent activity successfully', async () => {
      const mockActivity: LockHistoryEntity[] = [
        {
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
        },
      ];

      mockRequest.params = { id: 'appointment123' };
      mockRequest.query = { limit: '10' };

      lockHistoryService.getRecentActivity.mockResolvedValue(mockActivity);

      await lockHistoryController.getRecentActivity(mockRequest as Request, mockResponse as Response);

      expect(lockHistoryService.getRecentActivity).toHaveBeenCalledWith('appointment123', 10);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockActivity,
      });
    });

    it('should handle default limit parameter', async () => {
      mockRequest.params = { id: 'appointment123' };
      mockRequest.query = {};

      lockHistoryService.getRecentActivity.mockResolvedValue([]);

      await lockHistoryController.getRecentActivity(mockRequest as Request, mockResponse as Response);

      expect(lockHistoryService.getRecentActivity).toHaveBeenCalledWith('appointment123', 20);
    });

    it('should handle service errors', async () => {
      mockRequest.params = { id: 'appointment123' };
      mockRequest.query = {};

      lockHistoryService.getRecentActivity.mockRejectedValue(new Error('Database error'));

      await lockHistoryController.getRecentActivity(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('cleanupOldHistory', () => {
    it('should cleanup old history successfully', async () => {
      const deletedCount = 15;

      mockRequest.body = { daysToKeep: '30' };

      lockHistoryService.cleanupOldHistory.mockResolvedValue(deletedCount);

      await lockHistoryController.cleanupOldHistory(mockRequest as Request, mockResponse as Response);

      expect(lockHistoryService.cleanupOldHistory).toHaveBeenCalledWith(30);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cleaned up 15 old history records',
        deletedCount: 15,
      });
    });

    it('should handle default days to keep parameter', async () => {
      const deletedCount = 5;

      mockRequest.body = {};

      lockHistoryService.cleanupOldHistory.mockResolvedValue(deletedCount);

      await lockHistoryController.cleanupOldHistory(mockRequest as Request, mockResponse as Response);

      expect(lockHistoryService.cleanupOldHistory).toHaveBeenCalledWith(90);
    });

    it('should handle service errors', async () => {
      mockRequest.body = { daysToKeep: '30' };

      lockHistoryService.cleanupOldHistory.mockRejectedValue(new Error('Database error'));

      await lockHistoryController.cleanupOldHistory(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });
}); 