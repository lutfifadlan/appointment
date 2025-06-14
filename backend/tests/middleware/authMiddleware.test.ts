import { describe, beforeEach, afterEach, expect, it, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../src/middleware/authMiddleware';
import { AppDataSource } from '../../src/config/data-source';
import * as jwt from 'jsonwebtoken';
import { UserEntity } from '../../src/entities/UserEntity';

// Mock dependencies
jest.mock('../../src/config/data-source');
jest.mock('jsonwebtoken');

// Extend Express Request type to include user property
interface RequestWithUser extends Request {
  user?: UserEntity;
}

describe('Auth Middleware', () => {
  let mockRequest: Partial<RequestWithUser>;
  let mockResponse: Response;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if no token is provided', async () => {
    await authMiddleware(
      mockRequest as Request,
      mockResponse,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid-token',
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await authMiddleware(
      mockRequest as Request,
      mockResponse,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if user is not found', async () => {
    const mockDecodedToken = { id: '123' };
    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };

    (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
    
    const mockUserRepository = {
      findOne: jest.fn().mockImplementation(() => Promise.resolve(null)),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepository);

    await authMiddleware(
      mockRequest as Request,
      mockResponse,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next() if token is valid and user exists', async () => {
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
    const mockDecodedToken = { id: '123' };
    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };

    (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
    
    const mockUserRepository = {
      findOne: jest.fn().mockImplementation(() => Promise.resolve(mockUser)),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepository);

    await authMiddleware(
      mockRequest as Request,
      mockResponse,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.user).toEqual(mockUser);
  });
}); 