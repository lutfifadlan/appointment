import { describe, beforeEach, afterEach, expect, it, jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { UserService } from '../../src/services/userService';
import { UserEntity } from '../../src/entities/UserEntity';
import { AppDataSource } from '../../src/config/data-source';

// Mock the data source
jest.mock('../../src/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

// Helper function to create mock user data
const createMockUser = (overrides = {}): Partial<UserEntity> => ({
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  hash_password: 'hashed-password',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides
});

describe('UserService', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<Repository<UserEntity>>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a fresh mock repository for each test
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as unknown as jest.Mocked<Repository<UserEntity>>;

    // Set up the mock repository
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
    
    // Initialize the service
    userService = new UserService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users without sensitive information', async () => {
      const mockUsers = [
        createMockUser({ id: 'user1' }),
        createMockUser({ id: 'user2' })
      ];
      jest.spyOn(mockRepository, 'find').mockResolvedValue(mockUsers as UserEntity[]);

      const result = await userService.getAllUsers();

      expect(mockRepository.find).toHaveBeenCalledWith({
        select: ['id', 'name', 'email', 'created_at', 'updated_at']
      });
      expect(result).toEqual(mockUsers);
    });

    it('should throw error when fetching users fails', async () => {
      jest.spyOn(mockRepository, 'find').mockRejectedValue(new Error('Database error'));

      await expect(userService.getAllUsers())
        .rejects
        .toThrow('Failed to fetch users');
    });
  });

  describe('getUserById', () => {
    it('should return a user when found', async () => {
      const mockUser = createMockUser();
      jest.spyOn(mockRepository, 'findOne').mockResolvedValue(mockUser as UserEntity);

      const result = await userService.getUserById('test-user-id');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        select: ['id', 'name', 'email', 'created_at', 'updated_at']
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw error when user not found', async () => {
      jest.spyOn(mockRepository, 'findOne').mockResolvedValue(null);

      await expect(userService.getUserById('non-existent-id'))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const mockUser = createMockUser();
      const updateData = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, ...updateData };
      const expectedResult = { ...updatedUser };
      delete expectedResult.hash_password;

      jest.spyOn(mockRepository, 'findOne')
        .mockResolvedValueOnce(mockUser as UserEntity) // First call for finding user
        .mockResolvedValueOnce(null); // Second call for checking email uniqueness
      jest.spyOn(mockRepository, 'save').mockResolvedValue(updatedUser as UserEntity);

      const result = await userService.updateUser('test-user-id', updateData);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'test-user-id' } });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should throw error when user not found', async () => {
      jest.spyOn(mockRepository, 'findOne').mockResolvedValue(null);

      await expect(userService.updateUser('non-existent-id', { name: 'New Name' }))
        .rejects
        .toThrow('User not found');
    });

    it('should throw error when email is already in use', async () => {
      const mockUser = createMockUser();
      const existingUser = createMockUser({ id: 'other-user-id' });
      const updateData = { email: 'existing@example.com' };

      jest.spyOn(mockRepository, 'findOne')
        .mockResolvedValueOnce(mockUser as UserEntity) // First call for finding user
        .mockResolvedValueOnce(existingUser as UserEntity); // Second call for checking email uniqueness

      await expect(userService.updateUser('test-user-id', updateData))
        .rejects
        .toThrow('Email already in use');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const mockUser = createMockUser();
      jest.spyOn(mockRepository, 'findOne').mockResolvedValue(mockUser as UserEntity);
      jest.spyOn(mockRepository, 'remove').mockResolvedValue(mockUser as UserEntity);

      const result = await userService.deleteUser('test-user-id');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'test-user-id' } });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({ message: 'User deleted successfully' });
    });

    it('should throw error when user not found', async () => {
      jest.spyOn(mockRepository, 'findOne').mockResolvedValue(null);

      await expect(userService.deleteUser('non-existent-id'))
        .rejects
        .toThrow('User not found');
    });
  });
});
