import jwt from "jsonwebtoken";

const createAccessJWT = async (payload: any) => {
  try {
    const accessJWT = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: "1h",
    });

    return Promise.resolve(accessJWT);
  } catch (err) {
    return Promise.reject(err);
  }
};

const createRefreshJWT = async (payload: any) => {
  try {
    const refreshJWT = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: "7d",
    });
    return Promise.resolve(refreshJWT);
  } catch (error) {
    return Promise.reject(error);
  }
};

const verifyAccessJWT = (token: string) => {
  try {
    const result = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
    return Promise.resolve(result);
  } catch (error) {
    return Promise.reject(error);
  }
};

const verifyRefreshJWT = (token: string) => {
  try {
    const result = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
    return Promise.resolve(result);
  } catch (error) {
    return Promise.reject(error);
  }
};

export { createAccessJWT, createRefreshJWT, verifyAccessJWT, verifyRefreshJWT };
