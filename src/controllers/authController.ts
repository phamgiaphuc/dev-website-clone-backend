import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import jwt, { JsonWebTokenError, JwtPayload } from 'jsonwebtoken';
import { UserModel } from '../models/userModel';
import { emailRegex, passwordRegex } from '../utils/regexVars';
import { formatUsername } from '../utils/formatUsername';
import { ACCESS_TOKEN_LIFE, REFRESH_TOKEN_LIFE, SECRET_ACCESS_TOKEN, SECRET_REFRESH_TOKEN } from '../configs/environment';
import { sendVerificationCode } from '../utils/mailService';
import { logger } from '../configs/logger';
import { getAuth } from 'firebase-admin/auth';

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

const signUp = async (req: Request, res: Response) => {
  const { email, password, fullname } = req.body;
  if (!email.length) {
    return res.status(StatusCodes.FORBIDDEN).json({
      "error": "Email is missing"
    });
  }
  if (!password.length) {
    return res.status(StatusCodes.FORBIDDEN).json({
      "error": "Password is missing"
    })
  }
  if (!emailRegex.test(email)) {
    return res.status(StatusCodes.FORBIDDEN).json({
      "error": "Email is invalid"
    })
  }
  if (!passwordRegex.test(password)) {
    return res.status(StatusCodes.FORBIDDEN).json({
      "error": "Password is invalid"
    })
  }
  if (fullname.length < 3) {
    return res.status(StatusCodes.FORBIDDEN).json({
      "error": "Full name must be 3 characters long"
    })
  }
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
    if (!user.verification.is_verified) {
      await sendVerificationCode(user.verification.verified_code, user.email);
      return res.status(StatusCodes.CREATED).json({
        "message": "The account is not verified. Please check your mail to get the verification code",
        id: user._id,
        is_verified: user.verification.is_verified
      });
    }
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
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        "error": "User not found"
      })
    }
    if (user.google_auth) {
      return res.status(StatusCodes.OK).json({
        "message": "Account was created using Google. Try log in with Google",
        google_auth: user.google_auth
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
        await sendVerificationCode(user.verification.verified_code, user.email);
        return res.status(StatusCodes.OK).json({
          "message": "The account is not verified. Please check your mail to get the verification code",
          id: user._id, 
          is_verified: user.verification.is_verified
        });
      }
      const access_token = generateAccessToken(user);
      const refresh_token = generateRefreshToken(user);
      await UserModel.findByIdAndUpdate({ _id: user._id }, { refresh_token });
      return res.status(StatusCodes.OK).json({ access_token, refresh_token });
    });
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json(error.message);
  }
}

const signOut = (req: Request, res: Response) => {
  return res.status(StatusCodes.OK).json({
    "message": "User sign out"
  })
}

const refreshToken = (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refreshToken) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      "error": "Unauthorized",
      "auth": false
    });
  }
  try {
    jwt.verify(refresh_token, SECRET_REFRESH_TOKEN, async (error: JsonWebTokenError, decoded: JwtPayload) => {
      if (error) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          "error": "Unauthorized",
          "auth": false
        });
      }
      const { id } = decoded;
      const user = await UserModel.findById(id).where('refresh_token').equals(refresh_token);
      if (user) {
        const access_token = generateAccessToken(user);
        const refresh_token = generateRefreshToken(user);
        user.set({
          refresh_token
        });
        await user.save();
        return res.status(StatusCodes.OK).json({access_token, refresh_token});
      }
      return res.status(StatusCodes.UNAUTHORIZED).json({
        "error": "Unauthorized",
        "auth": false
      });
    })
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json(error.message);
  }
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
          const access_token = generateAccessToken(user);
          const refresh_token = generateRefreshToken(user);
          await UserModel.findByIdAndUpdate({ _id: user._id }, { refresh_token });
          return res.status(StatusCodes.OK).json({ access_token, refresh_token });
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
      const access_token = generateAccessToken(newUser);
      const refresh_token = generateRefreshToken(newUser);
      await UserModel.findByIdAndUpdate({ _id: newUser._id }, { refresh_token });
      return res.status(StatusCodes.OK).json({ access_token, refresh_token });
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
      const access_token = generateAccessToken(user);
      const refresh_token = generateRefreshToken(user);
      await UserModel.findByIdAndUpdate({ _id: user._id }, { refresh_token });
      return res.status(StatusCodes.OK).json({ access_token, refresh_token });
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