import { it, describe, expect, vi, Mock } from "vitest";
import userModel from "../../../src/models/user/user.schema.ts";
import mongoose from "mongoose";
import {
  addTag,
  findTag,
  removeTag,
} from "../../../src/models/user/user.model.ts";

vi.mock("../../../src/models/user/user.schema.ts", () => ({
  default: {
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

describe("findTag", () => {
  it("should return tags when tag exists", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";
    const mockResult = [{ _id: mockUserId, tags: [mockTag] }];

    (userModel.find as Mock).mockResolvedValueOnce(mockResult);

    const result = await findTag(mockUserId, mockTag);
    expect(result).toEqual(mockResult);
    expect(userModel.find).toHaveBeenCalledWith({
      _id: mockUserId,
      tags: mockTag,
    });
  });

  it("should throw an error if unable to find tag", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";

    (userModel.find as Mock).mockResolvedValueOnce(null);

    await expect(findTag(mockUserId, mockTag)).rejects.toThrow(
      "Unable to find tag"
    );
  });

  it("should throw an error if find operation fails", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";

    (userModel.find as Mock).mockRejectedValueOnce(new Error("Database error"));

    await expect(findTag(mockUserId, mockTag)).rejects.toThrow(
      "Database error"
    );
  });
});

describe("addTag", () => {
  it("should add a tag successfully", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";
    const mockResult = { _id: mockUserId, tags: [mockTag] };

    (userModel.findOneAndUpdate as Mock).mockResolvedValueOnce(mockResult);

    const result = await addTag(mockUserId, mockTag);
    expect(result).toEqual(mockResult);
    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith({
      _id: mockUserId,
      $push: { tags: mockTag },
      new: true,
    });
  });

  it("should throw an error if unable to add tag", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";

    (userModel.findOneAndUpdate as Mock).mockResolvedValueOnce(null);

    await expect(addTag(mockUserId, mockTag)).rejects.toThrow(
      "Unable to add tag"
    );
  });

  it("should throw an error if findOneAndUpdate fails", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";

    (userModel.findOneAndUpdate as Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    await expect(addTag(mockUserId, mockTag)).rejects.toThrow("Database error");
  });
});

describe("removeTag", () => {
  it("should remove a tag successfully", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";
    const mockResult = { _id: mockUserId, tags: [] };

    (userModel.findOneAndUpdate as Mock).mockResolvedValueOnce(mockResult);

    const result = await removeTag(mockUserId, mockTag);
    expect(result).toEqual(mockResult);
    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith({
      _id: mockUserId,
      $pull: { tags: mockTag },
      new: true,
    });
  });

  it("should throw an error if unable to remove tag", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";

    (userModel.findOneAndUpdate as Mock).mockResolvedValueOnce(null);

    await expect(removeTag(mockUserId, mockTag)).rejects.toThrow(
      "Unable to remove tag"
    );
  });

  it("should throw an error if findOneAndUpdate fails", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";

    (userModel.findOneAndUpdate as Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    await expect(removeTag(mockUserId, mockTag)).rejects.toThrow(
      "Database error"
    );
  });
});
