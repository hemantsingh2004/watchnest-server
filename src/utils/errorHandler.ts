import { Request, Response } from "express";

const handleError = (err: Error, req: Request, res: Response): void => {
  console.error("\nfrom error handler : ", err.message);
  res.status((err as any)?.status || 500).json({
    from: "errorHandler",
    message: err.message,
  });
};

export default handleError;
