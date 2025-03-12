import mongoose from "mongoose";
import listModel, { IListDetails } from "./list.schema.ts";
import { IItem } from "../../item/item.schema.ts";

const createList = (listObj: IListDetails) => {
  return new Promise(async (reject, resolve) => {
    try {
      const list = await listModel.create(listObj);
      if (list) {
        resolve(list);
      } else {
        reject(new Error("Unable to create list"));
      }
    } catch (error) {
      reject(error);
    }
  });
};

interface updateListDetailsParams {
  listId: mongoose.Types.ObjectId;
  updates: {
    name?: string;
    privacy?: string;
  };
}

const updateListDetails = ({ listId, updates }: updateListDetailsParams) => {
  return new Promise(async (reject, resolve) => {
    try {
      const updateFields: Record<string, any> = {};
      if (updates.name) updateFields["name"] = updates.name;
      if (updates.privacy) updateFields["privacy"] = updates.privacy;
      const newList = await listModel.findByIdAndUpdate({
        _id: listId,
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

const getList = (listId: mongoose.Types.ObjectId) => {
  return new Promise(async (reject, resolve) => {
    try {
      const list = await listModel.findById(listId);
      if (list) resolve(list);
      else reject(new Error("List not found"));
    } catch (error) {
      reject(error);
    }
  });
};

const deleteList = (listId: mongoose.Types.ObjectId) => {
  return new Promise(async (reject, resolve) => {
    try {
      const result = await listModel.findByIdAndDelete(listId);
      if (result) resolve(true);
      else reject(false);
    } catch (error) {
      reject(error);
    }
  });
};

const addItems = (listId: mongoose.Types.ObjectId, items: IItem[]) => {
  return new Promise(async (reject, resolve) => {
    try {
      const newList = await listModel.findByIdAndUpdate({
        _id: listId,
        $push: { items: items },
        new: true,
      });
      if (newList) resolve(newList);
      reject(new Error("Unable to add items to the list"));
    } catch (error) {
      reject(error);
    }
  });
};

const removeItems = (listId: mongoose.Types.ObjectId, itemIdList: string[]) => {
  return new Promise(async (reject, resolve) => {
    try {
      const newList = await listModel.findByIdAndUpdate({
        _id: listId,
        $pull: { items: { mediaId: { $in: itemIdList } } },
        new: true,
      });
      if (newList) resolve(newList);
      reject(new Error("Unable to remove items from the list"));
    } catch (error) {
      reject(error);
    }
  });
};

interface UpdateItemParams {
  listId: mongoose.Types.ObjectId;
  mediaId: string;
  updates: {
    tags?: string[];
    customNotes?: string;
    userRating?: number;
    anticipation?: number;
    sortOrder?: number;
  };
}

const updateItem = ({ listId, mediaId, updates }: UpdateItemParams) => {
  const { tags, customNotes, userRating, anticipation, sortOrder } = updates;

  return new Promise(async (resolve, reject) => {
    try {
      const updateFields: Record<string, any> = {};

      // Tags should already be present in user document
      if (tags) updateFields["items.$[elem].tags"] = tags;
      if (customNotes) updateFields["items.$[elem].customNotes"] = customNotes;
      if (userRating) updateFields["items.$[elem].userRating"] = userRating;
      if (anticipation)
        updateFields["items.$[elem].anticipation"] = anticipation;
      if (sortOrder) updateFields["items.$[elem].sortOrder"] = sortOrder;

      const newList = await listModel.findByIdAndUpdate(
        { _id: listId, "items.mediaId": mediaId },
        {
          $set: updateFields,
        },
        { new: true }
      );

      if (newList) resolve(newList);
      reject(new Error("Unable to update item"));
    } catch (error) {
      reject(error);
    }
  });
};

const removeTagFromItems = (lists: mongoose.Types.ObjectId[], tag: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await listModel.updateMany(
        { _id: { $in: lists }, "items.tags": tag },
        { $pull: { "items.$[].tags": tag } }
      );

      if (result.modifiedCount > 0) {
        resolve(result);
      }
      reject(new Error("Unable to remove tag from lists"));
    } catch (error) {
      reject(error);
    }
  });
};

export {
  createList,
  getList,
  deleteList,
  updateListDetails,
  addItems,
  removeItems,
  updateItem,
  removeTagFromItems,
};
