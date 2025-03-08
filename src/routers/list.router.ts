import express, { Request, Response, NextFunction } from "express";
import { IListDetails } from "../models/list/user-list/list.schema";
import {
  createList,
  deleteList,
  getList,
  updateListDetails,
} from "../models/list/user-list/list.model";
import mongoose, { Error } from "mongoose";
import {
  addListToUser,
  getUserLists,
  removeListFromUser,
} from "../models/user/userList.model";
import userAuthorization from "../middlewares/authorization/userAuthorization.middleware";
import {
  commonListValidation,
  createlistValidation,
  updateListValidation,
} from "../middlewares/validation/listValidation.middleware";

const router = express.Router();

router.all("/", (req: Request, res: Response, next: NextFunction) => {
  next();
});

router.post(
  // Create new list
  "/",
  userAuthorization,
  createlistValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const listObj = req.body as IListDetails;
    try {
      const result = (await createList(listObj)) as mongoose.Document;
      if (result && result._id) {
        const userId = new mongoose.Types.ObjectId(req.userId);
        const updateUser = await addListToUser(
          userId,
          result._id as mongoose.Types.ObjectId,
          listObj.type
        );
        if (updateUser) {
          res
            .status(200)
            .json({ message: "List created successfully", result });
        } else {
          await deleteList(result._id as mongoose.Types.ObjectId);
          return next(new Error("Unable to add list, please try again"));
        }
      } else {
        return next(new Error("Unable to create list"));
      }
    } catch (error) {
      return next(error);
    }
  }
);

interface IUserList {
  statusBased?: mongoose.Types.ObjectId[];
  themeBased?: mongoose.Types.ObjectId[];
}

router.get(
  // Returns a list if it belongs to user
  "/:listId",
  userAuthorization,
  commonListValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const listId = req.params.listId;
    const type = req.query.type as string;
    try {
      const userId = new mongoose.Types.ObjectId(req.userId);
      const userLists = (await getUserLists(userId)) as IUserList;
      if (!userLists) {
        return next(new Error("Unable to retrieve user lists"));
      }

      const listType = type as keyof IUserList;
      if (
        !userLists[listType] ||
        !userLists[listType].some((id) =>
          id.equals(new mongoose.Types.ObjectId(listId))
        )
      ) {
        const err = Object.assign(
          new Error("List does not exist in user lists"),
          {
            status: 400,
          }
        );
        return next(err);
      }
      const result = (await getList(
        new mongoose.Types.ObjectId(listId)
      )) as mongoose.Document;
      if (result && result._id) {
        res
          .status(200)
          .json({ message: "List retrieved successfully", result });
      } else {
        return next(new Error("Unable to retrieve list"));
      }
    } catch (error: any) {
      if (error.message === "List not found") {
        const userId = new mongoose.Types.ObjectId(req.userId);
        await removeListFromUser(
          userId,
          new mongoose.Types.ObjectId(listId),
          type
        );
      }
      next(error);
    }
  }
);

router.delete(
  //Delete a list if it belongs to user
  "/:listId",
  userAuthorization,
  commonListValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const listId = req.params.listId;
    const type = req.query.type as string;

    try {
      const userId = new mongoose.Types.ObjectId(req.userId);
      const userLists = (await getUserLists(userId)) as IUserList;

      if (!userLists) {
        return next(new Error("Unable to retrieve user lists"));
      }

      const listType = type as keyof IUserList;
      if (
        !userLists[listType] ||
        !userLists[listType].some((id) =>
          id.equals(new mongoose.Types.ObjectId(listId))
        )
      ) {
        const err = Object.assign(
          new Error(`List does not exist in user ${type} lists`),
          {
            status: 400,
          }
        );
        return next(err);
      }

      const result = await deleteList(new mongoose.Types.ObjectId(listId));
      if (result === true) {
        const updateUser = await removeListFromUser(
          userId,
          new mongoose.Types.ObjectId(listId),
          type
        );
        if (updateUser) {
          res.status(200).json({ message: "List deleted successfully" });
        } else {
          return next(new Error("Unable to remove list from user"));
        }
      } else {
        return next(new Error("Unable to delete list"));
      }
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  //Update List Details like name, privacy
  "/update/:listId",
  userAuthorization,
  updateListValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const listId = req.params.listId;
    const { privacy, name } = req.body;
    try {
      const userId = new mongoose.Types.ObjectId(req.userId);
      const userLists = (await getUserLists(userId)) as IUserList;
      if (!userLists) {
        const err = Object.assign(new Error("Unable to retrieve lists"), {
          status: 400,
        });
        return next(err);
      }
      console.log("some info in router: ", listId, userLists, userId);

      if (
        userLists.statusBased &&
        !userLists.statusBased.some((id) =>
          id.equals(new mongoose.Types.ObjectId(listId))
        ) &&
        userLists.themeBased &&
        !userLists.themeBased.some((id) =>
          id.equals(new mongoose.Types.ObjectId(listId))
        )
      ) {
        console.log("in the router lists don't match");

        const err = Object.assign(
          new Error("List does not exist in user lists"),
          { status: 400 }
        );
        return next(err);
      }
      const result = (await updateListDetails({
        listId: new mongoose.Types.ObjectId(listId),
        updates: {
          ...(privacy && { privacy }),
          ...(name && { name }),
        },
      })) as mongoose.Document;
      console.log("result achieved in list router is : ", result);
      if (result && result._id) {
        res
          .status(200)
          .json({ message: "List privacy updated successfully", result });
      } else {
        return next(new Error("Unable to update list"));
      }
    } catch (error) {
      next(error);
    }
  }
);

router.post("/updateItems/:listId?type"); //To update list's items (add or remove)

router.put("/updateItem/:listId"); //To update list's item details

export default router;
