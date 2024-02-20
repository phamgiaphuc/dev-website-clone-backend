import { authController } from '../../controllers/auth.controller';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = express.Router();

router.route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({
      "message": "Auth APIs"
    });
  });

router.post('/signup', authController.signUp);
router.post('/signin', authController.signIn);
router.get('/signout', authController.signOut);
router.post('/google-auth', authController.googleAuth);
router.post('/verification/:id', authController.verificationCode);
router.get('/refresh-token', authController.refreshToken);

export const authRoute = router;