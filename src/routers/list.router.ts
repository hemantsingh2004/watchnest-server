import express, { Request, Response, NextFunction } from "express";

const router = express.Router();

router.all("/", (req: Request, res: Response, next: NextFunction) => {
  next();
});

export default router;
