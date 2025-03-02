import { Response, Request, NextFunction } from "express";
import { verifyAccessJWT } from "../../helper/jwt.helper";
import { getJWT } from "../../helper/redis.helper";

const userAuthorization = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.header("Authorization")?.replace("Bearer ", "") as string;

  if (!token) {
    const err = new Error("Access denied, token missing.") as Error & {
      status: number;
    };
    err.status = 403;
    return next(err);
  }

  try {
    const isValid = await verifyAccessJWT(token);
    if (isValid) {
      const userId = await getJWT(token);
      if (userId) {
        req.userId = userId;
        next();
      } else {
        res.status(400).json({ message: "Invalid token. User does not exist" });
      }
    } else {
      res.status(400).json({ message: "Invalid token." });
    }
  } catch (err) {
    return next(err);
  }
};

export default userAuthorization;
