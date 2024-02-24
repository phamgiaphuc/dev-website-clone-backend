import { NextFunction, Request, Response } from 'express';
import { body ,cookie, param, validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import { passwordRegex } from '../utils/regexVars';

export const signUpValidationOption = () => {
  return [
    body("email")
      .exists().withMessage("Missing email")
      .isEmail().normalizeEmail({gmail_remove_dots: false}).withMessage("Invalid email"),
    body("password")
      .exists().withMessage("Missing password")
      .matches(passwordRegex).withMessage("Password is invalid"),
    body("fullname")
      .exists().withMessage("Missing full name")
      .isLength({min: 3}).withMessage("Full name must be 3 characters long")
  ]
}

export const signInValidationOption = () => {
  return [
    body("email")
      .exists().withMessage("Missing email")
      .isEmail().normalizeEmail({gmail_remove_dots: false}).withMessage("Invalid email"),
    body("password")
      .exists().withMessage("Missing password")
      .matches(passwordRegex).withMessage("Invalid password"),
  ]
}

export const signOutValidationOption = () => {
  return [
    cookie("refreshToken").exists().withMessage("Missing refresh token")
  ]
}

export const verficationValidationOption = () => {
  return [
    param("id").exists().withMessage("Missing id"),
    body("code")
      .exists().withMessage("Missing code")
      .isNumeric().withMessage("Invalid code")
  ]
}

export const authValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      "error": errors.array()
    });
  }
  return next();
}