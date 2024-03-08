import { logger } from "../configs/logger";
import { Request, Response } from "express";
import { getStorage } from "firebase-admin/storage";
import { StatusCodes } from "http-status-codes";
import { v4 as uuidv4 } from 'uuid';
import { get } from "lodash";
import { BlogModel } from "../models/blog.model";
import { UserModel } from "../models/user.model";
import { DashboardModel } from "../models/dashboard.model";

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
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      "error": "Created new blog fail"
    })
  }
}

export const getUserPublishBlogs = async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findOne({
      "profile.username": req.params.username
    });
    const blogs = await BlogModel.find({
      author: user._id,
      publish: req.query?.publish
    }).sort({ createdAt: req.query?.sort === 'desc' ? -1 : 1 });
    return res.status(StatusCodes.OK).json(blogs);
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      "error": "Get user blogs failed"
    })
  }
}

export const getAllUserBlogs = async (req: Request, res: Response) => {
  try {
    const id = get(req, "auth.id") as string;
    return res.status(StatusCodes.OK).json(
      await BlogModel.find({
        author: id
      }).limit(2).skip(+req.query?.page * 2).sort({ createdAt: req.query?.sort === 'desc' ? -1 : 1 })
    );
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      "error": "Get user blogs failed"
    })
  }
}


export const getBlog = async (req: Request, res: Response) => {
  try {
    const { blogId } = req.params;
    const blog = await BlogModel.findById(blogId).populate({
      path: "author",
      select: "email profile createdAt"
    });
    return res.status(StatusCodes.OK).json(blog);
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      "error": "Get user blog failed"
    })
  }
}

export const getAllPublishBlogs = async (req: Request, res: Response) => {
  try {
    return res.status(StatusCodes.OK).json(await BlogModel.find({
      publish: req.query?.publish
    }).populate({
      path: "author",
      select: "profile.profile_img profile.username profile.fullname"
    }).sort({ createdAt: req.query?.sort === 'desc' ? -1 : 1}));
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      "error": "Get all blogs failed"
    })
  }
}

export const getRecentBlogsByDate = async (req: Request, res: Response) => {
  try {
    return res.status(StatusCodes.OK).json(await BlogModel.find({
      publish: req.query?.publish
    }).populate({
      path: "author",
      select: "profile.username"
    }).sort({ createdAt: -1 }).limit(+req.query?.limit));
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      "error": "Get recent blogs failed"
    })
  }
}

export const getUserGeneralBlogData = async (req: Request, res: Response) => {
  try {
    const id = get(req, "auth.id") as string;
    const generalData = {
      totalBlogs: await BlogModel.countDocuments({ author: id }),
      dashboard: await DashboardModel.findOne({ userId: id }).populate({ path: "followingUsers", select: "profile.profile_img profile.username profile.fullname"})
    }
    return res.status(StatusCodes.OK).json(generalData);
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      "error": "Get recent blogs failed"
    })
  }
}

export const blogController = {
  blogUploadCoverImg, createNewBlog, getUserPublishBlogs, getBlog, getAllPublishBlogs, getRecentBlogsByDate, getUserGeneralBlogData,
  getAllUserBlogs
}