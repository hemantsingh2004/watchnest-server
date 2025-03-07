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
            await setJWT(accessToken, String(user._id));
            await user.updateOne({ $set: { refreshToken } });
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
        profileType: "public",
      });
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

//Requires Authorization
const searchByUserName = (username: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await userModel.find({
        username,
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

const findTag = (userId: mongoose.Types.ObjectId, tag: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await userModel.find({ _id: userId, tags: tag });
      if (result) resolve(result);
      reject(new Error("Unable to find tag"));
    } catch (error) {
      reject(error);
    }
  });
};

const addTag = (userId: mongoose.Types.ObjectId, tag: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await userModel.findOneAndUpdate({
        _id: userId,
        $push: { tags: tag },
        new: true,
      });
      if (result) resolve(result);
      reject(new Error("Unable to add tag"));
    } catch (error) {
      reject(error);
    }
  });
};

const removeTag = (userId: mongoose.Types.ObjectId, tag: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await userModel.findOneAndUpdate({
        _id: userId,
        $pull: { tags: tag },
        new: true,
      });
      if (result) resolve(result);
      reject(new Error("Unable to remove tag"));
    } catch (error) {
      reject(error);
    }
  });
};

const addList = (
  userId: mongoose.Types.ObjectId,
  listId: mongoose.Types.ObjectId
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await userModel.findOneAndUpdate({
        _id: userId,
        $push: { list: listId },
        new: true,
      });
      if (result) resolve(result);
      reject(new Error("Unable to add list"));
    } catch (error) {
      reject(error);
    }
  });
};

const getLists = (userId: mongoose.Types.ObjectId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await userModel.findById(userId).select("list");
      if (result) resolve(result);
      reject(new Error("Unable to get lists"));
    } catch (error) {
      reject(error);
    }
  });
};

// todo : remove and add friends as well
// todo : remove and add collaborative lists

export {
  createUser,
  loginUser,
  findUser,
  searchByName,
  searchByUserName,
  updateProfileType,
  addList,
  getLists,
  findTag,
  addTag,
  removeTag,
};
export type { ILoginUser };
