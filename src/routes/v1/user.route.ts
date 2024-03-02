import { userController } from '../../controllers/user.controller';
import express from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { upload } from '../../configs/mutler';

const router = express.Router();

router.get('/delete-account', authMiddleware, userController.userDeleteAccount);
router.get('/:username', userController.userProfile);
router.post('/update-profile', authMiddleware, userController.userUpdateProfile);
router.post('/upload-profile-img', authMiddleware, upload.single('profile_img'), userController.userUploadProfileImg);
router.post('/reset-password', authMiddleware, userController.userResetPassword);

export const userRoute = router;