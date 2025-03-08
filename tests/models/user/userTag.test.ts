import { it, describe, expect, vi, Mock } from "vitest";
import userModel from "../../../src/models/user/user.schema.ts";
import mongoose from "mongoose";
import { handleTag } from "../../../src/models/user/user.model.ts";

vi.mock("../../../src/models/user/user.schema.ts", () => ({
  default: {
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

describe("handleTag", () => {
  it("should return tags when tag exists (find)", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";
    const mockResult = [{ _id: mockUserId, tags: [mockTag] }];

    (userModel.find as Mock).mockResolvedValueOnce(mockResult);

    const result = await handleTag(mockUserId, mockTag, "find");
    expect(result).toEqual(mockResult);
    expect(userModel.find).toHaveBeenCalledWith({
      _id: mockUserId,
      tags: mockTag,
    });
  });

  it("should throw an error if unable to find tag (find)", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";

    (userModel.find as Mock).mockResolvedValueOnce(null);

    await expect(handleTag(mockUserId, mockTag, "find")).rejects.toThrow(
      "Unable to find tag"
    );
  });

  it("should throw an error if find operation fails (find)", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";

    (userModel.find as Mock).mockRejectedValueOnce(new Error("Database error"));

    await expect(handleTag(mockUserId, mockTag, "find")).rejects.toThrow(
      "Database error"
    );
  });

  it("should add a tag successfully (add)", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";
    const mockResult = { _id: mockUserId, tags: [mockTag] };

    (userModel.findOneAndUpdate as Mock).mockResolvedValueOnce(mockResult);

    const result = await handleTag(mockUserId, mockTag, "add");
    expect(result).toEqual(mockResult);
    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: mockUserId },
      { $push: { tags: mockTag } },
      { new: true }
    );
  });

  it("should throw an error if unable to add tag (add)", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";

    (userModel.findOneAndUpdate as Mock).mockResolvedValueOnce(null);

    await expect(handleTag(mockUserId, mockTag, "add")).rejects.toThrow(
      "Unable to add tag"
    );
  });

  it("should throw an error if findOneAndUpdate fails (add)", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";

    (userModel.findOneAndUpdate as Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    await expect(handleTag(mockUserId, mockTag, "add")).rejects.toThrow(
      "Database error"
    );
  });

  it("should remove a tag successfully (remove)", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";
    const mockResult = { _id: mockUserId, tags: [] };

    (userModel.findOneAndUpdate as Mock).mockResolvedValueOnce(mockResult);

    const result = await handleTag(mockUserId, mockTag, "remove");
    expect(result).toEqual(mockResult);
    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: mockUserId },
      { $pull: { tags: mockTag } },
      { new: true }
    );
  });

  it("should throw an error if unable to remove tag (remove)", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";

    (userModel.findOneAndUpdate as Mock).mockResolvedValueOnce(null);

    await expect(handleTag(mockUserId, mockTag, "remove")).rejects.toThrow(
      "Unable to remove tag"
    );
  });

  it("should throw an error if findOneAndUpdate fails (remove)", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";

    (userModel.findOneAndUpdate as Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    await expect(handleTag(mockUserId, mockTag, "remove")).rejects.toThrow(
      "Database error"
    );
  });

  it("should throw an error if an invalid queryType is provided", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";

    await expect(
      handleTag(mockUserId, mockTag, "invalidType" as any)
    ).rejects.toThrow("Invalid query type");
  });
});
