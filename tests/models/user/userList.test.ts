import { it, describe, vi, expect, Mock } from "vitest";
import mongoose from "mongoose";
import userModel, { IUser } from "../../../src/models/user/user.schema.ts";
import {
  addList,
  getAllLists,
  removeList,
} from "../../../src/models/user/user.model.ts";

vi.mock("../../../src/models/user/user.schema.ts", () => ({
  default: {
    findById: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
    }),
    findOneAndUpdate: vi.fn(),
  },
}));

describe("getLists", () => {
  it("should return lists successfully", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockResult = {
      list: { statusBased: ["mockListId1", "mockListId2"] },
    };

    (userModel.findById as Mock).mockReturnValue({
      select: vi.fn().mockResolvedValue(mockResult),
    });

    const result = await getAllLists(mockUserId);
    expect(result).toEqual(mockResult);
    expect(userModel.findById).toHaveBeenCalledWith(mockUserId);
    expect(userModel.findById(mockUserId).select).toHaveBeenCalledWith("list");
  });

  it("should fail if getting lists fails", async () => {
    const mockUserId = new mongoose.Types.ObjectId();

    (userModel.findById(mockUserId).select as Mock).mockRejectedValue(
      new Error("Unable to get lists")
    );

    await expect(getAllLists(mockUserId)).rejects.toThrow(
      "Unable to get lists"
    );
  });

  it("should fail if no lists are found", async () => {
    const mockUserId = new mongoose.Types.ObjectId();

    (userModel.findById(mockUserId).select as Mock).mockResolvedValue(null);

    await expect(getAllLists(mockUserId)).rejects.toThrow(
      "Unable to get lists"
    );
  });
});

describe("addList", () => {
  const userId = new mongoose.Types.ObjectId();
  const listId = new mongoose.Types.ObjectId();

  it("should add a list successfully", async () => {
    (userModel.findOneAndUpdate as Mock).mockResolvedValueOnce({
      _id: userId,
      list: { statusBased: [listId] },
    });

    const result = (await addList(userId, listId, "statusBased")) as IUser;
    expect(result).toHaveProperty("list.statusBased");
    expect(result.list && result.list.statusBased).toContain(listId);
  });

  it("should reject when an invalid list type is passed", async () => {
    const promise = addList(userId, listId, "invalidType");
    await expect(promise).rejects.toThrow("Invalid list type");
  });

  it("should reject when unable to add a list", async () => {
    (userModel.findOneAndUpdate as Mock).mockResolvedValue(null);

    const promise = addList(userId, listId, "statusBased");
    await expect(promise).rejects.toThrow("Unable to add list");
  });

  it("should catch errors thrown during findOneAndUpdate", async () => {
    (userModel.findOneAndUpdate as Mock).mockRejectedValue(
      new Error("MongoDB error")
    );

    const promise = addList(userId, listId, "statusBased");
    await expect(promise).rejects.toThrow("MongoDB error");
  });
});

describe("removeList function", () => {
  const userId = new mongoose.Types.ObjectId();
  const listId = new mongoose.Types.ObjectId();

  it("should remove a list successfully", async () => {
    (userModel.findOneAndUpdate as Mock).mockResolvedValue({
      _id: userId,
      list: { statusBased: [] },
    });

    const result = (await removeList(userId, listId, "statusBased")) as IUser;
    expect(result).toHaveProperty("list.statusBased");
    expect(result.list && result.list.statusBased).not.toContain(listId);
  });

  it("should reject when an invalid list type is passed", async () => {
    const promise = removeList(userId, listId, "invalidType");
    await expect(promise).rejects.toThrow("Invalid list type");
  });

  it("should reject when unable to remove a list", async () => {
    (userModel.findOneAndUpdate as Mock).mockResolvedValue(null);

    const promise = removeList(userId, listId, "statusBased");
    await expect(promise).rejects.toThrow("Unable to remove list");
  });

  it("should catch errors thrown during findOneAndUpdate", async () => {
    (userModel.findOneAndUpdate as Mock).mockRejectedValue(
      new Error("MongoDB error")
    );

    const promise = removeList(userId, listId, "statusBased");
    await expect(promise).rejects.toThrow("MongoDB error");
  });
});
