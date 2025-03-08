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
        username: userObj.username,
      });
      if (existingUser && existingUser._id)
        return reject(new Error("username already exists"));

      const hashPass = await hashPassword(userObj.password);
      userObj.password = hashPass as string;

      const newUser = await userModel.create(userObj);
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

const searchUser = (query: string, type: "name" | "username") => {
  return new Promise(async (resolve, reject) => {
    try {
      let findQuery;

      if (type === "name") {
        findQuery = {
          name: { $regex: query, $options: "i" },
          profileType: "public",
        };
      } else if (type === "username") {
        findQuery = { username: query };
      } else {
        return reject(new Error("Invalid type. Must be 'name' or 'username'."));
      }

      const result = await userModel.find(findQuery);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

const deleteUser = (userId: mongoose.Types.ObjectId, password: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const hashPass = await userModel.findById(userId).select("password");
      if (hashPass) {
        const isValid = await comparePassword(password, hashPass.password);
        if (isValid) {
          const result = await userModel.findByIdAndDelete(userId);
          if (result) resolve(result);
          else reject(new Error("Unable to delete user"));
        } else {
          const err = Object.assign(new Error("Password is incorrect"), {
            status: 400,
          });
          reject(err);
        }
      } else {
        reject(new Error("User not found"));
      }
    } catch (error) {
      reject(error);
    }
  });
};

interface updateUserDetails {
  userId: mongoose.Types.ObjectId;
  updates: {
    name?: string;
    username?: string;
    email?: string;
    profileType?: string;
  };
}

const updateUser = ({ userId, updates }: updateUserDetails) => {
  return new Promise(async (reject, resolve) => {
    try {
      const updateFields: Record<string, any> = {};
      if (updates.name) updateFields["name"] = updates.name;
      if (updates.profileType)
        updateFields["profileType"] = updates.profileType;
      if (updates.email) updateFields["email"] = updates.email;
      if (updates.username) updateFields["username"] = updates.username;
      const newList = await userModel.findByIdAndUpdate({
        _id: userId,
        $set: updateFields,
        new: true,
      });
      if (newList) {
        resolve(newList);
      } else {
        reject(new Error("Unable to update list details"));
      }
    } catch (error) {
      reject(error);
    }
  });
};

const updatePassword = (
  userId: mongoose.Types.ObjectId,
  OldPassword: string,
  newPassword: string
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const hashPass = await userModel.findById(userId).select("password");
      if (hashPass) {
        const isValid = await comparePassword(OldPassword, hashPass.password);
        if (isValid) {
          const newPass = await hashPassword(newPassword);
          if (newPass) {
            const result = await userModel.updateOne(
              { _id: userId },
              { $set: { password: newPass } }
            );
            if (result) resolve(result);
            reject(new Error("Unable to update password"));
          }
        } else {
          const err = Object.assign(new Error("Old password is incorrect"), {
            status: 400,
          });
          reject(err);
        }
      } else {
        reject(new Error("Unable to update password"));
      }
    } catch (error) {
      reject(error);
    }
  });
};

const handleTag = (
  userId: mongoose.Types.ObjectId,
  tag: string,
  queryType: "find" | "add" | "remove"
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let result;

      switch (queryType) {
        case "find":
          result = await userModel.find({ _id: userId, tags: tag });
          if (!result || result.length === 0) {
            return reject(new Error("Unable to find tag"));
          }
          break;
        case "add":
          result = await userModel.findOneAndUpdate(
            { _id: userId },
            { $push: { tags: tag } },
            { new: true }
          );
          if (!result) {
            return reject(new Error("Unable to add tag"));
          }
          break;
        case "remove":
          result = await userModel.findOneAndUpdate(
            { _id: userId },
            { $pull: { tags: tag } },
            { new: true }
          );
          if (!result) {
            return reject(new Error("Unable to remove tag"));
          }
          break;
        default:
          return reject(new Error("Invalid query type"));
      }

      resolve(result);
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
  searchUser,
  updateUser,
  updatePassword,
  deleteUser,
  handleTag,
};
export type { ILoginUser };
