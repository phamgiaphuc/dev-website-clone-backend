import { userController } from '../../controllers/user.controller';
import express from 'express';
import { authTokenMiddleware } from '../../middlewares/auth.token.middleware';
import { upload } from '../../configs/mutler';

const router = express.Router();

router.get('/delete-account', authTokenMiddleware, userController.userDeleteAccount);
router.get('/:username', userController.userProfile);
router.post('/update-profile', authTokenMiddleware, userController.userUpdateProfile);
router.post('/upload-profile-img', authTokenMiddleware, upload.single('profile_img'), userController.userUploadProfileImg);
router.post('/reset-password', authTokenMiddleware, userController.userResetPassword);

export const userRoute = router;