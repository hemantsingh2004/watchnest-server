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
  name: joi.string().min(3).max(100).required(),
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
  const commonListschema = joi.object({
    type: joi.string().valid("statusBased", "themeBased").required(),
    listId: joi
      .string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required(),
  });
  const { error } = commonListschema.validate(
    {
      type: req.query.type,
      listId: req.params.listId,
    },
    { abortEarly: false }
  );
  if (error) {
    const err = Object.assign(
      new Error(
        `Validation failed: ${error.details.map((x) => x.message).join(", ")}`
      ),
      { status: 400 }
    );
    return next(err);
  } else {
    next();
  }
};

const updateListValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const listUpdateSchema = joi.object({
    listId: joi
      .string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required(),
    updateType: joi.string().valid("privacy", "name").required(),
    privacy: joi
      .string()
      .valid("public", "private")
      .when("updateType", { is: "privacy", then: joi.required() })
      .optional(),
    name: joi
      .string()
      .min(3)
      .max(100)
      .when("updateType", { is: "name", then: joi.required() })
      .optional(),
  });

  const { error } = listUpdateSchema.validate(
    {
      listId: req.params.listId,
      updateType: req.query.updateType,
      privacy: req.body.privacy,
      name: req.body.name,
    },
    { abortEarly: false }
  );

  if (error) {
    const err = Object.assign(
      new Error(
        `Validation failed: ${error.details.map((x) => x.message).join(", ")}`
      ),
      { status: 400 }
    );
    return next(err);
  } else {
    next();
  }
};

export { createlistValidation, commonListValidation, updateListValidation };
