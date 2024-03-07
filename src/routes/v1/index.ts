import express, { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { userRoute } from './users.routes';
import { authRoute } from './auths.routes';
import { blogRoute } from './blogs.routes';

const router = express.Router();

router.get('/status', (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    "message": "DEV Website Clone"
  });
});

router.use('/users', userRoute);
router.use('/auth', authRoute);
router.use('/blogs', blogRoute)

export const api_v1s = router;