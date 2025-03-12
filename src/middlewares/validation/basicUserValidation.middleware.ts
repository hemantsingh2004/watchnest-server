import joi from "joi";
import { Response, Request, NextFunction } from "express";

const searchUserValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = joi.object({
    query: joi.string().max(50).required(),
    type: joi.string().valid("name", "username").required(),
  });
  const { error } = schema.validate(
    {
      query: req.params.query,
      type: req.query.type,
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

const updateUserValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = joi.object({
    updateField: joi
      .string()
      .valid("name", "username", "email", "profileType")
      .required(),
    name: joi
      .string()
      .min(5)
      .max(50)
      .when("updateField", { is: "name", then: joi.required() })
      .optional(),
    username: joi
      .string()
      .min(5)
      .max(20)
      .when("updateField", { is: "username", then: joi.required() })
      .optional(),
    email: joi
      .string()
      .email()
      .when("updateField", { is: "email", then: joi.required() })
      .optional(),
    profileType: joi
      .string()
      .valid("public", "private")
      .when("updateField", { is: "profileType", then: joi.required() })
      .optional(),
  });
  const { error } = schema.validate(
    {
      updateField: req.body.updateField,
      name: req.body.name,
      username: req.body.username,
      email: req.body.email,
      profileType: req.body.profileType,
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

const updatePasswordValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = joi.object({
    oldPassword: joi.string().min(6).max(20).required(),
    newPassword: joi.string().min(6).max(20).required(),
  });
  const { error } = schema.validate(req.body, { abortEarly: false });
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

export { searchUserValidation, updateUserValidation, updatePasswordValidation };
