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
    const { userId, userInfo, expectedVersion } = req.body;

    if (!userId || !userInfo || !userInfo.name || !userInfo.email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, userInfo.name, userInfo.email',
      });
    }

    const response = await lockService.acquireLock(id, userId, userInfo, expectedVersion);
    
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
    const { userId, expectedVersion } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: userId',
      });
    }

    const response = await lockService.releaseLock(id, userId, expectedVersion);
    
    if (!response.success) {
      // Return 409 Conflict for version mismatch
      if (response.conflictDetails) {
        return res.status(409).json(response);
      }
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
    const { userId, position, expectedVersion } = req.body;

    if (!userId || !position || position.x === undefined || position.y === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, position.x, position.y',
      });
    }

    const response = await lockService.updateUserPosition(id, userId, position, expectedVersion);
    
    if (!response.success) {
      // Return 409 Conflict for version mismatch
      if (response.conflictDetails) {
        return res.status(409).json(response);
      }
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

export const manualCleanup = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const response = await lockService.manualCleanup();
    
    if (!response.success) {
      return res.status(500).json(response);
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error during manual cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      cleanedCount: 0
    });
  }
};

export const getHealthStatus = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const healthStatus = lockService.getHealthStatus();
    
    res.status(200).json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

