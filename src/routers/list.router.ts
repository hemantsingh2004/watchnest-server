import express, { Request, Response, NextFunction } from "express";
import { IListDetails } from "../models/list/user-list/list.schema";
import {
  createList,
  deleteList,
  getList,
  updateListPrivacy,
} from "../models/list/user-list/list.model";
import mongoose, { Error } from "mongoose";
import { addList, getAllLists, removeList } from "../models/user/user.model";
import userAuthorization from "../middlewares/authorization/userAuthorization.middleware";
import {
  commonListValidation,
  createlistValidation,
} from "../middlewares/validation/listValidation.middleware";

const router = express.Router();

router.all("/", (req: Request, res: Response, next: NextFunction) => {
  next();
});

router.post(
  "/",
  userAuthorization,
  createlistValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const listObj = req.body as IListDetails;
    try {
      const result = (await createList(listObj)) as mongoose.Document;
      if (result && result._id) {
        const userId = new mongoose.Types.ObjectId(req.userId);
        const updateUser = await addList(
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
  "/:listId",
  userAuthorization,
  commonListValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const listId = req.params.listId;
    const type = req.query.type as string;
    try {
      const userId = new mongoose.Types.ObjectId(req.userId);
      const userLists = (await getAllLists(userId)) as IUserList;
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
        await removeList(userId, new mongoose.Types.ObjectId(listId), type);
      }
      next(error);
    }
  }
);

router.delete(
  "/:listId",
  userAuthorization,
  commonListValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const listId = req.params.listId;
    const type = req.query.type as string;

    try {
      const userId = new mongoose.Types.ObjectId(req.userId);
      const userLists = (await getAllLists(userId)) as IUserList;

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
        const updateUser = await removeList(
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
  "/updatePrivacy/:listId",
  async (req: Request, res: Response, next: NextFunction) => {
    const listId = req.params.listId;
    const { privacy } = req.body;
    if (!listId || !privacy) {
      const err = Object.assign(new Error("details not found"), {
        status: 400,
      });
      return next(err);
    }
    try {
      const userId = new mongoose.Types.ObjectId(req.userId);
      const userLists = (await getAllLists(userId)) as IUserList;
      if (!userLists) {
        return next(new Error("Unable to retrieve lists"));
      }
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
        const err = Object.assign(
          new Error("List does not exist in user lists"),
          { status: 400 }
        );
        return next(err);
      }
      const result = (await updateListPrivacy(
        new mongoose.Types.ObjectId(listId),
        privacy
      )) as mongoose.Document;
      if (result && result._id) {
        res
          .status(200)
          .json({ message: "List privacy updated successfully", result });
      } else {
        return next(new Error("Unable to update list privacy"));
      }
    } catch (error) {
      next(error);
    }
  }
);

router.post("/updateItems/:listId?type"); //To update list's items (add or remove)

router.put("/updateItem/:listId"); //To update list's item details

export default router;
