import { describe, beforeEach, afterEach, expect, it, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { UserController } from '../../src/controllers/userController';
import { UserService } from '../../src/services/userService';

// Mock the UserService
jest.mock('../../src/services/userService');

interface UserData {
  id: string;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

// Extend Express Request type to include user property
interface RequestWithUser extends Request {
  user?: {
    id: string;
  };
}

describe('UserController', () => {
  let userController: UserController;
  let mockRequest: Partial<RequestWithUser>;
  let mockResponse: Response;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    mockUserService = new UserService() as jest.Mocked<UserService>;
    (UserService as jest.Mock).mockImplementation(() => mockUserService);
    userController = new UserController();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user by id successfully', async () => {
      const mockUser: UserData = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        created_at: new Date(),
        updated_at: new Date()
      };
      mockRequest.params = { id: '123' };

      mockUserService.getUserById.mockResolvedValue(mockUser);

      await userController.getUserById(mockRequest as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
    });

    it('should handle user not found', async () => {
      mockRequest.params = { id: 'non-existent' };

      mockUserService.getUserById.mockResolvedValue(null);

      await userController.getUserById(mockRequest as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const mockUser: UserData = {
        id: '123',
        email: 'test@example.com',
        name: 'Updated Name',
        created_at: new Date(),
        updated_at: new Date()
      };
      mockRequest.user = { id: '123' };
      mockRequest.body = { name: 'Updated Name' };

      mockUserService.updateUser.mockResolvedValue(mockUser);

      await userController.updateUser(mockRequest as RequestWithUser, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
    });

    it('should handle update errors', async () => {
      mockRequest.user = { id: '123' };
      mockRequest.body = { email: 'invalid-email' };

      const error = new Error('Invalid email format') as Error & { code?: string; status?: number };
      error.code = 'INVALID_EMAIL';
      error.status = 400;
      mockUserService.updateUser.mockRejectedValue(error);

      await userController.updateUser(mockRequest as RequestWithUser, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid email format' });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockRequest.user = { id: '123' };

      mockUserService.deleteUser.mockResolvedValue({ message: 'User deleted successfully' });

      await userController.deleteUser(mockRequest as RequestWithUser, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
    });

    it('should handle delete errors', async () => {
      mockRequest.user = { id: '123' };

      const error = new Error('Failed to delete user') as Error & { code?: string; status?: number };
      error.code = 'DELETE_FAILED';
      error.status = 400;
      mockUserService.deleteUser.mockRejectedValue(error);

      await userController.deleteUser(mockRequest as RequestWithUser, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to delete user' });
    });
  });
}); 