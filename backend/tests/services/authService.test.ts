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
      validatePassword: (password: string) => Promise.resolve(password === 'password123'),
      hashPassword: async () => Promise.resolve(),
      save: async () => Promise.resolve(mockUser),
      ...overrides
    } as UserEntity;

    // Set up spies for the mock methods
    jest.spyOn(mockUser, 'validatePassword');
    jest.spyOn(mockUser, 'hashPassword');
    jest.spyOn(mockUser, 'save');

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
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await authService.signup(
        'test@example.com',
        'Test User',
        'password123'
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockRepository.save).toHaveBeenCalled();
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
  });

  describe('signin', () => {
    it('should return user and token with valid credentials', async () => {
      const mockUser = createMockUser();
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await authService.signin('test@example.com', 'password123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockUser.validatePassword).toHaveBeenCalledWith('password123');
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
      jest.spyOn(mockUser, 'validatePassword').mockResolvedValueOnce(false);
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        authService.signin('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if validation fails', async () => {
      const mockUser = createMockUser();
      jest.spyOn(mockUser, 'validatePassword').mockRejectedValueOnce(new Error('Validation error'));
      mockRepository.findOne.mockResolvedValue(mockUser);

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
      expect(result).toEqual(mockUser);
    });

    it('should throw error with invalid token', async () => {
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.validateToken('invalid-token')).rejects.toThrow('Invalid token');
    });

    it('should throw error if user not found', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: 'nonexistent-id' });
      mockRepository.findOneOrFail.mockRejectedValue(new Error('User not found'));

      await expect(authService.validateToken('valid-token')).rejects.toThrow('Invalid token');
    });

    it('should throw error if JWT_SECRET is not set', async () => {
      delete process.env.JWT_SECRET;
      const newAuthService = new AuthService();
      
      // Mock jwt.verify to throw an error when JWT_SECRET is not set
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('jwt must have a secret key');
      });

      await expect(newAuthService.validateToken('valid-token')).rejects.toThrow('Invalid token');
    });
  });
});
