import { SECRET_ACCESS_TOKEN } from '../configs/environment';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { merge } from 'lodash';

export const authTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.header('Authorization').split(' ')[1];
    const data = jwt.verify(accessToken, SECRET_ACCESS_TOKEN);
    merge(req, { auth: data });
    return next();
  } catch(error) {
    console.log(error);
    return res.status(StatusCodes.UNAUTHORIZED).json({
      "error": "Unauthorized",
      "auth": false
    });
  }
}