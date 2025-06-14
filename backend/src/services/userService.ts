import { AppDataSource } from '../config/data-source';
import { UserEntity } from '../entities/UserEntity';
import { Repository } from 'typeorm';

interface UserData {
  id: string;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

interface UserError extends Error {
  code?: string;
  status?: number;
}

export class UserService {
  private userRepository: Repository<UserEntity>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(UserEntity);
  }

  /**
   * Get all users with their basic information
   * @returns Array of user data without sensitive information
   */
  async getAllUsers(): Promise<UserData[]> {
    try {
      const users = await this.userRepository.find({
        select: ['id', 'name', 'email', 'created_at', 'updated_at']
      });
      return users;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Get a user by their ID
   * @param id - User's ID
   * @throws {UserError} If user is not found
   */
  async getUserById(id: string): Promise<UserData> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        select: ['id', 'name', 'email', 'created_at', 'updated_at']
      });
      
      if (!user) {
        const error = new Error('User not found') as UserError;
        error.code = 'USER_NOT_FOUND';
        error.status = 404;
        throw error;
      }
      
      return user;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw new Error('Failed to fetch user');
    }
  }

  /**
   * Update a user's information
   * @param id - User's ID
   * @param updateData - Data to update
   * @throws {UserError} If user is not found or email is already in use
   */
  async updateUser(id: string, updateData: Partial<UserEntity>): Promise<UserData> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      
      if (!user) {
        const error = new Error('User not found') as UserError;
        error.code = 'USER_NOT_FOUND';
        error.status = 404;
        throw error;
      }

      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await this.userRepository.findOne({ 
          where: { email: updateData.email } 
        });
        
        if (existingUser) {
          const error = new Error('Email already in use') as UserError;
          error.code = 'EMAIL_IN_USE';
          error.status = 409;
          throw error;
        }
      }

      Object.assign(user, updateData);
      const updatedUser = await this.userRepository.save(user);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { hash_password, ...result } = updatedUser;
      return result;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw new Error('Failed to update user');
    }
  }

  /**
   * Delete a user
   * @param id - User's ID
   * @throws {UserError} If user is not found
   */
  async deleteUser(id: string): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      
      if (!user) {
        const error = new Error('User not found') as UserError;
        error.code = 'USER_NOT_FOUND';
        error.status = 404;
        throw error;
      }
      
      await this.userRepository.remove(user);
      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw new Error('Failed to delete user');
    }
  }
}

export default new UserService();
