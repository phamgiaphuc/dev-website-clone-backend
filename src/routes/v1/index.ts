import express, { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { userRoute } from './userRoute';
import { authRoute } from './authRoute';

const router = express.Router();
/**
 * Check server
 */
// v1/status
router.get('/status', (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    "message": "DEV Website Clone"
  });
});

router.use('/users', userRoute);
router.use('/auth', authRoute);

export const api_v1s = router;