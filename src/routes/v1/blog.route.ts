import { upload } from '../../configs/mutler';
import express from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { blogController } from '../../controllers/blog.controller';

const router = express.Router();

router.get('/', blogController.getAllBlogs);
router.get('/:username', blogController.getUserBlogs);
router.get('/:username/:blogId', blogController.getBlog);
router.post('/upload-img', authMiddleware, upload.single('blog_img'), blogController.blogUploadCoverImg);
router.post('/create', authMiddleware, blogController.createNewBlog);

export const blogRoute = router;