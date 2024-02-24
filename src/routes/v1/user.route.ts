import { userController } from '../../controllers/user.controller';
import express from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { upload } from '../../configs/mutler';

const router = express.Router();

router.get('/profile', authMiddleware, userController.userProfile);
router.post('/update-profile', authMiddleware, userController.userUpdateProfile);
router.post('/upload-profile-img', authMiddleware, upload.single('profile_img'), userController.userUploadProfileImg);

export const userRoute = router;