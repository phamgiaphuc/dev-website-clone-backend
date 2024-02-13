import { Request, Response } from "express";
import { UserModel } from "../models/userModel";
import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger";
import { JwtPayload } from 'jsonwebtoken';
import { ExtendedRequest } from "middlewares/authMiddleware";

const userProfile = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = (req.auth as JwtPayload);
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        "error": "User not found."
      });
    }
    return res.status(StatusCodes.OK).json({ email: user.email, role: user.role, profile: user.profile }); 
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json(error.message);
  }
}

export const userController = {
  userProfile
}