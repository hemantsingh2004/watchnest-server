import joi, { LanguageMessages } from "joi";
import { Response, Request, NextFunction } from "express";

const createUserValidation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const schema = joi.object({
    name: joi.string().min(5).max(50).required(),
    username: joi.string().min(5).max(20).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).max(20).required(),
    profileType: joi.string().valid("public", "private").required(),
    refreshToken: joi.string(),
    avatar: joi.string(),
    list: joi.object({
      statusBased: joi.array().items(joi.string()),
      themeBased: joi.array().items(joi.string()),
    }),
    tags: joi.array().items(joi.string()),
    friends: joi.array().items(joi.string()),
    sharedLists: joi.array().items(
      joi.object({
        list: joi.string().required(),
        sharedBy: joi.string(),
        sharedTo: joi.string(),
      })
    ),
    collaborativeLists: joi.array().items(joi.string()),
  });
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    res.status(400).json({ message: error.message });
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
      username: joi.string().min(5).max(20).optional(), // Make username optional
      email: joi.string().email().optional(), // Make email optional
      password: joi.string().min(6).max(20).required(),
    })
    .custom((value, helpers) => {
      // Ensure that either username or email is provided
      if (!value.username && !value.email) {
        return helpers.error("Either username or email must be provided");
      }
      return value;
    });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
      fullError: error,
    });
  }

  next();
};

export { createUserValidation, loginUserValidation };
