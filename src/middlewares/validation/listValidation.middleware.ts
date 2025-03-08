import joi from "joi";
import { Response, Request, NextFunction } from "express";

const itemSchema = joi.object({
  mediaId: joi.string().required(),
  title: joi.string().optional(),
  information: joi
    .object({
      createdAt: joi.date().required(),
      updatedAt: joi.date().optional(),
      rating: joi.number().optional(),
      ageRating: joi.string().optional(),
      posterImage: joi.string().required(),
      coverImage: joi.string().optional(),
      genres: joi.array().items(joi.string()).optional(),
    })
    .required(),
  customNotes: joi.string().optional(),
  tags: joi.array().items(joi.string()).optional(),
  userRating: joi.number().optional(),
  anticipation: joi.number().optional(),
  sortOrder: joi.number().optional(),
});

const listDetailsSchema = joi.object({
  items: joi.array().items(itemSchema).optional(),
  privacy: joi.string().valid("public", "private").required(),
  type: joi.string().valid("statusBased", "themeBased").required(),
  addedAt: joi.date().default(() => new Date()),
  updatedAt: joi.date().default(() => new Date()),
});

const createlistValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = listDetailsSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return next(error);
  } else {
    next();
  }
};

const commonListValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = joi.object({
    type: joi.string().valid("statusBased", "themeBased").required(),
    listId: joi
      .string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required(),
  });
  const { error } = schema.validate({
    type: req.query.type,
    listId: req.params.listId,
  });
  if (error) {
    return next(
      new Error(
        `Validation failed: ${error.details.map((x) => x.message).join(", ")}`
      )
    );
  } else {
    next();
  }
};

export { createlistValidation, commonListValidation };
