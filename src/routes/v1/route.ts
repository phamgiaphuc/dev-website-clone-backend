import { logger } from '../../configs/logger';
import express, { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { userRoute } from './userRoute';

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

// User Routes
router.use('/users', userRoute);

export const api_v1s = router;