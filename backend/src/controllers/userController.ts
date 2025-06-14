import { Request, Response } from 'express';
import { UserService } from '../services/userService';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getUserById = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.getUserById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(user);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  };

  updateUser = async (req: Request, res: Response) => {
    try {
      // @ts-ignore - user is attached to request by auth middleware
      const userId = req.user.id;
      const user = await this.userService.updateUser(userId, req.body);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  deleteUser = async (req: Request, res: Response) => {
    try {
      // @ts-ignore - user is attached to request by auth middleware
      const userId = req.user.id;
      await this.userService.deleteUser(userId);
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}
