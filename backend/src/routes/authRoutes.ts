import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.get('/validate-token', authController.validateToken);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);

export default router;
