import mongoose from "mongoose";
import userModel from "./user.schema.ts";

const addListToUser = (
  userId: mongoose.Types.ObjectId,
  listId: mongoose.Types.ObjectId,
  type: string
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!["statusBased", "themeBased"].includes(type)) {
        reject(new Error("Invalid list type"));
      }
      const result = await userModel.findOneAndUpdate({
        _id: userId,
        $push: { [`list.${type}`]: listId },
        new: true,
      });
      if (result) resolve(result);
      else reject(new Error("Unable to add list"));
    } catch (error) {
      reject(error);
    }
  });
};

const getUserLists = (userId: mongoose.Types.ObjectId) => {
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

const removeListFromUser = (
  userId: mongoose.Types.ObjectId,
  listId: mongoose.Types.ObjectId,
  type: string
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!["statusBased", "themeBased"].includes(type)) {
        reject(new Error("Invalid list type"));
      }
      const result = await userModel.findOneAndUpdate({
        _id: userId,
        $pull: { [`list.${type}`]: listId },
        new: true,
      });
      if (result) resolve(result);
      else reject(new Error("Unable to remove list"));
    } catch (error) {
      reject(error);
    }
  });
};

export { addListToUser, getUserLists, removeListFromUser };
