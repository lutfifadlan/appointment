import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const userController = new UserController();

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

// User routes
router.get('/:id', userController.getUserById);
router.put('/', userController.updateUser);
router.delete('/', userController.deleteUser);

export default router;
