import express, { Request, Response, NextFunction } from "express";
import {
  createUserValidation,
  loginUserValidation,
  refreshTokenValidation,
} from "../middlewares/validation/authValidation.middleware.ts";
import { createUser, findUser, loginUser } from "../models/user/user.model.ts";
import { IUser } from "../models/user/user.schema.ts";
import userAuthorization from "../middlewares/authorization/userAuthorization.middleware.ts";
import mongoose from "mongoose";
import { createAccessJWT, verifyRefreshJWT } from "../helper/jwt.helper.ts";

const router = express.Router();

router.all("/", (req: Request, res: Response, next: NextFunction) => {
  next();
});

router.post(
  "/register",
  createUserValidation,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userObj: IUser = req.body;
    try {
      const result = await createUser(userObj);
      if (result) {
        res.status(200).json({ message: "User created successfully", result });
      } else {
        res.status(400).json({ message: "User creation failed" });
      }
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/login",
  loginUserValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const userObj = req.body;
    try {
      const result = await loginUser(userObj);
      if (result) {
        res.status(200).json(result);
      } else {
        res.status(400).json({ message: "Login failed" });
      }
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/refresh",
  userAuthorization,
  refreshTokenValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;
    try {
      await verifyRefreshJWT(refreshToken);
      const userId = new mongoose.Types.ObjectId(req.userId);
      const user = (await findUser(userId)) as IUser;
      if (user) {
        if (user.refreshToken === refreshToken) {
          const accessToken = await createAccessJWT({ _id: user._id });
          if (accessToken) {
            res
              .status(200)
              .json({ message: "Token refreshed successfully", accessToken });
          } else {
            res.status(400).json({ message: "Unable to create token" });
          }
        } else {
          res.status(400).json({ message: "Invalid token. Login required" });
        }
      } else {
        res.status(400).json({ message: "User not found" });
      }
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
