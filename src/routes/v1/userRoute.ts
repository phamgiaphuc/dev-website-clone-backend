import { userController } from '../../controllers/userController';
import express from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { upload } from '../../configs/mutler';

const router = express.Router();

router.get('/profile', authMiddleware, userController.userProfile);
router.post('/update-profile', authMiddleware, userController.userUpdateProfile);
router.post('/upload-profile-img', authMiddleware, upload.single('profile_img'), userController.userUploadProfileImg);

export const userRoute = router;