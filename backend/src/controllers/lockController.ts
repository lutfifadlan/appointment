import { Request, Response } from 'express';
import lockService from '../services/lockService';

export const getLockStatus = (req: Request, res: Response) => {
  const { id } = req.params;
  const response = lockService.getLockStatus(id);
  res.json(response);
};

export const acquireLock = (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, userInfo } = req.body;

  if (!userId || !userInfo || !userInfo.name || !userInfo.email) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: userId, userInfo.name, userInfo.email',
    });
  }

  const response = lockService.acquireLock(id, userId, userInfo);
  
  if (!response.success) {
    return res.status(409).json(response); // 409 Conflict
  }
  
  res.status(200).json(response);
};

export const releaseLock = (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required field: userId',
    });
  }

  const response = lockService.releaseLock(id, userId);
  
  if (!response.success) {
    return res.status(400).json(response);
  }
  
  res.status(200).json(response);
};

export const forceReleaseLock = (req: Request, res: Response) => {
  const { id } = req.params;
  const { adminId } = req.body;

  if (!adminId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required field: adminId',
    });
  }

  // In a real application, we would verify that adminId belongs to an admin user
  const response = lockService.forceReleaseLock(id, adminId);
  
  if (!response.success) {
    return res.status(400).json(response);
  }
  
  res.status(200).json(response);
};

export const updateUserPosition = (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, position } = req.body;

  if (!userId || !position || position.x === undefined || position.y === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: userId, position.x, position.y',
    });
  }

  const response = lockService.updateUserPosition(id, userId, position);
  
  if (!response.success) {
    return res.status(400).json(response);
  }
  
  res.status(200).json(response);
};
