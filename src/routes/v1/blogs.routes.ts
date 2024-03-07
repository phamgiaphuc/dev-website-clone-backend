import { upload } from '../../configs/mutler';
import express from 'express';
import { authTokenMiddleware } from '../../middlewares/auth.token.middleware';
import { blogController } from '../../controllers/blog.controller';

const router = express.Router();

router.get('/', blogController.getAllPublishBlogs);
router.get('/recent', blogController.getRecentBlogsByDate);
router.get('/general_data', authTokenMiddleware, blogController.getUserGeneralBlogData);
router.get('/dashboard', authTokenMiddleware, blogController.getAllUserBlogs);
router.get('/:username', blogController.getUserPublishBlogs);
router.get('/:username/:blogId', blogController.getBlog);
router.post('/upload-img', authTokenMiddleware, upload.single('blog_img'), blogController.blogUploadCoverImg);
router.post('/create', authTokenMiddleware, blogController.createNewBlog);

export const blogRoute = router;