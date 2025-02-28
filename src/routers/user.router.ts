import express, { Request, Response, NextFunction } from "express";
import { createUserValidation } from "../middlewares/validation/userValidation.middleware.ts";

const router = express.Router();

router.all("/", (req: Request, res: Response, next: NextFunction) => {
  next();
});

router.post(
  "/",
  createUserValidation,
  (req: Request, res: Response, next: NextFunction) => {
    const userObj = req.body;
    try {
      console.log(userObj);
    } catch (error) {
      res.status(500).json({ error });
    }
  }
);

export default router;
