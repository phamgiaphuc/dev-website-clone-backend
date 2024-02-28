import { logger } from "../configs/logger";
import { Request, Response } from "express";
import { getStorage } from "firebase-admin/storage";
import { StatusCodes } from "http-status-codes";
import { v4 as uuidv4 } from 'uuid';
import { get } from "lodash";
import { BlogModel } from "../models/blog.model";

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

export const createNewBlog = async (req: Request, res: Response) => {
  try {
    const id = get(req, "auth.id") as string;
    const blog = await BlogModel.create({
      author: id,
      ...req.body
    });
    return res.status(StatusCodes.CREATED).json(blog);
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json({
      "error": "Created new blog fail"
    })
  }
}

export const getBlogs = async (req: Request, res: Response) => {
  try {
    const id = get(req, "auth.id") as string;
    const blogs = await BlogModel.find({
      author: id,
      publish: req.query?.publish
    }).sort({ createdAt: req.query?.sort === 'desc' ? -1 : 1})
    return res.status(StatusCodes.CREATED).json(blogs);
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json({
      "error": "Get blogs failed"
    })
  }
}

export const getBlog = async (req: Request, res: Response) => {
  try {
    const { blogId } = req.params;
    return res.status(StatusCodes.OK).json(await BlogModel.findById(blogId));
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json({
      "error": "Get blogs failed"
    })
  }
}

export const blogController = {
  blogUploadCoverImg, createNewBlog, getBlogs, getBlog
}