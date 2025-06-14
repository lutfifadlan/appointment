import { Request, Response } from 'express';
import lockService from '../services/lockService';

export const getLockStatus = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const response = await lockService.getLockStatus(id);
    res.json(response);
  } catch (error) {
    console.error('Error getting lock status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const acquireLock = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { userId, userInfo } = req.body;

    if (!userId || !userInfo || !userInfo.name || !userInfo.email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, userInfo.name, userInfo.email',
      });
    }

    const response = await lockService.acquireLock(id, userId, userInfo);
    
    if (!response.success) {
      return res.status(409).json(response); // 409 Conflict
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error acquiring lock:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const releaseLock = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: userId',
      });
    }

    const response = await lockService.releaseLock(id, userId);
    
    if (!response.success) {
      return res.status(400).json(response);
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error releasing lock:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const forceReleaseLock = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: adminId',
      });
    }

    // In a real application, we would verify that adminId belongs to an admin user
    const response = await lockService.forceReleaseLock(id, adminId);
    
    if (!response.success) {
      return res.status(400).json(response);
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error force releasing lock:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateUserPosition = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { userId, position } = req.body;

    if (!userId || !position || position.x === undefined || position.y === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, position.x, position.y',
      });
    }

    const response = await lockService.updateUserPosition(id, userId, position);
    
    if (!response.success) {
      return res.status(400).json(response);
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating user position:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
