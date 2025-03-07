import { it, describe, vi, expect, Mock } from "vitest";
import mongoose from "mongoose";
import listModel, {
  IListDetails,
} from "../../../src/models/list/user-list/list.schema.ts";
import { IItem } from "../../../src/models/item/item.schema.ts";
import {
  createList,
  updateListPrivacy,
  addItems,
  removeItems,
  updateItem,
  removeTag,
} from "../../../src/models/list/user-list/list.model.ts";

vi.mock("../../../src/models/list/user-list/list.schema.ts", () => ({
  default: {
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    updateMany: vi.fn(),
  },
}));

describe("createList", () => {
  const mockListObj = {
    privacy: "private",
    type: "status-based",
  } as IListDetails;

  it("should create a list successfully", async () => {
    const mockResult = {
      ...mockListObj,
      _id: new mongoose.Types.ObjectId(),
    };
    (listModel.create as Mock).mockResolvedValue(mockResult);

    try {
      const result = await createList(mockListObj);
      expect(result).toBe(mockResult);
    } catch (err) {}
    expect(listModel.create).toHaveBeenCalledWith(mockListObj);
  });

  it("should throw an error if unable to create list", async () => {
    (listModel.create as Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    try {
      await createList(mockListObj);
    } catch (error) {
      expect(error).toEqual("Database error");
    }
  });
});

describe("updateListPrivacy", () => {
  it("should update privacy successfully", async () => {
    const mockListId = new mongoose.Types.ObjectId();
    const mockPrivacy = "private";
    const mockResult = { _id: mockListId, privacy: mockPrivacy };

    (listModel.findByIdAndUpdate as Mock).mockResolvedValueOnce(mockResult);

    try {
      const result = await updateListPrivacy(mockListId, mockPrivacy);
      expect(result).toEqual(mockResult);
    } catch (err) {}
    expect(listModel.findByIdAndUpdate).toHaveBeenCalledWith({
      _id: mockListId,
      $set: { privacy: mockPrivacy },
      new: true,
    });
  });

  it("should throw an error if unable to update list privacy", async () => {
    const mockListId = new mongoose.Types.ObjectId();
    const mockPrivacy = "private";

    (listModel.findByIdAndUpdate as Mock).mockResolvedValueOnce(null);

    try {
      await updateListPrivacy(mockListId, mockPrivacy);
    } catch (error) {
      expect(error).toEqual("Unable to update list privacy");
    }
  });

  it("should throw an error if update operation fails", async () => {
    const mockListId = new mongoose.Types.ObjectId();
    const mockPrivacy = "private";

    (listModel.findByIdAndUpdate as Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    try {
      await updateListPrivacy(mockListId, mockPrivacy);
    } catch (error) {
      expect(error).toEqual("Database error");
    }
  });
});

describe("addItems", () => {
  const mockItems = [
    {
      mediaId: "1",
      title: "new-item",
      information: {
        createdAt: new Date(),
        ageRating: "R",
        posterImage: "some-link",
      },
    },
  ] as IItem[];
  it("should add items successfully", async () => {
    const mockListId = new mongoose.Types.ObjectId();
    const mockResult = { _id: mockListId, items: mockItems };

    (listModel.findByIdAndUpdate as Mock).mockResolvedValueOnce(mockResult);

    try {
      const result = await addItems(mockListId, mockItems);
      expect(result).toEqual(mockResult);
    } catch (err) {}
    expect(listModel.findByIdAndUpdate).toHaveBeenCalledWith({
      _id: mockListId,
      $push: { items: mockItems },
      new: true,
    });
  });

  it("should throw an error if unable to add items", async () => {
    const mockListId = new mongoose.Types.ObjectId();

    (listModel.findByIdAndUpdate as Mock).mockResolvedValueOnce(null);

    try {
      await addItems(mockListId, mockItems);
    } catch (error) {
      expect(error).toEqual("Unable to add items");
    }
  });

  it("should throw an error if add operation fails", async () => {
    const mockListId = new mongoose.Types.ObjectId();

    (listModel.findByIdAndUpdate as Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    try {
      await addItems(mockListId, mockItems);
    } catch (error) {
      expect(error).toEqual("Database error");
    }
  });
});

describe("removeItems", () => {
  it("should remove items successfully", async () => {
    const mockListId = new mongoose.Types.ObjectId();
    const mockItemIds = ["1", "2"];
    const mockResult = { _id: mockListId, items: [] };

    (listModel.findByIdAndUpdate as Mock).mockResolvedValueOnce(mockResult);

    try {
      const result = await removeItems(mockListId, mockItemIds);
      expect(result).toEqual(mockResult);
    } catch (err) {}
    expect(listModel.findByIdAndUpdate).toHaveBeenCalledWith({
      _id: mockListId,
      $pull: { items: { mediaId: { $in: mockItemIds } } },
      new: true,
    });
  });

  it("should throw an error if unable to remove items", async () => {
    const mockListId = new mongoose.Types.ObjectId();
    const mockItemIds = ["1", "2"];

    (listModel.findByIdAndUpdate as Mock).mockResolvedValueOnce(null);

    try {
      await removeItems(mockListId, mockItemIds);
    } catch (error) {
      expect(error).toEqual("Unable to remove items");
    }
  });

  it("should throw an error if remove operation fails", async () => {
    const mockListId = new mongoose.Types.ObjectId();
    const mockItemIds = ["1", "2"];

    (listModel.findByIdAndUpdate as Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    try {
      await removeItems(mockListId, mockItemIds);
    } catch (error) {
      expect(error).toEqual("Database error");
    }
  });
});

describe("updateItem", () => {
  it("should update item successfully", async () => {
    const mockListId = new mongoose.Types.ObjectId();
    const mockMediaId = "1";
    const mockUpdates = { tags: ["newTag"], customNotes: "Test Note" };
    const mockResult = {
      _id: mockListId,
      items: [
        { mediaId: mockMediaId, tags: ["newTag"], customNotes: "Test Note" },
      ],
    };

    (listModel.findByIdAndUpdate as Mock).mockResolvedValueOnce(mockResult);

    const result = await updateItem({
      listId: mockListId,
      mediaId: mockMediaId,
      updates: mockUpdates,
    });
    expect(result).toEqual(mockResult);
    expect(listModel.findByIdAndUpdate).toHaveBeenCalledWith(
      { _id: mockListId, "items.mediaId": mockMediaId },
      {
        $set: {
          "items.$[elem].tags": mockUpdates.tags,
          "items.$[elem].customNotes": mockUpdates.customNotes,
        },
      },
      { new: true }
    );
  });

  it("should throw an error if unable to update item", async () => {
    const mockListId = new mongoose.Types.ObjectId();
    const mockMediaId = "1";
    const mockUpdates = { tags: ["newTag"], customNotes: "Test Note" };

    (listModel.findByIdAndUpdate as Mock).mockResolvedValueOnce(null);

    await expect(
      updateItem({
        listId: mockListId,
        mediaId: mockMediaId,
        updates: mockUpdates,
      })
    ).rejects.toThrow("Unable to update item");
  });

  it("should throw an error if update operation fails", async () => {
    const mockListId = new mongoose.Types.ObjectId();
    const mockMediaId = "1";
    const mockUpdates = { tags: ["newTag"], customNotes: "Test Note" };

    (listModel.findByIdAndUpdate as Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    await expect(
      updateItem({
        listId: mockListId,
        mediaId: mockMediaId,
        updates: mockUpdates,
      })
    ).rejects.toThrow("Database error");
  });
});

describe("removeTag", () => {
  it("should remove tag successfully", async () => {
    const mockLists = [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
    ];
    const mockTag = "oldTag";
    const mockResult = { modifiedCount: 1 };

    (listModel.updateMany as Mock).mockResolvedValueOnce(mockResult);

    const result = await removeTag(mockLists, mockTag);
    expect(result).toEqual(mockResult);
    expect(listModel.updateMany).toHaveBeenCalledWith(
      { _id: { $in: mockLists }, "items.tags": mockTag },
      { $pull: { "items.$[].tags": mockTag } }
    );
  });

  it("should throw an error if unable to remove tag", async () => {
    const mockLists = [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
    ];
    const mockTag = "oldTag";

    (listModel.updateMany as Mock).mockResolvedValueOnce({ modifiedCount: 0 });

    await expect(removeTag(mockLists, mockTag)).rejects.toThrow(
      "Unable to remove tag from lists"
    );
  });

  it("should throw an error if remove operation fails", async () => {
    const mockLists = [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
    ];
    const mockTag = "oldTag";

    (listModel.updateMany as Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    await expect(removeTag(mockLists, mockTag)).rejects.toThrow(
      "Database error"
    );
  });
});
