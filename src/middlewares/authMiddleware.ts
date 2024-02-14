import { SECRET_ACCESS_TOKEN } from '../configs/environment';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface ExtendedRequest extends Request {
  auth: string | JwtPayload
}

export const authMiddleware = (req: ExtendedRequest, res: Response, next: NextFunction) => {
  try {
    const access_token = req.header('Authorization').replace('Bearer', '').trim() // Bearer access_token
    if (!access_token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        "error": "Unauthorized",
        "auth": false
      });
    }
    const data = jwt.verify(access_token, SECRET_ACCESS_TOKEN);
    req.auth = data;
    return next();
  } catch(error) {
    console.log(error);
    return res.status(StatusCodes.UNAUTHORIZED).json({
      "error": "Unauthorized",
      "auth": false
    });
  }
}