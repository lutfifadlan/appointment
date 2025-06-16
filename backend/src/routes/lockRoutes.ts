import express from 'express';
import * as lockController from '../controllers/lockController';

const router = express.Router();

// Get lock status for an appointment
router.get('/appointments/:id/lock-status', lockController.getLockStatus);

// Acquire lock on an appointment
router.post('/appointments/:id/acquire-lock', lockController.acquireLock);

// Release lock on an appointment
router.delete('/appointments/:id/release-lock', lockController.releaseLock);

// Force release lock (admin only)
router.delete('/appointments/:id/force-release-lock', lockController.forceReleaseLock);

// Manual cleanup endpoint (admin only)
router.post('/admin/locks/cleanup', lockController.manualCleanup);

// Health status endpoint
router.get('/locks/health', lockController.getHealthStatus);


// Update user position (for collaborative cursors)
router.post('/appointments/:id/update-position', lockController.updateUserPosition);

export default router;
