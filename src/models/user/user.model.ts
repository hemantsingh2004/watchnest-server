import mongoose from "mongoose";
import { createAccessJWT, createRefreshJWT } from "../../helper/jwt.helper.ts";
import { setJWT } from "../../helper/redis.helper.ts";
import userModel from "./user.schema.ts";
import { comparePassword, hashPassword } from "../../helper/bcrypt.helper.ts";
import { IUser } from "./user.schema.ts";

interface ILoginUser {
  username?: string;
  email?: string;
  passwordProvided: string;
}

const createUser = (userObj: IUser) => {
  return new Promise(async (resolve, reject) => {
    try {
      const existingUser = await userModel.findOne({
        // check if username already exists
        username: userObj.username,
      });
      if (existingUser && existingUser._id)
        return reject(new Error("username already exists"));

      const hashPass = await hashPassword(userObj.password); //Encrypting the password
      userObj.password = hashPass as string;

      const newUser = await userModel.create(userObj); //creating new user
      if (newUser && newUser._id) resolve(newUser);

      reject(new Error("Unable to create user"));
    } catch (error) {
      reject(error);
    }
  });
};

const loginUser = (userObj: ILoginUser) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { username, email, passwordProvided } = userObj;
      const query = username ? { username } : { email }; //Joi ensures that one of them exists
      const user = await userModel.findOne(query).select("_id password");

      if (user && user._id) {
        const isValid = await comparePassword(passwordProvided, user.password);
        if (isValid) {
          const refreshToken = await createRefreshJWT({ _id: user._id });
          const accessToken = await createAccessJWT({ _id: user._id });

          if (refreshToken && accessToken) {
            await setJWT(accessToken, refreshToken);
            await user.updateOne({ refreshToken });
            resolve({ message: "Login successful", accessToken, refreshToken });
          } else {
            reject(new Error("Unable to create token"));
          }
        }
        reject(new Error("Invalid password"));
      }
      reject(new Error("User not found"));
    } catch (error) {
      reject(error);
    }
  });
};

//Requires Authorization
const findUser = (userId: mongoose.Types.ObjectId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await userModel.findById(userId);
      if (user) resolve(user);
      reject(new Error("User not found"));
    } catch (error) {
      reject(error);
    }
  });
};

//Requires Authorization
const searchByName = (name: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await userModel.find({
        name: { $regex: name, $options: "i" },
      });
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

//Requires Authorization
const updateProfileType = (userId: mongoose.Types.ObjectId, type: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await userModel.findOneAndUpdate(
        { _id: userId },
        { $set: { profileType: type } },
        { new: true }
      );
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

// todo : remove and add tags, but that also needs to be removed from items as well

export { createUser, loginUser, findUser, searchByName, updateProfileType };
