import { logger } from "../configs/logger";
import { Request, Response } from "express";
import { getStorage } from "firebase-admin/storage";
import { StatusCodes } from "http-status-codes";
import { v4 as uuidv4 } from 'uuid';

const blogUploadCoverImg = async (req: Request, res: Response) => {
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
    await getStorage().bucket().file(`blogs/${filename}`).save(req.file.buffer, {
      metadata: metadata
    });
    const download_url = `https://firebasestorage.googleapis.com/v0/b/dev-website-clone.appspot.com/o/blogs%2F${filename}?alt=media&token=${token}`
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

export const blogController = {
  blogUploadCoverImg
}