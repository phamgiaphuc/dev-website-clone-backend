import { logger } from "../configs/logger";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { get } from "lodash";
import { DashboardModel } from "../models/dashboard.model";

const checkIsFollowed = async (req: Request, res: Response) => {
  try {
    const id = get(req, "auth.id") as string;
    const { authorId } = req.body;
    const dashboard = await DashboardModel.findOne({
      userId: id
    });
    console.log(dashboard.followingUsers);
    console.log(authorId);
    const isFollowed = dashboard.followingUsers.some(userId => userId.equals(authorId));
    return res.status(StatusCodes.OK).json({ isFollowed });
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json({
      "error": "Can not check user's dashboard"
    })
  }
}

const followUser = async (req: Request, res: Response) => {
  try {
    const id = get(req, "auth.id") as string;
    const { followingUserId } = req.body;
    const userDashboard = await DashboardModel.findOne({
      userId: id
    });
    if (userDashboard) {
      userDashboard.followingUsers.push(followingUserId);
      await userDashboard.save();
    } else {
      await DashboardModel.create({
        userId: id,
        followingUsers: [followingUserId]
      });
    }
    return res.status(StatusCodes.OK).json({
      "success": true
    });
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json({
      "error": "Can not follow user"
    })
  }
}

const unFollowUser = async (req: Request, res: Response) => {
  try {
    const id = get(req, "auth.id") as string;
    const { followingUserId } = req.body;
    await DashboardModel.updateOne({
      userId: id
    }, { $pull: { followingUsers: followingUserId }});
    return res.status(StatusCodes.OK).json({
      "success": true
    });
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json({
      "error": "Can not unfollow user"
    })
  }
}

export const dashboardController = {
  followUser, unFollowUser, checkIsFollowed
};