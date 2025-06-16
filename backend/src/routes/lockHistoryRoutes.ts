import express from 'express';
import * as lockHistoryController from '../controllers/lockHistoryController';

const router = express.Router();

// Lock history endpoints
router.get('/appointments/:id/lock-history', lockHistoryController.getLockHistory);
router.get('/appointments/:id/lock-statistics', lockHistoryController.getLockStatistics);
router.get('/appointments/:id/recent-activity', lockHistoryController.getRecentActivity);

// User-specific lock history
router.get('/users/:userId/lock-history', lockHistoryController.getUserLockHistory);

// Admin endpoint for cleanup
router.post('/admin/cleanup-history', lockHistoryController.cleanupOldHistory);

export default router; 