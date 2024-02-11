import { userController } from '../../controllers/userController';
import express from 'express';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();

router.route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({
      "message": "User APIs"
    });
  });

router.post('/signup', userController.userSignUp);
router.post('/signin', userController.userSignIn);
router.get('/refresh', userController.userRefreshToken);
router.get('/profile', userController.userProfile);
router.get('/auth', userController.userVerification);

export const userRoute = router;