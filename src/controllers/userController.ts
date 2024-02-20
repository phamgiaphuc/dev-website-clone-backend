import { Response } from "express";
import { UserModel } from "../models/userModel";
import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger";
import { JwtPayload } from 'jsonwebtoken';
import { ExtendedRequest } from "../middlewares/authMiddleware";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from 'uuid';

const userUploadProfileImg = async (req: ExtendedRequest, res: Response) => {
  const token = uuidv4();
  const filename = `${token}${req.file.originalname}`;
  const metadata = {
    metadata: {
      firebaseStorageDownloadTokens: token,
    },
    contentType: req.file.mimetype,
    cacheControl: "public, max-age=31536000",
  }
  await getStorage().bucket().file(`images/${filename}`).save(req.file.buffer, {
    metadata: metadata
  });
  const download_url = `https://firebasestorage.googleapis.com/v0/b/dev-website-clone.appspot.com/o/images%2F${filename}?alt=media&token=${token}`
  return res.status(StatusCodes.OK).json({
    "message": "File uploaded",
    "url": download_url
  });
}

const userUpdateProfile = async (req: ExtendedRequest, res: Response) => {
  try {
    const { id } = (req.auth as JwtPayload);
    await UserModel.findByIdAndUpdate(id, req.body);
    const user = await UserModel.findById(id);
    return res.status(StatusCodes.OK).json({ email: user.email, profile: user.profile });
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json({
      "error": "Updated fail"
    })
  }
}

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
  userProfile, userUploadProfileImg, userUpdateProfile
}