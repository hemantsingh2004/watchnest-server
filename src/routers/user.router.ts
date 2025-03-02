import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import {
  findUser,
  searchByName,
  searchByUserName,
} from "../models/user/user.model.ts";
import userAuthorization from "../middlewares/authorization/userAuthorization.middleware.ts";

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
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.params.query;
    const type = req.query.type === "username" ? "username" : "email";
    try {
      if (type === "username") {
        const result = await searchByUserName(query);
        if (result) {
          res.status(200).json(result);
        } else {
          res.status(400).json({ message: "username not found" });
        }
      } else {
        const result = await searchByName(query);
        if (result) {
          res.status(200).json(result);
        } else {
          res.status(400).json({ message: "name not found" });
        }
      }
    } catch (error) {
      return next(error);
    }
  }
);

//todo: PUT method which will update profileType, tags, friends, and collaborative lists

export default router;
