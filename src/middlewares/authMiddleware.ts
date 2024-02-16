import { SECRET_ACCESS_TOKEN } from '../configs/environment';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface ExtendedRequest extends Request {
  auth: string | JwtPayload
}

export const authMiddleware = (req: ExtendedRequest, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.header('Authorization').replace('Bearer', '').trim() // Bearer accessToken
    if (!accessToken) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        "error": "Unauthorized",
        "auth": false
      });
    }
    const data = jwt.verify(accessToken, SECRET_ACCESS_TOKEN);
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