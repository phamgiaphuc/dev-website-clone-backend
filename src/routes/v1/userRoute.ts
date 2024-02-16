import { userController } from '../../controllers/userController';
import express from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = express.Router();

router.get('/profile', authMiddleware, userController.userProfile);
router.get('/', authMiddleware, userController.getUsers);

export const userRoute = router;