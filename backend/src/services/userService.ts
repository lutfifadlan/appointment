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
  async getUserById(id: string): Promise<UserData | null> {
    try {
      return await this.userRepository.findOne({
        where: { id },
        select: ['id', 'name', 'email', 'created_at', 'updated_at']
      });
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
  async updateUser(id: string, updateData: Partial<UserEntity>): Promise<UserData | null> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      
      if (!user) {
        return null;
      }

      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await this.userRepository.findOne({ 
          where: { email: updateData.email } 
        });
        
        if (existingUser) {
          throw new Error('Email already in use');
        }
      }

      Object.assign(user, updateData);
      const updatedUser = await this.userRepository.save(user);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { hash_password, ...result } = updatedUser;
      return result;
    } catch (error) {
      if (error instanceof Error && (error.message === 'User not found' || error.message === 'Email already in use')) {
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
        throw new Error('User not found');
      }
      
      await this.userRepository.remove(user);
      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        throw error;
      }
      throw new Error('Failed to delete user');
    }
  }
}

export default new UserService();
