import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import jwt, { JsonWebTokenError, JwtPayload } from 'jsonwebtoken';
import { UserModel } from '../models/user.model';
import { formatUsername } from '../utils/formatUsername';
import { REFRESH_COOKIE_LIFE, SECRET_REFRESH_TOKEN } from '../configs/environment';
import { sendVerificationCode } from '../configs/mail';
import { logger } from '../configs/logger';
import { getAuth } from 'firebase-admin/auth';
import { AuthModel } from '../models/auth.model';
import { generateVerificationCode, generateAccessToken, generateRefreshToken } from '../utils/authToken';

const signUp = async (req: Request, res: Response) => {
  const { email, password, fullname } = req.body;
  try {
    const user = await UserModel.create({
      email,
      password: await bcrypt.hash(password, 10),
      profile: {
        fullname,
        username: formatUsername(email)
      },
      verification: {
        verified_code: generateVerificationCode()
      }
    });
    await sendVerificationCode(user.verification.verified_code, user.email, user.profile.fullname);
    return res.status(StatusCodes.CREATED).json({
      "message": "New account is created.",
      id: user._id, 
      is_verified: user.verification.is_verified
    });
  } catch (error) {
    logger.error(error.message);
    if (error.code === 11000) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        "error": "User already existed. Please sign in."
      });
    }
    return res.status(StatusCodes.BAD_REQUEST).json(error.message);
  }
}

const signIn = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        "error": "User not found. Please sign up."
      })
    }
    if (user.google_auth) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        "error": "Account was created using Google. Try log in with Google.",
      })
    }
    bcrypt.compare(password, user.password, async (error, result) => {
      if (error) {
        return res.status(StatusCodes.FORBIDDEN).json({
          "error": "Error occured while login please try again"
        });
      }
      if (!result) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          "error": "Incorrect password"
        });
      }
      if (!user.verification.is_verified) {
        await sendVerificationCode(user.verification.verified_code, user.email, user.profile.fullname);
        return res.status(StatusCodes.OK).json({
          "message": "The account is not verified. Please check your mail to get the verification code.",
          id: user._id, 
          is_verified: user.verification.is_verified
        });
      }
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      await AuthModel.create({
        userId: user._id,
        refreshToken: refreshToken
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "strict",
        maxAge: +REFRESH_COOKIE_LIFE * 1000 // 1 day
      });
      return res.status(StatusCodes.OK).json({ email: user.email, role: user.role, profile: user.profile, createdAt: user.createdAt, google_auth: user.google_auth, accessToken });
    });
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json(error.message);
  }
}

const signOut = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  await AuthModel.findOneAndDelete({ refreshToken });
  res.clearCookie('refreshToken');
  return res.status(StatusCodes.OK).json({
    "message": "User sign out"
  })
}

const refreshToken = (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      "error": "Unauthorized",
      "auth1": false
    });
  }
  jwt.verify(refreshToken, SECRET_REFRESH_TOKEN, async (error: JsonWebTokenError, decoded: JwtPayload) => {
    if (error) {
      await AuthModel.findOneAndDelete({ refreshToken: refreshToken });
      res.clearCookie('refreshToken', refreshToken);
      return res.status(StatusCodes.UNAUTHORIZED).json({
        "error": "Unauthorized",
        "auth2": false
      });
    }
    const { id } = decoded;
    try {
      const user = await UserModel.findById(id);
      const auth = await AuthModel.findOne({ refreshToken: refreshToken });
      if (user._id.equals(auth.userId) && auth.refreshToken === refreshToken) {
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        await AuthModel.findByIdAndDelete(auth._id);
        await AuthModel.create({
          userId: user._id,
          refreshToken: newRefreshToken
        });
        res.cookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: false,
          path: "/",
          sameSite: "strict",
          maxAge: +REFRESH_COOKIE_LIFE * 1000 // 1 day
        });
        return res.status(StatusCodes.OK).json({ accessToken: newAccessToken });
      }
    } catch (error) {
      logger.error(error.message);
      await AuthModel.findOneAndDelete({ refreshToken: refreshToken });
      res.clearCookie('refreshToken', refreshToken);
      return res.status(StatusCodes.UNAUTHORIZED).json({
        "error": "Unauthorized",
        "auth3": false
      });
    }
  })
}

const googleAuth = (req: Request, res: Response) => {
  const { token } = req.body;
  getAuth().verifyIdToken(token)
    .then(async (decoded) => {
      let { name, email, picture } = decoded;
      picture = picture.replace("s96-c", "s384-c");
      const user = await UserModel.findOne({ email });
      if (user) {
        const { google_auth, verification: { is_verified, verified_code }} = user;
        if (is_verified && verified_code === null && !google_auth) {
          return res.status(StatusCodes.FORBIDDEN).json({
            "error": "This email was signed up without Google. Please sign in with password to access the account."
          });
        }
        if (googleAuth) {
          const accessToken = generateAccessToken(user);
          const refreshToken = generateRefreshToken(user);
          await AuthModel.create({
            userId: user._id,
            refreshToken: refreshToken
          });
          res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            path: "/",
            sameSite: "strict",
            maxAge: +REFRESH_COOKIE_LIFE * 1000 // 1 day
          });
          return res.status(StatusCodes.OK).json({ email: user.email, role: user.role, profile: user.profile, createdAt: user.createdAt, google_auth: user.google_auth, accessToken });
        }
      }
      const newUser = await UserModel.create({
        email,
        password: await bcrypt.hash('no-password', 10),
        profile: {
          fullname: name,
          username: formatUsername(email),
          profile_img: picture
        },
        verification: {
          is_verified: true,
          verified_code: null
        },
        google_auth: true,
      });
      await newUser.save();
      const accessToken = generateAccessToken(newUser);
      const refreshToken = generateRefreshToken(newUser);
      await AuthModel.create({
        userId: newUser._id,
        refreshToken: refreshToken
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "strict",
        maxAge: +REFRESH_COOKIE_LIFE * 1000 // 1 day
      });
      return res.status(StatusCodes.OK).json({ email: newUser.email, role: newUser.role, profile: newUser.profile, createdAt: newUser.createdAt, google_auth: newUser.google_auth, accessToken });
    })
    .catch((error) => {
      logger.error(error.message);
      return res.status(StatusCodes.BAD_REQUEST).json(error.message);
    })
}

const verificationCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { code } = req.body;
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        "error": "User not found."
      })
    }
    if (user.verification.is_verified) {
      return res.status(StatusCodes.OK).json({
        "message": "The account is already verified. Please sign in.",
        is_verified: user.verification.is_verified
      })
    }
    if (user.verification.verified_code === code) {
      user.set({
        verification: {
          is_verified: true,
          verified_code: null
        },
      });
      await user.save();
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      await AuthModel.create({
        userId: user._id,
        refreshToken: refreshToken
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "strict",
        maxAge: +REFRESH_COOKIE_LIFE * 1000 // 1 day
      });
      return res.status(StatusCodes.OK).json({ email: user.email, role: user.role, profile: user.profile, createdAt: user.createdAt, google_auth: user.google_auth, accessToken });
    }
    return res.status(StatusCodes.UNAUTHORIZED).json({
      "error": "Verified code is invalid."
    });
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json(error.message);
  }
}

export const authController = {
  signUp, signIn, signOut, googleAuth, verificationCode, refreshToken
}