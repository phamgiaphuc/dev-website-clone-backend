import { userController } from '../../controllers/user.controller';
import express from 'express';
import { authTokenMiddleware } from '../../middlewares/auth.token.middleware';
import { upload } from '../../configs/mutler';
import { dashboardController } from '../../controllers/dashboard.controller';

const router = express.Router();

// User Controller
router.get('/delete-account', authTokenMiddleware, userController.userDeleteAccount);
router.get('/:username', userController.userProfile);
router.post('/update-profile', authTokenMiddleware, userController.userUpdateProfile);
router.post('/upload-profile-img', authTokenMiddleware, upload.single('profile_img'), userController.userUploadProfileImg);
router.post('/reset-password', authTokenMiddleware, userController.userResetPassword);

// Dashboard Controller
router.post('/check_follow', authTokenMiddleware, dashboardController.checkIsFollowed);
router.post('/follow', authTokenMiddleware, dashboardController.followUser);
router.post('/unfollow', authTokenMiddleware, dashboardController.unFollowUser);

export const userRoute = router;