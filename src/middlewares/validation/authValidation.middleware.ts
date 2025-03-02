import joi, { LanguageMessages } from "joi";
import { Response, Request, NextFunction } from "express";

const createUserValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = joi.object({
    name: joi.string().min(5).max(50).required(),
    username: joi.string().min(5).max(20).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).max(20).required(),
    profileType: joi.string().valid("public", "private").required(),
    avatar: joi.string(),
  });
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return next(error);
  } else {
    next();
  }
};

const loginUserValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = joi
    .object({
      username: joi.string().min(5).max(20).optional(),
      email: joi.string().email().optional(),
      password: joi.string().min(6).max(20).required(),
    })
    .custom((value, helpers) => {
      if (!value.username && !value.email) {
        return helpers.error("Either username or email must be provided");
      }
      return value;
    });

  const { error } = schema.validate(req.body);

  if (error) {
    return next(error);
  }

  next();
};

const refreshTokenValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = joi.object({
    refreshToken: joi.string().required(),
  });
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const err = new Error(error.message) as Error & { status: number };
    err.status = 403;
    return next(err);
  } else {
    next();
  }
};

export { createUserValidation, loginUserValidation, refreshTokenValidation };
