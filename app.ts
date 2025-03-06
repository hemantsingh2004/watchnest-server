import express, { Request, Response, NextFunction } from "express";
import "dotenv/config";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";

// app setup
const app = express();
const port = process.env.PORT || 3000;

// API security
app.use(helmet());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Redis connection
import { connectRedis } from "./src/helper/redis.helper.ts";
connectRedis();

// MongoDB connection
import mongoose from "mongoose";
mongoose.connect(process.env.MONGODB_URL as string);

if (process.env.NODE_ENV !== "production") {
  mongoose.connection.on("connected", () => {
    console.log("Mongoose is connected");
  });

  mongoose.connection.on("error", (err) => {
    console.log(err);
  });

  // Logger
  app.use(morgan("combined"));
}

// API router
import UserRouter from "./src/routers/user.router.ts";
import ListRouter from "./src/routers/list.router.ts";
import AuthRouter from "./src/routers/auth.router.ts";

// Register routes before error handlers
app.use("/v1/auth", AuthRouter);
app.use("/v1/user", UserRouter);
app.use("/v1/list", ListRouter);

// Error Handler for non-existent routes (404)
app.use("*", (req: Request, res: Response, next: NextFunction) => {
  const error = new Error("Resource not found!") as Error & { status: number };
  error.status = 404;
  next(error); // Pass error to the next middleware
});

// Global error handler (catches any errors)
import handleError from "./src/utils/errorHandler.ts";
app.use(
  "*",
  (error: Error, req: Request, res: Response, next: NextFunction) => {
    handleError(error, req, res);
  }
);

// Start the server
app.listen(port, () => console.log(`API is ready on http://localhost:${port}`));

export default app;
