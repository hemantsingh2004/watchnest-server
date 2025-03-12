import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import {
  deleteUser,
  findUser,
  searchUser,
  updatePassword,
  updateUser,
} from "../models/user/user.model.ts";
import userAuthorization from "../middlewares/authorization/userAuthorization.middleware.ts";
import {
  searchUserValidation,
  updatePasswordValidation,
  updateUserValidation,
} from "../middlewares/validation/basicUserValidation.middleware.ts";

const router = express.Router();

router.all("/", (req: Request, res: Response, next: NextFunction) => {
  next();
});

router.get(
  "/get/:userId",
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    try {
      const result = await findUser(userId);
      if (result) {
        res.status(200).json(result);
      } else {
        res.status(400).json({ message: "User not found" });
      }
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/search/:query",
  userAuthorization,
  searchUserValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.params.query;
    const type = req.query.type === "username" ? "username" : "name";
    try {
      const result = await searchUser(query, type);
      if (result) {
        res.status(200).json(result);
      } else {
        res.status(400).json({ message: "username not found" });
      }
    } catch (error) {
      return next(error);
    }
  }
);

router.delete(
  "/",
  userAuthorization,
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const password = req.body.password;
    if (!password) {
      const err = Object.assign(new Error("Password is required"), {
        status: 400,
      });
      return next(err);
    }
    try {
      const result = await deleteUser(userId, password);
      if (result) {
        res.status(200).json(result);
      } else {
        const err = Object.assign(new Error("Unable to delete user"), {
          status: 400,
        });
        return next(err);
      }
    } catch (error) {
      return next(error);
    }
  }
);

router.put(
  "/update",
  userAuthorization,
  updateUserValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const update = req.body; //due to validation, it will have one of the following keys: name, username, email, profileType
    try {
      const updatedUser = await updateUser({ userId, updates: update });
      if (updatedUser) {
        res.status(200).json(updatedUser);
      } else {
        const err = Object.assign(new Error("Unable to update user"), {
          status: 400,
        });
        return next(err);
      }
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/updatePassword",
  userAuthorization,
  updatePasswordValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const { oldPassword, newPassword } = req.body;
    try {
      const updatedUser = await updatePassword(
        userId,
        oldPassword,
        newPassword
      );
      if (updatedUser) {
        res.status(200).json(updatedUser);
      } else {
        const err = Object.assign(new Error("Unable to update user"), {
          status: 400,
        });
        return next(err);
      }
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/tag",
  userAuthorization,
  async (req: Request, res: Response, next: NextFunction) => {}
);

export default router;
