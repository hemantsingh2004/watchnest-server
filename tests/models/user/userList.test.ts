import { it, describe, vi, expect, Mock } from "vitest";
import mongoose from "mongoose";
import userModel from "../../../src/models/user/user.schema.ts";
import { addList, getLists } from "../../../src/models/user/user.model.ts";

vi.mock("../../../src/models/user/user.schema.ts", () => ({
  default: {
    findById: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
    }),
    findOneAndUpdate: vi.fn(),
  },
}));

describe("addList", () => {
  it("should add list successfully", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockListId = new mongoose.Types.ObjectId();
    const mockResult = { _id: mockUserId, list: { statusBased: [mockListId] } };

    (userModel.findOneAndUpdate as Mock).mockResolvedValue(mockResult);

    const result = await addList(mockUserId, mockListId);
    expect(result).toEqual(mockResult);
    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith({
      _id: mockUserId,
      $push: { list: mockListId },
      new: true,
    });
  });

  it("should fail if adding list fails", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockListId = new mongoose.Types.ObjectId();

    (userModel.findOneAndUpdate as Mock).mockRejectedValue(
      new Error("Unable to add list")
    );
    await expect(addList(mockUserId, mockListId)).rejects.toThrow(
      "Unable to add list"
    );
  });

  it("should fail if findOneAndUpdate fails", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockListId = new mongoose.Types.ObjectId();

    (userModel.findOneAndUpdate as Mock).mockResolvedValue(null);

    await expect(addList(mockUserId, mockListId)).rejects.toThrow(
      "Unable to add list"
    );
  });
});

describe("getLists", () => {
  it("should return lists successfully", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockResult = {
      list: { statusBased: ["mockListId1", "mockListId2"] },
    };

    (userModel.findById as Mock).mockReturnValue({
      select: vi.fn().mockResolvedValue(mockResult),
    });

    const result = await getLists(mockUserId);
    expect(result).toEqual(mockResult);
    expect(userModel.findById).toHaveBeenCalledWith(mockUserId);
    expect(userModel.findById(mockUserId).select).toHaveBeenCalledWith("list");
  });

  it("should fail if getting lists fails", async () => {
    const mockUserId = new mongoose.Types.ObjectId();

    (userModel.findById(mockUserId).select as Mock).mockRejectedValue(
      new Error("Unable to get lists")
    );

    await expect(getLists(mockUserId)).rejects.toThrow("Unable to get lists");
  });

  it("should fail if no lists are found", async () => {
    const mockUserId = new mongoose.Types.ObjectId();

    (userModel.findById(mockUserId).select as Mock).mockResolvedValue(null);

    await expect(getLists(mockUserId)).rejects.toThrow("Unable to get lists");
  });
});
