import { upload } from '../../configs/mutler';
import express from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { blogController } from '../../controllers/blog.controller';

const router = express.Router();

router.post('/upload-img', authMiddleware, upload.single('blog_img'), blogController.blogUploadCoverImg);

export const blogRoute = router;