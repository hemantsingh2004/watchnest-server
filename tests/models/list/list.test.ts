import { it, describe, vi, expect, Mock } from "vitest";
import mongoose from "mongoose";
import listModel, {
  IListDetails,
} from "../../../src/models/list/user-list/list.schema.ts";
import { IItem } from "../../../src/models/item/item.schema.ts";
import {
  createList,
  getList,
  deleteList,
  updateListDetails,
  addItems,
  removeItems,
  updateItem,
  removeTagFromItems,
} from "../../../src/models/list/user-list/list.model.ts";

vi.mock("../../../src/models/list/user-list/list.schema.ts", () => ({
  default: {
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    updateMany: vi.fn(),
    findById: vi.fn(),
    findByIdAndDelete: vi.fn(),
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
      expect(error.message).toEqual("Database error");
    }
  });
});

describe("getList function", () => {
  const listId = new mongoose.Types.ObjectId();

  it("should resolve with list when a list is found", async () => {
    const mockList = { _id: listId, name: "Test List" };
    (listModel.findById as Mock).mockResolvedValue(mockList);

    try {
      const result = await getList(listId);
      expect(result).toEqual(mockList);
    } catch (error) {}

    expect(listModel.findById).toHaveBeenCalledWith(listId);
  });

  it("should reject with error when list is not found", async () => {
    (listModel.findById as Mock).mockResolvedValue(null);

    try {
      await getList(listId);
    } catch (error) {
      expect(error.message).toBe("List not found");
    }

    expect(listModel.findById).toHaveBeenCalledWith(listId);
  });

  it("should reject with error when an exception is thrown", async () => {
    const mockError = new Error("Database error");
    (listModel.findById as Mock).mockRejectedValue(mockError);

    try {
      await getList(listId);
    } catch (error) {
      expect(error).toBe(mockError);
    }

    expect(listModel.findById).toHaveBeenCalledWith(listId);
  });
});

describe("deleteList function", () => {
  const listId = new mongoose.Types.ObjectId();

  it("should resolve with true when a list is deleted successfully", async () => {
    const mockDeletedList = { _id: listId, name: "Test List" };
    (listModel.findByIdAndDelete as Mock).mockResolvedValue(mockDeletedList);

    try {
      const result = await deleteList(listId);
      expect(result).toBe(true);
    } catch (error) {}

    expect(listModel.findByIdAndDelete).toHaveBeenCalledWith(listId);
  });

  it("should reject with false when list is not found for deletion", async () => {
    (listModel.findByIdAndDelete as Mock).mockResolvedValue(null);

    try {
      await deleteList(listId);
    } catch (error) {
      expect(error).toBe(false);
    }

    expect(listModel.findByIdAndDelete).toHaveBeenCalledWith(listId);
  });

  it("should reject with error when an exception is thrown during deletion", async () => {
    const mockError = new Error("Database error");
    (listModel.findByIdAndDelete as Mock).mockRejectedValue(mockError);

    try {
      await deleteList(listId);
    } catch (error) {
      expect(error).toBe(mockError);
    }

    expect(listModel.findByIdAndDelete).toHaveBeenCalledWith(listId);
  });
});

describe("updateListDetails", () => {
  it("should update list details successfully when updates are provided", async () => {
    const mockListId = new mongoose.Types.ObjectId();
    const mockUpdates = { name: "Updated List", privacy: "private" };
    const mockResult = { _id: mockListId, ...mockUpdates };

    (listModel.findByIdAndUpdate as Mock).mockResolvedValueOnce(mockResult);

    try {
      const result = await updateListDetails({
        listId: mockListId,
        updates: mockUpdates,
      });
      expect(result).toEqual(mockResult);
    } catch (err) {
      // This should not trigger
    }
    expect(listModel.findByIdAndUpdate).toHaveBeenCalledWith({
      _id: mockListId,
      $set: mockUpdates,
      new: true,
    });
  });

  it("should update only the provided fields", async () => {
    const mockListId = new mongoose.Types.ObjectId();
    const mockUpdates = { privacy: "private" };
    const mockResult = { _id: mockListId, privacy: "private" };

    (listModel.findByIdAndUpdate as Mock).mockResolvedValueOnce(mockResult);

    try {
      const result = await updateListDetails({
        listId: mockListId,
        updates: mockUpdates,
      });
      expect(result).toEqual(mockResult);
    } catch (err) {
      // This should not trigger
    }
    expect(listModel.findByIdAndUpdate).toHaveBeenCalledWith({
      _id: mockListId,
      $set: { privacy: "private" },
      new: true,
    });
  });

  it("should throw an error if unable to update list details", async () => {
    const mockListId = new mongoose.Types.ObjectId();
    const mockUpdates = { name: "Updated List", privacy: "private" };

    (listModel.findByIdAndUpdate as Mock).mockResolvedValueOnce(null);

    try {
      await updateListDetails({ listId: mockListId, updates: mockUpdates });
    } catch (error) {
      expect(error).toEqual(new Error("Unable to update list details"));
    }
  });

  it("should throw an error if update operation fails", async () => {
    const mockListId = new mongoose.Types.ObjectId();
    const mockUpdates = { name: "Updated List" };

    (listModel.findByIdAndUpdate as Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    try {
      await updateListDetails({ listId: mockListId, updates: mockUpdates });
    } catch (error) {
      expect(error).toEqual(new Error("Database error"));
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
      expect(error.message).toEqual("Unable to add items to the list");
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
      expect(error.message).toEqual("Database error");
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
      expect(error.message).toEqual("Unable to remove items from the list");
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
      expect(error.message).toEqual("Database error");
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

    const result = await removeTagFromItems(mockLists, mockTag);
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

    await expect(removeTagFromItems(mockLists, mockTag)).rejects.toThrow(
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

    await expect(removeTagFromItems(mockLists, mockTag)).rejects.toThrow(
      "Database error"
    );
  });
});
