import { userController } from '../../controllers/userController';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = express.Router();

router.route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({
      "message": "User APIs"
    });
  });

router.get('/profile', authMiddleware, userController.userProfile);

export const userRoute = router;