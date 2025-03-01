import joi from "joi";
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
    refreshToken: joi.string().required(),
    avatar: joi.string(),
    list: joi.object({
      statusBased: joi.array().items(
        joi.object({
          items: joi.array().items(joi.string()),
          type: joi.string().valid("statusBased"),
          order: joi.array().items(joi.string()),
          addedAt: joi.date(),
          updatedAt: joi.date(),
        })
      ),
      themeBased: joi.array().items(
        joi.object({
          items: joi.array().items(joi.string()),
          type: joi.string().valid("statusBased"),
          order: joi.array().items(joi.string()),
          addedAt: joi.date(),
          updatedAt: joi.date(),
        })
      ),
    }),
    items: joi.array().items(
      joi.object({
        apiType: joi.string().valid("tmdb", "kitsu").required(),
        mediaId: joi.string().required(),
        title: joi.string(),
        customNotes: joi.string(),
        tags: joi.array().items(joi.string()),
        userRating: joi.number(),
        anticipation: joi.number(),
      })
    ),
    tags: joi.array().items(joi.string()),
    friends: joi.array().items(joi.string()),
    sharedLists: joi.object({
      sharedToMe: joi.array().items(joi.string()),
      sharedByMe: joi.array().items(joi.string()),
    }),
    collaborativeLists: joi.array().items(joi.string()),
  });
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    res.status(400).json({ message: error.message });
  } else {
    next();
  }
};

export { createUserValidation };
