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
import firebaseAuthKey from '../jsons/dev-website-clone-firebase-adminsdk-jz6bz-afc58301c1.json';
import admin from 'firebase-admin';
import { getAuth } from "firebase-admin/auth";

admin.initializeApp({
  credential: admin.credential.cert(firebaseAuthKey as admin.ServiceAccount)
});

const generateRefreshToken = (user: any) => {
  return jwt.sign({
    id: user._id,
    email: user.email
  }, SECRET_REFRESH_TOKEN);
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
      },
    });
    await UserModel.findByIdAndUpdate({ _id: user._id }, { refresh_token: generateRefreshToken(user) });
    if (!user.verification.is_verified) {
      await sendVerificationCode(user.verification.verified_code, user.email);
      return res.status(StatusCodes.CREATED).json({
        "message": "User is not verifed. Please check your mail to get the verification code.",
        id: user._id, 
        is_verified: user.verification.is_verified
      });
    }
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
    if (user.google_auth) {
      return res.status(StatusCodes.OK).json({
        "message": "Account was created using Google. Try log in with Google.",
        id: user._id, 
        google_auth: user.google_auth
      });
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
          // sameSite: 'none',
          maxAge: +REFRESH_TOKEN_LIFE * 1000 // 1 day
        });
        return res.status(StatusCodes.OK).json({ access_token, email: user.email, role: user.role, profile: user.profile });
      }
    })
  } catch(error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json(error.message);
  }
}

const userSignOut = (req: Request, res: Response) => {
  res.cookie('user_rt', 'none', {
    httpOnly: true,
    expires: new Date(Date.now() + 5 * 1000),
  });
  return res.status(StatusCodes.OK).json({
    "message": "User logged out successfully"
  });
}

const userGoogleAuth = (req: Request, res: Response) => {
  const { token } = req.body;
  getAuth().verifyIdToken(token)
    .then(async (decodedUser) => {
      let { email, name, picture } = decodedUser;
      picture = picture.replace("s96-c", "s384-c");
      const user = await UserModel.findOne({ email });
      if (user) {
        const { google_auth, verification: { is_verified, verified_code }} = user;
        if (is_verified && verified_code === null && !google_auth) {
          return res.status(StatusCodes.FORBIDDEN).json({
            "error": "This email was signed up without Google. Please sign in with password to access the account."
          })
        }
        if (google_auth) {
          const access_token = generateAccessToken(user);
          res.cookie('user_rt', user.refresh_token, {
            httpOnly: true,
            // secure: true,
            // sameSite: 'none',
            maxAge: +REFRESH_TOKEN_LIFE * 1000 // 1 day
          });
          return res.status(StatusCodes.OK).json({ access_token, email: user.email, role: user.role, profile: user.profile });
        }
      }
      const newUser = await UserModel.create({
        email,
        password: 'no-password',
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
      const refresh_token = generateRefreshToken(newUser);
      await UserModel.findByIdAndUpdate({ _id: newUser._id }, { refresh_token: refresh_token });
      const access_token = generateAccessToken(newUser);
      console.log('end');
      res.cookie('user_rt', refresh_token, {
        httpOnly: true,
        // secure: true,
        // sameSite: 'none',
        maxAge: +REFRESH_TOKEN_LIFE * 1000 // 1 day
      });
      return res.status(StatusCodes.OK).json({ access_token, email: newUser.email, role: newUser.role, profile: newUser.profile });
    })
    .catch((error) => {
      logger.error(error.message);
      return res.status(StatusCodes.BAD_REQUEST).json(error.message);
    })
}

const userVerification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { code } = req.body;
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        "error": "User not found."
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
      res.cookie('user_rt', user.refresh_token, {
        httpOnly: true,
        // secure: true,
        // sameSite: 'none',
        maxAge: +REFRESH_TOKEN_LIFE * 1000 // 1 day
      })
      return res.status(StatusCodes.OK).json({ access_token, email: user.email, role: user.role, profile: user.profile });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        "error": "Verified code is invalid."
      })
    }
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json(error.message);
  }
}

const resendVerification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        "error": "User not found."
      })
    }
    if (user.verification.is_verified) {
      return res.status(StatusCodes.ACCEPTED).json({is_verified: user.verification.is_verified});
    }
    const code = generateVerificationCode();
    user.set({
      verification: {
        is_verified: user.verification.is_verified,
        verified_code: code
      }
    });
    await user.save();
    await sendVerificationCode(user.verification.verified_code, user.email);
    return res.status(StatusCodes.OK).json({
      "message": "Code is resend. Please check your mail to get the verification code.",
    });
  } catch (error) {
    logger.error(error.message);
    return res.status(StatusCodes.BAD_REQUEST).json(error.message);
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
        // sameSite: 'none',
        maxAge: +REFRESH_TOKEN_LIFE * 1000 // 1 day
      })
      return res.status(StatusCodes.OK).json({access_token, email: user.email, role: user.role, profile: user.profile}); 
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
  userSignUp, userSignIn, userSignOut, userRefreshToken, userProfile, userVerification, resendVerification, userGoogleAuth
}