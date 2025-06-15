import { AppDataSource } from '../config/data-source';
import { UserEntity } from '../entities/UserEntity';
import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { SignOptions } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

interface UserData {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

interface UserResponse extends UserData {
  token: string;
}

interface AuthError extends Error {
  code?: string;
  status?: number;
}

export class AuthService {
  private userRepository: Repository<UserEntity>;
  private readonly JWT_SECRET: jwt.Secret;
  private readonly JWT_EXPIRES_IN: jwt.SignOptions['expiresIn'];
  private readonly SALT_ROUNDS = 10;

  constructor() {
    this.userRepository = AppDataSource.getRepository(UserEntity);
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    this.JWT_EXPIRES_IN = '24h';
  }

  /**
   * Hash a password using bcrypt
   * @param password - Plain text password
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Validate a password against a hash
   * @param password - Plain text password
   * @param hash - Hashed password
   * @returns Boolean indicating if password matches hash
   */
  private async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Register a new user
   * @param email - User's email address
   * @param name - User's full name
   * @param password - User's password
   * @throws {AuthError} If email is already in use
   */
  async signup(email: string, name: string, password: string): Promise<UserResponse> {
    try {
      // Validate input
      if (!email || !name || !password) {
        const error = new Error('Email, name, and password are required') as AuthError;
        error.code = 'INVALID_INPUT';
        error.status = 400;
        throw error;
      }

      const existingUser = await this.userRepository.findOne({ where: { email } });
      if (existingUser) {
        const error = new Error('Email already in use') as AuthError;
        error.code = 'EMAIL_IN_USE';
        error.status = 409;
        throw error;
      }

      const hashedPassword = await this.hashPassword(password);
      const user = this.userRepository.create({
        email,
        name,
        hash_password: hashedPassword
      });

      const savedUser = await this.userRepository.save(user);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { hash_password, ...result } = savedUser as UserEntity;
      
      return {
        ...result,
        token: this.generateToken(savedUser)
      };
    } catch (error) {
      if (error instanceof Error && (
        error.message === 'Email already in use' ||
        error.message === 'Email, name, and password are required'
      )) {
        throw error;
      }
      console.error('Signup error:', error);
      throw new Error('Failed to create user account: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Authenticate a user and return their data with a JWT token
   * @param email - User's email address
   * @param password - User's password
   * @throws {AuthError} If credentials are invalid
   */
  async signin(email: string, password: string): Promise<UserResponse> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isValid = await this.validatePassword(password, user.hash_password);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { hash_password, ...result } = user as UserEntity;
      
      return {
        ...result,
        token: this.generateToken(user)
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        throw error;
      }
      throw new Error('Authentication failed');
    }
  }

  /**
   * Get current user's data
   * @param userId - User's ID
   * @throws {AuthError} If user is not found
   */
  async getCurrentUser(userId: string): Promise<UserData> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { hash_password, ...result } = user as UserEntity;
      return result;
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        throw error;
      }
      throw new Error('Failed to fetch user data');
    }
  }

  /**
   * Generate a JWT token for a user
   * @param user - User entity
   * @returns JWT token string
   */
  private generateToken(user: UserEntity): string {
    const payload = { id: user.id, email: user.email };
    const options: SignOptions = { expiresIn: this.JWT_EXPIRES_IN };
    return jwt.sign(payload, this.JWT_SECRET, options);
  }

  /**
   * Validate a JWT token and return the associated user
   * @param token - JWT token to validate
   * @throws {AuthError} If token is invalid
   */
  async validateToken(token: string): Promise<UserEntity> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { id: string };
      const user = await this.userRepository.findOneOrFail({ where: { id: decoded.id } });
      return user;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Token validation error:', error.message);
      } else {
        console.error('Unknown token validation error');
      }
      throw new Error('Invalid token');
    }
  }
}

export default new AuthService();
