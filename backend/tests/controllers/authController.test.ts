import { describe, beforeEach, afterEach, expect, it, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { AuthController } from '../../src/controllers/authController';
import { AuthService } from '../../src/services/authService';
import { UserEntity } from '../../src/entities/UserEntity';

// Mock the AuthService
jest.mock('../../src/services/authService');

interface UserResponse {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  token: string;
}

// Extend Express Request type to include user property
interface RequestWithUser extends Request {
  user?: {
    id: string;
  };
}

describe('AuthController', () => {
  let authController: AuthController;
  let mockRequest: Partial<RequestWithUser>;
  let mockResponse: Response;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    mockAuthService = new AuthService() as jest.Mocked<AuthService>;
    (AuthService as jest.Mock).mockImplementation(() => mockAuthService);
    authController = new AuthController();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new user successfully', async () => {
      const mockUser: UserResponse = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        created_at: new Date(),
        updated_at: new Date(),
        token: 'jwt-token'
      };
      mockRequest.body = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      mockAuthService.signup.mockResolvedValue(mockUser);

      await authController.signup(mockRequest as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
    });

    it('should handle signup errors', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      const error = new Error('Email already exists') as Error & { code?: string; status?: number };
      error.code = 'EMAIL_IN_USE';
      error.status = 409;
      mockAuthService.signup.mockRejectedValue(error);

      await authController.signup(mockRequest as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Email already exists' });
    });
  });

  describe('signin', () => {
    it('should sign in user successfully', async () => {
      const mockResult: UserResponse = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        created_at: new Date(),
        updated_at: new Date(),
        token: 'jwt-token'
      };
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.signin.mockResolvedValue(mockResult);

      await authController.signin(mockRequest as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle signin errors', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      const error = new Error('Invalid credentials') as Error & { code?: string; status?: number };
      error.code = 'INVALID_CREDENTIALS';
      error.status = 401;
      mockAuthService.signin.mockRejectedValue(error);

      await authController.signin(mockRequest as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        created_at: new Date(),
        updated_at: new Date()
      };
      mockRequest.user = { id: '123' };

      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      await authController.getCurrentUser(mockRequest as RequestWithUser, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
    });

    it('should handle getCurrentUser errors', async () => {
      mockRequest.user = { id: '123' };

      const error = new Error('User not found') as Error & { code?: string; status?: number };
      error.code = 'USER_NOT_FOUND';
      error.status = 404;
      mockAuthService.getCurrentUser.mockRejectedValue(error);

      await authController.getCurrentUser(mockRequest as RequestWithUser, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      const mockUser: UserEntity = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        hash_password: 'hashed-password',
        created_at: new Date(),
        updated_at: new Date(),
        validatePassword: async (password: string): Promise<boolean> => true,
        save: async (): Promise<UserEntity> => mockUser,
        hashPassword: async (): Promise<void> => {}
      };
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockAuthService.validateToken.mockResolvedValue(mockUser);

      await authController.validateToken(mockRequest as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        valid: true,
        user: { id: mockUser.id, email: mockUser.email },
      });
    });

    it('should handle missing token', async () => {
      mockRequest.headers = {};

      await authController.validateToken(mockRequest as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'No token provided' });
    });

    it('should handle invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      const error = new Error('Invalid token') as Error & { code?: string; status?: number };
      error.code = 'INVALID_TOKEN';
      error.status = 401;
      mockAuthService.validateToken.mockRejectedValue(error);

      await authController.validateToken(mockRequest as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ valid: false, message: 'Invalid token' });
    });
  });
}); 