import { Request, Response } from "express";
import bcrypt from 'bcrypt';
import { UserModel } from "../models/userModel";
import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger";
import { formatUsername } from "../utils/formatUsername";
import jwt from 'jsonwebtoken';
import { emailRegex, passwordRegex } from "../utils/regexVars";
import { SECRET_REFRESH_TOKEN, SECRET_ACCESS_TOKEN, ACCESS_TOKEN_LIFE, REFRESH_TOKEN_LIFE } from "../configs/environment";
import { sendVerificationCode } from "../utils/mailService";

const generateRefreshToken = (user: any) => {
  return jwt.sign({
    id: user._id,
    email: user.email
  }, SECRET_REFRESH_TOKEN, { expiresIn: REFRESH_TOKEN_LIFE });
}

const generateAccessToken = (user: any) => {
  return jwt.sign({
    id: user._id,
    email: user.email
  }, SECRET_ACCESS_TOKEN, { expiresIn: ACCESS_TOKEN_LIFE });
}

const generateVerificationCode = () => {
  const codeLength = 6;
  let code = "";
  for (let i = 0; i < codeLength; i++) {
    code += (Math.floor(Math.random() * 10));
  }
  return code;
}

const userSignUp = async (req: Request, res: Response) => {
  try {
    const { email, password, fullname } = req.body;
    if (!email.length) {
      return res.status(StatusCodes.FORBIDDEN).json({
        "error": "Email is missing."
      });
    }
    if (!password.length) {
      return res.status(StatusCodes.FORBIDDEN).json({
        "error": "Password is missing."
      });
    }
    if (!emailRegex.test(email)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        "error": "Email is invalid."
      });
    }
    if (!passwordRegex.test(password)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        "error": "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase."
      })
    }
    if (fullname.length < 3) {
      return res.status(StatusCodes.FORBIDDEN).json({
        "error": "Full name must be 3 characters long."
      })
    }
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
    if (!user.verification.is_verified) {
      await sendVerificationCode(user.verification.verified_code, user.email);
      return res.status(StatusCodes.OK).json({
        "message": "User is not verifed. Please check your mail to get the verification code.",
        id: user._id, 
        is_verified: user.verification.is_verified
      });
    }
    const refresh_token = generateRefreshToken(user);
    const access_token = generateAccessToken(user);
    await UserModel.findByIdAndUpdate({ _id: user._id }, { refresh_token });
    res.cookie('user_rt', refresh_token, {
      httpOnly: true,
      secure: true,
      // sameSite: 'none',
      maxAge: +REFRESH_TOKEN_LIFE * 1000 // 1 day
    })
    return res.status(StatusCodes.CREATED).json({ access_token });
  } catch(error) {
    logger.error(error.message);
    if (error.code === 11000) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        "error": "User already existed. Please sign in." 
      })
    }
    return res.status(StatusCodes.BAD_REQUEST).json(error.message);
  }
}

const userSignIn = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email.length) {
      return res.status(StatusCodes.FORBIDDEN).json({
        "error": "Email is missing."
      });
    }
    if (!password.length) {
      return res.status(StatusCodes.FORBIDDEN).json({
        "error": "Password is missing."
      });
    }
    if (!emailRegex.test(email)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        "error": "Email is invalid."
      });
    }
    if (!passwordRegex.test(password)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        "error": "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase."
      })
    }
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        "error": "User not found."
      })
    }
    if (!user.verification.is_verified) {
      await sendVerificationCode(user.verification.verified_code, user.email);
      return res.status(StatusCodes.OK).json({
        "message": "User is not verifed. Please check your mail to get the verification code.",
        id: user._id, 
        is_verified: user.verification.is_verified
      });
    }
    bcrypt.compare(password, user.password, (error, result) => {
      if (error) {
        return res.status(StatusCodes.FORBIDDEN).json({
          "error": "Error occured while login please try again."
        }); 
      }
      if (!result) {
        return res.status(StatusCodes.FORBIDDEN).json({
          "error": "Incorrect password"
        }); 
      } else {
        const access_token = generateAccessToken(user);
        res.cookie('user_rt', user.refresh_token, {
          httpOnly: true,
          // secure: true,
          sameSite: 'none',
          maxAge: +REFRESH_TOKEN_LIFE * 1000 // 1 day
        })
        return res.status(StatusCodes.OK).json({ access_token });
      }
    })
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json(error.message);
  }
}

const userVerification = async (req: Request, res: Response) => {
  const { id } = req.query;
  const { code } = req.body;
  const user = await UserModel.findById(id);
  if (user.verification.verified_code === code) {
    user.set({
      verification: {
        is_verified: true,
      },
    });
    await user.save();
    const access_token = generateAccessToken(user);
    res.cookie('user_rt', user.refresh_token, {
      httpOnly: true,
      // secure: true,
      sameSite: 'none',
      maxAge: +REFRESH_TOKEN_LIFE * 1000 // 1 day
    })
    return res.status(StatusCodes.OK).json({ access_token }); 
  } else {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      "error": "Verified code is invalid."
    })
  }
}

const userRefreshToken = (req: Request, res: Response) => {
  try {
    const refresh_token = req.cookies?.user_rt;
    if (!refresh_token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        "error": "Unauthorized"
      });
    }
    jwt.verify(refresh_token, SECRET_REFRESH_TOKEN, async (error: Error, decoded: any) => {
      if (error) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          "error": "Unauthorized"
        });
      }
      const { id } = decoded;
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          "error": "Unauthorized"
        });
      }
      const access_token = generateAccessToken(user);
      res.cookie('user_rt', user.refresh_token, {
        httpOnly: true,
        // secure: true,
        sameSite: 'none',
        maxAge: +REFRESH_TOKEN_LIFE * 1000 // 1 day
      })
      return res.status(StatusCodes.OK).json({ access_token }); 
    });
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json(error.message);
  }
}

const userProfile = (req: Request, res: Response) => {
  try {
    const refresh_token = req.cookies?.user_rt;
    if (!refresh_token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        "error": "Unauthorized"
      });
    }
    jwt.verify(refresh_token, SECRET_REFRESH_TOKEN, async (error: Error, decoded: any) => {
      if (error) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          "error": "Unauthorized"
        });
      }
      const { id } = decoded;
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          "error": "User not found."
        });
      }
      return res.status(StatusCodes.OK).json(user); 
    });
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json(error.message);
  }
}

export const userController = {
  userSignUp, userSignIn, userRefreshToken, userProfile, userVerification
}