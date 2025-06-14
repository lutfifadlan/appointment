import { describe, beforeEach, afterEach, expect, it, jest } from '@jest/globals';
import { Request, Response } from 'express';
import * as lockController from '../../src/controllers/lockController';
import lockServiceImport from '../../src/services/lockService';
import { LockResponse } from '../../src/models/appointmentLock';

// Use a properly typed mock for lockService
const lockService = lockServiceImport as jest.Mocked<typeof lockServiceImport>;

// Mock the lock service
jest.mock('../../src/services/lockService');

describe('LockController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    lockService.getLockStatus.mockImplementation(async (): Promise<LockResponse> => ({
      success: true,
      message: 'Appointment is not locked',
    }));

    lockService.acquireLock.mockImplementation(async (): Promise<LockResponse> => ({
      success: true,
      message: 'Lock acquired successfully',
    }));

    lockService.releaseLock.mockImplementation(async (): Promise<LockResponse> => ({
      success: true,
      message: 'Lock released successfully',
    }));

    lockService.forceReleaseLock.mockImplementation(async (): Promise<LockResponse> => ({
      success: true,
      message: 'Lock force released successfully',
    }));

    lockService.updateUserPosition.mockImplementation(async (): Promise<LockResponse> => ({
      success: true,
      message: 'User position updated successfully',
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLockStatus', () => {
    it('should return lock status successfully', async () => {
      const mockServiceResponse: LockResponse = {
        success: true,
        message: 'Appointment is locked',
        lock: {
          appointmentId: 'appointment123',
          userId: 'user123',
          userInfo: {
            name: 'Test User',
            email: 'test@example.com',
          },
          expiresAt: new Date(),
          createdAt: new Date(),
        },
      };

      mockRequest.params = { id: 'appointment123' };

      lockService.getLockStatus.mockResolvedValue(mockServiceResponse);

      await lockController.getLockStatus(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(mockServiceResponse);
    });

    it('should handle errors when getting lock status', async () => {
      mockRequest.params = { id: 'appointment123' };

      lockService.getLockStatus.mockRejectedValue(new Error('Database error'));

      await lockController.getLockStatus(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('acquireLock', () => {
    it('should acquire lock successfully', async () => {
      const mockServiceResponse: LockResponse = {
        success: true,
        message: 'Lock acquired successfully',
        lock: {
          appointmentId: 'appointment123',
          userId: 'user123',
          userInfo: {
            name: 'Test User',
            email: 'test@example.com',
          },
          expiresAt: new Date(),
          createdAt: new Date(),
        },
      };

      mockRequest.params = { id: 'appointment123' };
      mockRequest.body = {
        userId: 'user123',
        userInfo: {
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      lockService.acquireLock.mockResolvedValue(mockServiceResponse);

      await lockController.acquireLock(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockServiceResponse);
    });

    it('should handle missing required fields', async () => {
      mockRequest.params = { id: 'appointment123' };
      mockRequest.body = {
        userId: 'user123',
      };

      await lockController.acquireLock(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Missing required fields: userId, userInfo.name, userInfo.email',
      });
    });

    it('should handle lock conflict', async () => {
      const mockServiceResponse: LockResponse = {
        success: false,
        message: 'Lock already acquired by another user',
        lock: {
          appointmentId: 'appointment123',
          userId: 'otherUser',
          userInfo: {
            name: 'Other User',
            email: 'other@example.com',
          },
          expiresAt: new Date(),
          createdAt: new Date(),
        },
      };

      mockRequest.params = { id: 'appointment123' };
      mockRequest.body = {
        userId: 'user123',
        userInfo: {
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      lockService.acquireLock.mockResolvedValue(mockServiceResponse);

      await lockController.acquireLock(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(mockServiceResponse);
    });
  });

  describe('releaseLock', () => {
    it('should release lock successfully', async () => {
      const mockServiceResponse: LockResponse = {
        success: true,
        message: 'Lock released successfully',
      };

      mockRequest.params = { id: 'appointment123' };
      mockRequest.body = {
        userId: 'user123',
      };

      lockService.releaseLock.mockResolvedValue(mockServiceResponse);

      await lockController.releaseLock(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockServiceResponse);
    });

    it('should handle missing userId', async () => {
      mockRequest.params = { id: 'appointment123' };
      mockRequest.body = {};

      await lockController.releaseLock(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Missing required field: userId',
      });
    });
  });

  describe('forceReleaseLock', () => {
    it('should force release lock successfully', async () => {
      const mockServiceResponse: LockResponse = {
        success: true,
        message: 'Lock force released successfully',
      };

      mockRequest.params = { id: 'appointment123' };
      mockRequest.body = {
        adminId: 'admin123',
      };

      lockService.forceReleaseLock.mockResolvedValue(mockServiceResponse);

      await lockController.forceReleaseLock(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockServiceResponse);
    });

    it('should handle missing adminId', async () => {
      mockRequest.params = { id: 'appointment123' };
      mockRequest.body = {};

      await lockController.forceReleaseLock(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Missing required field: adminId',
      });
    });
  });

  describe('updateUserPosition', () => {
    it('should update user position successfully', async () => {
      const mockServiceResponse: LockResponse = {
        success: true,
        message: 'User position updated successfully',
        lock: {
          appointmentId: 'appointment123',
          userId: 'user123',
          userInfo: {
            name: 'Test User',
            email: 'test@example.com',
            position: { x: 100, y: 200 },
          },
          expiresAt: new Date(),
          createdAt: new Date(),
        },
      };

      mockRequest.params = { id: 'appointment123' };
      mockRequest.body = {
        userId: 'user123',
        position: { x: 100, y: 200 },
      };

      lockService.updateUserPosition.mockResolvedValue(mockServiceResponse);

      await lockController.updateUserPosition(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockServiceResponse);
    });

    it('should handle missing required fields', async () => {
      mockRequest.params = { id: 'appointment123' };
      mockRequest.body = {
        userId: 'user123',
        position: { x: 100 },
      };

      await lockController.updateUserPosition(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Missing required fields: userId, position.x, position.y',
      });
    });
  });
}); 