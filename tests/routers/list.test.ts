import request from "supertest";
import { describe, it, expect, vi, Mock } from "vitest";
import app from "../../app.ts";
import mongoose from "mongoose";
import {
  createList,
  deleteList,
  getList,
  updateListPrivacy,
} from "../../src/models/list/user-list/list.model.ts";
import {
  addList,
  getAllLists,
  removeList,
} from "../../src/models/user/user.model.ts";

vi.mock("../../src/models/list/user-list/list.model.ts");
vi.mock("../../src/models/user/user.model.ts");

// Mock data for the test
const validListObj = {
  privacy: "public",
  type: "statusBased",
};

const mockUserId = new mongoose.Types.ObjectId();
const mockListId = new mongoose.Types.ObjectId();
const mockList = {
  _id: mockListId,
  ...validListObj,
};

vi.mock(
  "../../src/middlewares/authorization/userAuthorization.middleware.ts",
  () => ({
    __esModule: true,
    default: (req, res, next) => {
      req.userId = mockUserId;
      next();
    },
  })
);

describe("POST /v1/list", () => {
  it("should create a list and add it to the user successfully", async () => {
    (createList as Mock).mockResolvedValue(mockList);
    (addList as Mock).mockResolvedValue(true);

    const response = await request(app)
      .post("/v1/list")
      .set("Authorization", `Bearer ${mockUserId}`)
      .send(validListObj);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List created successfully");
    expect(response.body.result._id.toString()).toEqual(
      mockList._id.toString()
    );
    expect(response.body.result.type).toEqual(validListObj.type);
    expect(createList).toHaveBeenCalledWith(validListObj);
    expect(addList).toHaveBeenCalledWith(
      mockUserId,
      mockList._id,
      validListObj.type
    );
  });

  it("should fail to create the list and return an error", async () => {
    (createList as Mock).mockResolvedValue(null);

    const response = await request(app)
      .post("/v1/list")
      .set("Authorization", `Bearer ${mockUserId}`)
      .send(validListObj);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unable to create list");
    expect(createList).toHaveBeenCalledWith(validListObj);
  });

  it("should fail to add the list to the user and delete the list", async () => {
    (createList as Mock).mockResolvedValue(mockList);
    (addList as Mock).mockResolvedValue(false);
    (deleteList as Mock).mockResolvedValue(true);

    const response = await request(app)
      .post("/v1/list")
      .set("Authorization", `Bearer ${mockUserId}`)
      .send(validListObj);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unable to add list, please try again");
    expect(createList).toHaveBeenCalledWith(validListObj);
    expect(addList).toHaveBeenCalledWith(
      mockUserId,
      mockList._id,
      validListObj.type
    );
    expect(deleteList).toHaveBeenCalledWith(mockList._id);
  });

  it("should handle unexpected errors gracefully", async () => {
    (createList as Mock).mockRejectedValue(new Error("Unexpected error"));

    const response = await request(app)
      .post("/v1/list")
      .set("Authorization", `Bearer ${mockUserId}`)
      .send(validListObj);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unexpected error");
    expect(createList).toHaveBeenCalledWith(validListObj);
  });
});

describe("GET /v1/list/:listId", () => {
  it("should retrieve a list successfully", async () => {
    const mockUserLists = {
      statusBased: [mockListId],
      themeBased: [],
    };
    (getAllLists as Mock).mockResolvedValue(mockUserLists);
    (getList as Mock).mockResolvedValue(mockList);

    const response = await request(app)
      .get(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List retrieved successfully");
    expect(response.body.result._id.toString()).toEqual(
      mockList._id.toString()
    );
    expect(response.body.result.type).toEqual(mockList.type);
    expect(getAllLists).toHaveBeenCalledWith(mockUserId);
    expect(getList).toHaveBeenCalledWith(mockListId);
  });

  it("should return an error if the list does not exist in the user's lists", async () => {
    const mockUserLists = {
      statusBased: [],
      themeBased: [mockListId],
    };
    (getAllLists as Mock).mockResolvedValue(mockUserLists);

    const response = await request(app)
      .get(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("List does not exist in user lists");
    expect(getAllLists).toHaveBeenCalledWith(mockUserId);
  });

  it("should return an error if retrieving the list fails", async () => {
    const mockUserLists = {
      statusBased: [mockListId],
      themeBased: [],
    };

    (getAllLists as Mock).mockResolvedValue(mockUserLists);
    (getList as Mock).mockResolvedValue(null);

    const response = await request(app)
      .get(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unable to retrieve list");
    expect(getAllLists).toHaveBeenCalledWith(mockUserId);
    expect(getList).toHaveBeenCalledWith(mockListId);
  });

  it("should handle an error during user lists retrieval", async () => {
    (getAllLists as Mock).mockRejectedValue(
      new Error("Unable to retrieve user lists")
    );

    const response = await request(app)
      .get(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unable to retrieve user lists");
    expect(getAllLists).toHaveBeenCalledWith(mockUserId);
  });

  it("should handle list removal if list not found", async () => {
    const mockUserLists = {
      statusBased: [mockListId],
      themeBased: [],
    };

    (getAllLists as Mock).mockResolvedValue(mockUserLists);
    (getList as Mock).mockRejectedValue(new Error("List not found"));
    (removeList as Mock).mockResolvedValue(true);

    const response = await request(app)
      .get(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("List not found");
    expect(getAllLists).toHaveBeenCalledWith(mockUserId);
    expect(getList).toHaveBeenCalledWith(mockListId);
    expect(removeList).toHaveBeenCalledWith(
      mockUserId,
      mockListId,
      "statusBased"
    );
  });
});

describe("DELETE /v1/list/:listId", () => {
  it("should delete the list successfully", async () => {
    const mockUserLists = {
      statusBased: [mockListId],
      themeBased: [],
    };
    (getAllLists as Mock).mockResolvedValue(mockUserLists);
    (deleteList as Mock).mockResolvedValue(true);
    (removeList as Mock).mockResolvedValue(true);

    const response = await request(app)
      .delete(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List deleted successfully");
    expect(getAllLists).toHaveBeenCalledWith(mockUserId);
    expect(deleteList).toHaveBeenCalledWith(
      new mongoose.Types.ObjectId(mockListId)
    );
    expect(removeList).toHaveBeenCalledWith(
      mockUserId,
      new mongoose.Types.ObjectId(mockListId),
      "statusBased"
    );
  });

  it("should return an error if the list does not exist in the user's lists", async () => {
    const mockUserLists = {
      statusBased: [],
      themeBased: [mockListId],
    };
    (getAllLists as Mock).mockResolvedValue(mockUserLists);

    const response = await request(app)
      .delete(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "List does not exist in user statusBased lists"
    );
    expect(getAllLists).toHaveBeenCalledWith(mockUserId);
  });

  it("should return an error if unable to delete the list", async () => {
    const mockUserLists = {
      statusBased: [mockListId],
      themeBased: [],
    };
    (getAllLists as Mock).mockResolvedValue(mockUserLists);
    (deleteList as Mock).mockResolvedValue(false);

    const response = await request(app)
      .delete(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unable to delete list");
    expect(getAllLists).toHaveBeenCalledWith(mockUserId);
    expect(deleteList).toHaveBeenCalledWith(
      new mongoose.Types.ObjectId(mockListId)
    );
  });

  it("should return an error if unable to remove list from user's lists", async () => {
    const mockUserLists = {
      statusBased: [mockListId],
      themeBased: [],
    };
    (getAllLists as Mock).mockResolvedValue(mockUserLists);
    (deleteList as Mock).mockResolvedValue(true);
    (removeList as Mock).mockResolvedValue(false);

    const response = await request(app)
      .delete(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unable to remove list from user");
    expect(getAllLists).toHaveBeenCalledWith(mockUserId);
    expect(deleteList).toHaveBeenCalledWith(
      new mongoose.Types.ObjectId(mockListId)
    );
    expect(removeList).toHaveBeenCalledWith(
      mockUserId,
      new mongoose.Types.ObjectId(mockListId),
      "statusBased"
    );
  });

  it("should handle an error during user lists retrieval", async () => {
    (getAllLists as Mock).mockRejectedValue(
      new Error("Unable to retrieve user lists")
    );

    const response = await request(app)
      .delete(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unable to retrieve user lists");
    expect(getAllLists).toHaveBeenCalledWith(mockUserId);
  });

  it("should handle an error during list deletion", async () => {
    const mockUserLists = {
      statusBased: [mockListId],
      themeBased: [],
    };

    (getAllLists as Mock).mockResolvedValue(mockUserLists);
    (deleteList as Mock).mockRejectedValue(
      new Error("Delete operation failed")
    );

    const response = await request(app)
      .delete(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Delete operation failed");
    expect(getAllLists).toHaveBeenCalledWith(mockUserId);
  });
});

describe("PUT /v1/list/updatePrivacy/:listId", () => {
  it("should update the list privacy successfully", async () => {
    const mockUserLists = {
      statusBased: [mockListId],
      themeBased: [],
    };
    const updatedPrivacy = "private";
    (getAllLists as Mock).mockResolvedValue(mockUserLists);
    (updateListPrivacy as Mock).mockResolvedValue({
      ...mockList,
      privacy: updatedPrivacy,
    });

    const response = await request(app)
      .put(`/v1/list/updatePrivacy/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .send({ privacy: updatedPrivacy });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List privacy updated successfully");
    expect(response.body.result._id.toString()).toEqual(
      mockList._id.toString()
    );
    expect(response.body.result.privacy).toEqual(updatedPrivacy);
    expect(getAllLists).toHaveBeenCalledWith(mockUserId);
    expect(updateListPrivacy).toHaveBeenCalledWith(
      new mongoose.Types.ObjectId(mockListId),
      updatedPrivacy
    );
  });

  it("should return an error if listId or privacy is missing", async () => {
    const response = await request(app)
      .put(`/v1/list/updatePrivacy/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("details not found");
  });

  it("should return an error if the list does not exist in user's lists", async () => {
    const mockUserLists = {
      statusBased: [],
      themeBased: [],
    };
    (getAllLists as Mock).mockResolvedValue(mockUserLists);

    const updatedPrivacy = "private";
    const response = await request(app)
      .put(`/v1/list/updatePrivacy/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .send({ privacy: updatedPrivacy });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("List does not exist in user lists");
    expect(getAllLists).toHaveBeenCalledWith(mockUserId);
  });

  it("should return an error if unable to retrieve user lists", async () => {
    (getAllLists as Mock).mockRejectedValue(
      new Error("Unable to retrieve lists")
    );

    const updatedPrivacy = "private";
    const response = await request(app)
      .put(`/v1/list/updatePrivacy/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .send({ privacy: updatedPrivacy });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unable to retrieve lists");
    expect(getAllLists).toHaveBeenCalledWith(mockUserId);
  });

  it("should return an error if unable to update list privacy", async () => {
    const mockUserLists = {
      statusBased: [mockListId],
      themeBased: [],
    };
    const updatedPrivacy = "private";
    (getAllLists as Mock).mockResolvedValue(mockUserLists);
    (updateListPrivacy as Mock).mockResolvedValue(null);

    const response = await request(app)
      .put(`/v1/list/updatePrivacy/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .send({ privacy: updatedPrivacy });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unable to update list privacy");
    expect(getAllLists).toHaveBeenCalledWith(mockUserId);
    expect(updateListPrivacy).toHaveBeenCalledWith(
      new mongoose.Types.ObjectId(mockListId),
      updatedPrivacy
    );
  });

  it("should handle unexpected errors", async () => {
    (getAllLists as Mock).mockRejectedValue(new Error("Unexpected error"));

    const updatedPrivacy = "private";
    const response = await request(app)
      .put(`/v1/list/updatePrivacy/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .send({ privacy: updatedPrivacy });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unexpected error");
    expect(getAllLists).toHaveBeenCalledWith(mockUserId);
  });
});
