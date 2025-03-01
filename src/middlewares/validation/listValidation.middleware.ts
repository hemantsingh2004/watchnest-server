import joi from "joi";
import { Response, Request, NextFunction } from "express";

//todo : complete this later

const createlistValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = joi.object({
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
  });
};
