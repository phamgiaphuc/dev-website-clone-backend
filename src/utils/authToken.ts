import { ACCESS_TOKEN_LIFE, REFRESH_TOKEN_LIFE, SECRET_ACCESS_TOKEN, SECRET_REFRESH_TOKEN } from '../configs/environment';
import jwt from 'jsonwebtoken';

export const generateRefreshToken = (user: any) => {
  return jwt.sign({
    id: user._id,
    email: user.email
  }, SECRET_REFRESH_TOKEN, { expiresIn: REFRESH_TOKEN_LIFE });
}

export const generateAccessToken = (user: any) => {
  return jwt.sign({
    id: user._id,
    email: user.email,
    role: user.role
  }, SECRET_ACCESS_TOKEN, { expiresIn: ACCESS_TOKEN_LIFE });
}

export const generateVerificationCode = () => {
  const codeLength = 6;
  let code = "";
  for (let i = 0; i < codeLength; i++) {
    code += (Math.floor(Math.random() * 10));
  }
  return code;
}