import express from 'express';
import * as lockController from '../controllers/lockController';
import * as lockHistoryController from '../controllers/lockHistoryController';

const router = express.Router();

// Get lock status for an appointment
router.get('/appointments/:id/lock-status', lockController.getLockStatus);

// Acquire lock on an appointment
router.post('/appointments/:id/acquire-lock', lockController.acquireLock);

// Release lock on an appointment
router.delete('/appointments/:id/release-lock', lockController.releaseLock);

// Force release lock (admin only)
router.delete('/appointments/:id/force-release-lock', lockController.forceReleaseLock);

// Update user position (for collaborative cursors)
router.post('/appointments/:id/update-position', lockController.updateUserPosition);

// Lock history endpoints
router.get('/appointments/:id/lock-history', lockHistoryController.getLockHistory);
router.get('/appointments/:id/lock-statistics', lockHistoryController.getLockStatistics);
router.get('/appointments/:id/recent-activity', lockHistoryController.getRecentActivity);

// User-specific lock history
router.get('/users/:userId/lock-history', lockHistoryController.getUserLockHistory);

// Admin endpoint for cleanup
router.post('/admin/cleanup-history', lockHistoryController.cleanupOldHistory);

export default router;
