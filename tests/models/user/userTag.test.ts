import { it, describe, expect, vi, Mock } from "vitest";
import userModel from "../../../src/models/user/user.schema.ts";
import mongoose from "mongoose";
import {
  addTag,
  findTag,
  getAllTags,
  removeTag,
} from "../../../src/models/user/userTags.model.ts";
import { getUserLists } from "../../../src/models/user/userList.model";
import { removeTagFromItems } from "../../../src/models/list/user-list/list.model";

vi.mock("../../../src/models/user/user.schema.ts", () => ({
  default: {
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock("../../../src/models/user/userList.model", () => ({
  getUserLists: vi.fn(),
}));

vi.mock("../../../src/models/list/user-list/list.model", () => ({
  removeTagFromItems: vi.fn(),
}));

describe("getAllTags", () => {
  it("should return all tags for a user", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTags = [{ tags: ["tag1", "tag2"] }];

    (userModel.find as Mock).mockResolvedValueOnce(mockTags);

    const result = await getAllTags(mockUserId);
    expect(result).toEqual(mockTags);
    expect(userModel.find).toHaveBeenCalledWith(
      { _id: mockUserId },
      { tags: 1 }
    );
  });

  it("should throw an error if unable to find tags", async () => {
    const mockUserId = new mongoose.Types.ObjectId();

    (userModel.find as Mock).mockResolvedValueOnce(null);

    await expect(getAllTags(mockUserId)).rejects.toThrow("Unable to find tags");
  });

  it("should throw an error if find operation fails", async () => {
    const mockUserId = new mongoose.Types.ObjectId();

    (userModel.find as Mock).mockRejectedValueOnce(new Error("Database error"));

    await expect(getAllTags(mockUserId)).rejects.toThrow("Database error");
  });
});

describe("findTag", () => {
  it("should return matching tags when a tag exists", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";
    const mockResult = [{ tags: ["tag1", "tag2"] }];

    (userModel.find as Mock).mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce(mockResult),
    });

    const result = await findTag(mockUserId, mockTag);
    expect(result).toEqual(mockResult);
    expect(userModel.find).toHaveBeenCalledWith({
      _id: mockUserId,
      tags: { $regex: mockTag, $options: "i" },
    });
  });

  it("should throw an error if no matching tags are found", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";

    (userModel.find as Mock).mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce(null),
    });

    await expect(findTag(mockUserId, mockTag)).rejects.toThrow(
      "Unable to find tag"
    );
  });

  it("should throw an error if find operation fails", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";

    (userModel.find as Mock).mockReturnValueOnce({
      select: vi.fn().mockRejectedValueOnce(new Error("Database error")),
    });

    await expect(findTag(mockUserId, mockTag)).rejects.toThrow(
      "Database error"
    );
  });
});

describe("addTag", () => {
  it("should add a tag successfully", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";
    const mockResult = { _id: mockUserId, tags: ["tag1"] };

    (userModel.findOneAndUpdate as Mock).mockResolvedValueOnce(mockResult);

    const result = await addTag(mockUserId, mockTag);
    expect(result).toEqual(mockResult);
    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: mockUserId },
      { $push: { tags: mockTag } },
      { new: true }
    );
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
  it("should remove a tag successfully when itemsTagRemoval is successful", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";
    const mockUserLists = {
      list: {
        statusBased: [new mongoose.Types.ObjectId()],
        themeBased: [new mongoose.Types.ObjectId()],
      },
    };
    const mockResult = { _id: mockUserId, tags: [] };

    (getUserLists as Mock).mockResolvedValueOnce(mockUserLists);
    (removeTagFromItems as Mock).mockResolvedValueOnce({ modifiedCount: 1 });
    (userModel.findOneAndUpdate as Mock).mockResolvedValueOnce(mockResult);

    const result = await removeTag(mockUserId, mockTag);
    expect(result).toEqual(mockResult);
    expect(getUserLists).toHaveBeenCalledWith(mockUserId);
    expect(removeTagFromItems).toHaveBeenCalledWith(
      [...mockUserLists.list.statusBased, ...mockUserLists.list.themeBased],
      mockTag
    );
    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: mockUserId },
      { $pull: { tags: mockTag } },
      { new: true }
    );
  });

  it("should throw an error if unable to remove tag when itemsTagRemoval fails", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";
    const mockUserLists = {
      list: {
        statusBased: [new mongoose.Types.ObjectId()],
        themeBased: [new mongoose.Types.ObjectId()],
      },
    };

    (getUserLists as Mock).mockResolvedValueOnce(mockUserLists);
    (removeTagFromItems as Mock).mockResolvedValueOnce({ modifiedCount: 0 });

    await expect(removeTag(mockUserId, mockTag)).rejects.toThrow(
      "Unable to remove tag"
    );
  });

  it("should throw an error if getUserLists fails", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";

    (getUserLists as Mock).mockRejectedValueOnce(new Error("User list error"));

    await expect(removeTag(mockUserId, mockTag)).rejects.toThrow(
      "User list error"
    );
  });

  it("should throw an error if findOneAndUpdate fails", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockTag = "tag1";
    const mockUserLists = {
      list: {
        statusBased: [new mongoose.Types.ObjectId()],
        themeBased: [new mongoose.Types.ObjectId()],
      },
    };

    (getUserLists as Mock).mockResolvedValueOnce(mockUserLists);
    (removeTagFromItems as Mock).mockResolvedValueOnce({ modifiedCount: 1 });
    (userModel.findOneAndUpdate as Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    await expect(removeTag(mockUserId, mockTag)).rejects.toThrow(
      "Database error"
    );
  });
});
