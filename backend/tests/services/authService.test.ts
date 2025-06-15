import { describe, beforeEach, expect, it, jest } from '@jest/globals';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { AppDataSource } from '../../src/config/data-source';
import { UserEntity } from '../../src/entities/UserEntity';
import { Repository } from 'typeorm';
import { AuthService } from '../../src/services/authService';

// Mock the repository
jest.mock('../../src/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

// Mock bcrypt
jest.mock('bcrypt');

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let mockRepository: jest.Mocked<Repository<UserEntity>>;
  
  const createMockUser = (overrides = {}) => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      hash_password: 'hashedpassword',
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    } as UserEntity;

    return mockUser;
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a fresh mock repository for each test
    mockRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      findOneOrFail: jest.fn(),
    } as unknown as jest.Mocked<Repository<UserEntity>>;

    // Set up the mock repository
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
    
    // Mock bcrypt.hash
    (bcrypt.hash as jest.Mock).mockImplementation(() => Promise.resolve('hashedpassword'));
    
    // Mock bcrypt.compare
    (bcrypt.compare as jest.Mock).mockImplementation(() => Promise.resolve(true));
    
    // Mock jwt.sign
    (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');
    
    // Mock jwt.verify
    (jwt.verify as jest.Mock).mockReturnValue({ id: '1' });

    // Set up JWT secret for testing
    process.env.JWT_SECRET = 'test-secret';
    
    // Initialize the service
    authService = new AuthService();
  });

  describe('signup', () => {
    it('should create a new user and return token', async () => {
      const mockUser = createMockUser();
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await authService.signup(
        'test@example.com',
        'Test User',
        'password123'
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        hash_password: 'hashedpassword'
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).not.toHaveProperty('hash_password');
    });

    it('should throw error if email already exists', async () => {
      const mockUser = createMockUser();
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        authService.signup('existing@example.com', 'Test User', 'password123')
      ).rejects.toThrow('Email already in use');
    });

    it('should throw error if user creation fails', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(
        authService.signup('test@example.com', 'Test User', 'password123')
      ).rejects.toThrow('Failed to create user account');
    });

    it('should throw error if required fields are missing', async () => {
      await expect(
        authService.signup('', 'Test User', 'password123')
      ).rejects.toThrow('Email, name, and password are required');

      await expect(
        authService.signup('test@example.com', '', 'password123')
      ).rejects.toThrow('Email, name, and password are required');

      await expect(
        authService.signup('test@example.com', 'Test User', '')
      ).rejects.toThrow('Email, name, and password are required');
    });
  });

  describe('signin', () => {
    it('should return user and token with valid credentials', async () => {
      const mockUser = createMockUser();
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await authService.signin('test@example.com', 'password123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result).not.toHaveProperty('hash_password');
    });

    it('should throw error with invalid email', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        authService.signin('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error with invalid password', async () => {
      const mockUser = createMockUser();
      mockRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockImplementationOnce(() => Promise.resolve(false));

      await expect(
        authService.signin('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if validation fails', async () => {
      const mockUser = createMockUser();
      mockRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockImplementationOnce(() => Promise.reject(new Error('Validation error')));

      await expect(
        authService.signin('test@example.com', 'password123')
      ).rejects.toThrow('Authentication failed');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user without password', async () => {
      const mockUser = createMockUser();
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await authService.getCurrentUser('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).not.toHaveProperty('hash_password');
      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('should throw error if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        authService.getCurrentUser('nonexistent-id')
      ).rejects.toThrow('User not found');
    });

    it('should throw error if database query fails', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(
        authService.getCurrentUser('1')
      ).rejects.toThrow('Failed to fetch user data');
    });
  });

  describe('validateToken', () => {
    it('should validate token and return user', async () => {
      const mockUser = createMockUser();
      mockRepository.findOneOrFail.mockResolvedValue(mockUser);

      const result = await authService.validateToken('valid-token');

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
      expect(mockRepository.findOneOrFail).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toBe(mockUser);
    });

    it('should throw error if token is invalid', async () => {
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      await expect(
        authService.validateToken('invalid-token')
      ).rejects.toThrow('Invalid token');
    });

    it('should throw error if user not found', async () => {
      mockRepository.findOneOrFail.mockRejectedValue(new Error('User not found'));

      await expect(
        authService.validateToken('valid-token')
      ).rejects.toThrow('Invalid token');
    });
  });
});
