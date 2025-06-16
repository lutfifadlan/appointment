import { Request, Response } from 'express';
import lockHistoryService from '../services/lockHistoryService';

export const getLockHistory = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await lockHistoryService.getLockHistory(id, limit, offset);
    
    res.json({
      success: true,
      data: result.history,
      total: result.total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error getting lock history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getLockStatistics = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;

    const stats = await lockHistoryService.getLockStatistics(id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting lock statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getUserLockHistory = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await lockHistoryService.getUserLockHistory(userId, limit, offset);
    
    res.json({
      success: true,
      data: result.history,
      total: result.total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error getting user lock history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getRecentActivity = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const activity = await lockHistoryService.getRecentActivity(id, limit);
    
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error getting recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const cleanupOldHistory = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const daysToKeep = parseInt(req.body.daysToKeep as string) || 90;

    const deletedCount = await lockHistoryService.cleanupOldHistory(daysToKeep);
    
    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old history records`,
      deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up old history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}; 