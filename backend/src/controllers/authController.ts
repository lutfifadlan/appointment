import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signup = async (req: Request, res: Response) => {
    try {
      const { email, name, password } = req.body;
      const result = await this.authService.signup(email, name, password);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  signin = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.signin(email, password);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  };

  getCurrentUser = async (req: Request, res: Response) => {
    try {
      // @ts-ignore - user is attached to request by auth middleware
      const userId = req.user.id;
      const user = await this.authService.getCurrentUser(userId);
      res.status(200).json(user);
    } catch (error: any) {
      res.status(401).json({ message: 'Unauthorized' });
    }
  };

  validateToken = async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      const user = await this.authService.validateToken(token);
      res.status(200).json({ valid: true, user: { id: user.id, email: user.email } });
    } catch (error) {
      res.status(401).json({ valid: false, message: 'Invalid token' });
    }
  };
}
