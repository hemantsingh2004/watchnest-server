import { verify } from "crypto";
import { Response, Request, NextFunction } from "express";
import { verifyAccessJWT } from "../../helper/jwt.helper";
import { getJWT } from "../../helper/redis.helper";

const userAuthorization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(403).json({ message: "Access denied, token missing." });
  }

  try {
    const isValid = await verifyAccessJWT(token);
    if (isValid) {
      const userId = await getJWT(token);
      if (userId) req.userId = userId;
      else
        return res
          .status(400)
          .json({ message: "Invalid token. User does not exist" });
    } else {
      return res.status(400).json({ message: "Invalid token." });
    }
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid or expired token." });
  }
};

export default userAuthorization;
