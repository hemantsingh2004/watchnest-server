import mongoose from "mongoose";
import userModel from "./user.schema.ts";
import { getUserLists } from "./userList.model";
import { removeTagFromItems } from "../list/user-list/list.model";

const getAllTags = (userId: mongoose.Types.ObjectId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const tags = await userModel.find({ _id: userId }, { tags: 1 });
      if (tags) resolve(tags);
      else reject(new Error("Unable to find tags"));
    } catch (error) {
      reject(error);
    }
  });
};

const findTag = (userId: mongoose.Types.ObjectId, tag: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const tags = await userModel
        .find({
          _id: userId,
          tags: { $regex: tag, $options: "i" },
        })
        .select("tags");
      if (tags) resolve(tags);
      else reject(new Error("Unable to find tag"));
    } catch (error) {
      reject(error);
    }
  });
};

const addTag = (userId: mongoose.Types.ObjectId, tag: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await userModel.findOneAndUpdate(
        { _id: userId },
        { $push: { tags: tag } },
        { new: true }
      );
      if (result) resolve(result);
      else reject(new Error("Unable to add tag"));
    } catch (error) {
      reject(error);
    }
  });
};

interface userLists {
  list: {
    statusBased: mongoose.Types.ObjectId[];
    themeBased: mongoose.Types.ObjectId[];
  };
}

const removeTag = (userId: mongoose.Types.ObjectId, tag: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const getuserLists = (await getUserLists(userId)) as userLists;
      if (getuserLists && getuserLists.list) {
        const userLists = [
          ...getuserLists.list.statusBased,
          ...getuserLists.list.themeBased,
        ];
        const itemsTagRemoval = await removeTagFromItems(userLists, tag);
        if (itemsTagRemoval.modifiedCount > 0) {
          const result = await userModel.findOneAndUpdate(
            { _id: userId },
            { $pull: { tags: tag } },
            { new: true }
          );
          if (result) resolve(result);
        }
      }
      reject(new Error("Unable to remove tag"));
    } catch (error) {
      reject(error);
    }
  });
};

export { addTag, findTag, getAllTags, removeTag };
