import { logger } from '../configs/logger';
import { NextFunction, Request, Response } from 'express';

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { method, url, ip } = req;
  logger.info(`${method} ${url} ${ip}`);
  next();
}