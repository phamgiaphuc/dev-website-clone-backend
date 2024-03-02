import { Request, Response } from "express";
import { UserModel } from "../models/user.model";
import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from 'uuid';
import { get } from "lodash";
import bcrypt from 'bcrypt';
import { BlogModel } from "../models/blog.model";
import { AuthModel } from "../models/auth.model";

const userUploadProfileImg = async (req: Request, res: Response) => {
  const token = uuidv4();
  const filename = `${token}${req.file.originalname}`;
  const metadata = {
    metadata: {
      firebaseStorageDownloadTokens: token,
    },
    contentType: req.file.mimetype,
    cacheControl: "public, max-age=31536000",
  }
  try {
    await getStorage().bucket().file(`images/${filename}`).save(req.file.buffer, {
      metadata: metadata
    });
    const download_url = `https://firebasestorage.googleapis.com/v0/b/dev-website-clone.appspot.com/o/images%2F${filename}?alt=media&token=${token}`
    return res.status(StatusCodes.OK).json({
      "message": "File uploaded",
      "url": download_url
    });
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json({
      "error": "Uploaded fail"
    })
  }
}

const userUpdateProfile = async (req: Request, res: Response) => {
  try {
    const id = get(req, "auth.id") as string;
    await UserModel.findByIdAndUpdate(id, req.body);
    const user = await UserModel.findById(id, 'email profile created_at');
    return res.status(StatusCodes.OK).json(user);
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json({
      "error": "Updated fail"
    })
  }
}

const userProfile = async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findOne({
      "profile.username": req.params.username
    }, "");
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        "error": "User not found"
      });
    }
    return res.status(StatusCodes.OK).json({ email: user.email, profile: user.profile, createdAt: user.createdAt }); 
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json(error.message);
  }
}

const userResetPassword = async (req: Request, res:Response) => {
  try {
    const id = get(req, "auth.id") as string;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        "error": "Passwords do not match"
      })
    }
    const user = await UserModel.findById(id);
    bcrypt.compare(currentPassword, user.password, async (error, result) => {
      if (error) {
        return res.status(StatusCodes.FORBIDDEN).json({
          "error": "Error occured while reset please try again"
        });
      }
      if (!result) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          "error": "Incorrect password"
        });
      }
      user.set({
        password: await bcrypt.hash(newPassword, 10)
      })
      await user.save();
      return res.status(StatusCodes.OK).json({
        "message": "Reset password success"
      })
    });
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json({
      "error": "Reset password failed"
    });
  }
}

export const userDeleteAccount = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    const id = get(req, "auth.id") as string;
    await BlogModel.deleteMany({
      author: id
    });
    await AuthModel.findOneAndDelete({ refreshToken });
    await UserModel.findByIdAndDelete(id);
    res.clearCookie('refreshToken');
    return res.status(StatusCodes.OK).json({
      "message": "Delete account success and user sign out"
    })
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json({
      "error": "Delete account failed"
    });
  }
}

export const userController = {
  userProfile, userUploadProfileImg, userUpdateProfile, userResetPassword, userDeleteAccount
}