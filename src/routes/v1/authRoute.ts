import { authController } from '../../controllers/authController';
import express from 'express';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();

router.route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({
      "message": "Auth APIs"
    });
  });

router.post('/signUp', authController.signUp);
router.post('/signin', authController.signIn);
router.get('/signOut', authController.signOut);
router.post('/google-auth', authController.googleAuth);
router.post('/verification/:id', authController.verificationCode);
router.post('/refresh', authController.refreshToken);

export const authRoute = router;