import { authController } from '../../controllers/auth.controller';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { authValidationMiddleware, signInValidationOption, signUpValidationOption, signOutValidationOption, verficationValidationOption } from '../../middlewares/auth.validation.middleware';

const router = express.Router();

router.route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({
      "message": "Auth APIs"
    });
  });

router.post('/signup', signUpValidationOption(), authValidationMiddleware, authController.signUp);
router.post('/signin', signInValidationOption(), authValidationMiddleware, authController.signIn);
router.get('/signout', signOutValidationOption(), authValidationMiddleware, authController.signOut);
router.post('/google-auth', authController.googleAuth);
router.post('/verification/:id', verficationValidationOption(), authValidationMiddleware, authController.verificationCode);
router.get('/refresh-token', authController.refreshToken);

export const authRoute = router;