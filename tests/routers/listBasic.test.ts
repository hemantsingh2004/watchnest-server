import request from "supertest";
import { describe, it, expect, vi, Mock } from "vitest";
import app from "../../app.ts";
import mongoose from "mongoose";
import {
  createList,
  deleteList,
  getList,
  updateListDetails,
} from "../../src/models/list/user-list/list.model.ts";
import {
  addListToUser,
  getUserLists,
  removeListFromUser,
} from "../../src/models/user/userList.model.ts";

vi.mock("../../src/models/list/user-list/list.model.ts");
vi.mock("../../src/models/user/userList.model.ts");

// Mock data for the test
const validListObj = {
  name: "My List",
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
    (addListToUser as Mock).mockResolvedValue(true);

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
    expect(addListToUser).toHaveBeenCalledWith(
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
    (addListToUser as Mock).mockResolvedValue(false);
    (deleteList as Mock).mockResolvedValue(true);

    const response = await request(app)
      .post("/v1/list")
      .set("Authorization", `Bearer ${mockUserId}`)
      .send(validListObj);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unable to add list, please try again");
    expect(createList).toHaveBeenCalledWith(validListObj);
    expect(addListToUser).toHaveBeenCalledWith(
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
    (getUserLists as Mock).mockResolvedValue(mockUserLists);
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
    expect(getUserLists).toHaveBeenCalledWith(mockUserId);
    expect(getList).toHaveBeenCalledWith(mockListId);
  });

  it("should return an error if the list does not exist in the user's lists", async () => {
    const mockUserLists = {
      statusBased: [],
      themeBased: [mockListId],
    };
    (getUserLists as Mock).mockResolvedValue(mockUserLists);

    const response = await request(app)
      .get(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("List does not exist in user lists");
    expect(getUserLists).toHaveBeenCalledWith(mockUserId);
  });

  it("should return an error if retrieving the list fails", async () => {
    const mockUserLists = {
      statusBased: [mockListId],
      themeBased: [],
    };

    (getUserLists as Mock).mockResolvedValue(mockUserLists);
    (getList as Mock).mockResolvedValue(null);

    const response = await request(app)
      .get(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unable to retrieve list");
    expect(getUserLists).toHaveBeenCalledWith(mockUserId);
    expect(getList).toHaveBeenCalledWith(mockListId);
  });

  it("should handle an error during user lists retrieval", async () => {
    (getUserLists as Mock).mockRejectedValue(
      new Error("Unable to retrieve user lists")
    );

    const response = await request(app)
      .get(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unable to retrieve user lists");
    expect(getUserLists).toHaveBeenCalledWith(mockUserId);
  });

  it("should handle list removal if list not found", async () => {
    const mockUserLists = {
      statusBased: [mockListId],
      themeBased: [],
    };

    (getUserLists as Mock).mockResolvedValue(mockUserLists);
    (getList as Mock).mockRejectedValue(new Error("List not found"));
    (removeListFromUser as Mock).mockResolvedValue(true);

    const response = await request(app)
      .get(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("List not found");
    expect(getUserLists).toHaveBeenCalledWith(mockUserId);
    expect(getList).toHaveBeenCalledWith(mockListId);
    expect(removeListFromUser).toHaveBeenCalledWith(
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
    (getUserLists as Mock).mockResolvedValue(mockUserLists);
    (deleteList as Mock).mockResolvedValue(true);
    (removeListFromUser as Mock).mockResolvedValue(true);

    const response = await request(app)
      .delete(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List deleted successfully");
    expect(getUserLists).toHaveBeenCalledWith(mockUserId);
    expect(deleteList).toHaveBeenCalledWith(
      new mongoose.Types.ObjectId(mockListId)
    );
    expect(removeListFromUser).toHaveBeenCalledWith(
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
    (getUserLists as Mock).mockResolvedValue(mockUserLists);

    const response = await request(app)
      .delete(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "List does not exist in user statusBased lists"
    );
    expect(getUserLists).toHaveBeenCalledWith(mockUserId);
  });

  it("should return an error if unable to delete the list", async () => {
    const mockUserLists = {
      statusBased: [mockListId],
      themeBased: [],
    };
    (getUserLists as Mock).mockResolvedValue(mockUserLists);
    (deleteList as Mock).mockResolvedValue(false);

    const response = await request(app)
      .delete(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unable to delete list");
    expect(getUserLists).toHaveBeenCalledWith(mockUserId);
    expect(deleteList).toHaveBeenCalledWith(
      new mongoose.Types.ObjectId(mockListId)
    );
  });

  it("should return an error if unable to remove list from user's lists", async () => {
    const mockUserLists = {
      statusBased: [mockListId],
      themeBased: [],
    };
    (getUserLists as Mock).mockResolvedValue(mockUserLists);
    (deleteList as Mock).mockResolvedValue(true);
    (removeListFromUser as Mock).mockResolvedValue(false);

    const response = await request(app)
      .delete(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unable to remove list from user");
    expect(getUserLists).toHaveBeenCalledWith(mockUserId);
    expect(deleteList).toHaveBeenCalledWith(
      new mongoose.Types.ObjectId(mockListId)
    );
    expect(removeListFromUser).toHaveBeenCalledWith(
      mockUserId,
      new mongoose.Types.ObjectId(mockListId),
      "statusBased"
    );
  });

  it("should handle an error during user lists retrieval", async () => {
    (getUserLists as Mock).mockRejectedValue(
      new Error("Unable to retrieve user lists")
    );

    const response = await request(app)
      .delete(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unable to retrieve user lists");
    expect(getUserLists).toHaveBeenCalledWith(mockUserId);
  });

  it("should handle an error during list deletion", async () => {
    const mockUserLists = {
      statusBased: [mockListId],
      themeBased: [],
    };

    (getUserLists as Mock).mockResolvedValue(mockUserLists);
    (deleteList as Mock).mockRejectedValue(
      new Error("Delete operation failed")
    );

    const response = await request(app)
      .delete(`/v1/list/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ type: "statusBased" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Delete operation failed");
    expect(getUserLists).toHaveBeenCalledWith(mockUserId);
  });
});

describe("PUT /v1/list/update/:listId", () => {
  it("should update list details successfully", async () => {
    const mockUserLists = {
      statusBased: [mockListId],
      themeBased: [],
    };
    const updatedPrivacy = "private";
    const updatedName = "Updated List Name";
    const updatedResult = {
      _id: mockListId,
      privacy: updatedPrivacy,
      name: updatedName,
    };
    (getUserLists as Mock).mockResolvedValue(mockUserLists);
    (updateListDetails as Mock).mockResolvedValue(updatedResult);

    const response = await request(app)
      .put(`/v1/list/update/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ updateType: "privacy" })
      .send({ privacy: updatedPrivacy, name: updatedName });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("List privacy updated successfully");
    expect(response.body.result._id.toString()).toEqual(mockListId.toString());
    expect(response.body.result.privacy).toEqual(updatedPrivacy);
    expect(response.body.result.name).toEqual(updatedName);
    expect(getUserLists).toHaveBeenCalledWith(mockUserId);
    expect(updateListDetails).toHaveBeenCalledWith({
      listId: new mongoose.Types.ObjectId(mockListId),
      updates: {
        privacy: updatedPrivacy,
        name: updatedName,
      },
    });
  });

  it("should return an error if listId or required body fields are missing", async () => {
    const response = await request(app)
      .put(`/v1/list/update/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ updateType: "name" })
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Validation failed");
  });

  it("should return an error if the list does not exist in user's lists", async () => {
    const mockUserLists = {
      statusBased: [],
      themeBased: [],
    };
    (getUserLists as Mock).mockResolvedValue(mockUserLists);

    const updatedPrivacy = "private";
    const updatedName = "Updated List Name";
    const response = await request(app)
      .put(`/v1/list/update/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ updateType: "privacy" })
      .send({ privacy: updatedPrivacy, name: updatedName });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("List does not exist in user lists");
    expect(getUserLists).toHaveBeenCalledWith(mockUserId);
  });

  it("should return an error if unable to retrieve user lists", async () => {
    (getUserLists as Mock).mockRejectedValue(
      new Error("Unable to retrieve lists")
    );

    const updatedPrivacy = "private";
    const updatedName = "Updated List Name";
    const response = await request(app)
      .put(`/v1/list/update/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ updateType: "privacy" })
      .send({ privacy: updatedPrivacy, name: updatedName });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unable to retrieve lists");
    expect(getUserLists).toHaveBeenCalledWith(mockUserId);
  });

  it("should return an error if unable to update list details", async () => {
    const mockUserLists = {
      statusBased: [mockListId],
      themeBased: [],
    };
    const updatedPrivacy = "private";
    const updatedName = "Updated List Name";
    (getUserLists as Mock).mockResolvedValue(mockUserLists);
    (updateListDetails as Mock).mockResolvedValue(null);

    const response = await request(app)
      .put(`/v1/list/update/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ updateType: "privacy" })
      .send({ privacy: updatedPrivacy, name: updatedName });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unable to update list");
    expect(getUserLists).toHaveBeenCalledWith(mockUserId);
    expect(updateListDetails).toHaveBeenCalledWith({
      listId: new mongoose.Types.ObjectId(mockListId),
      updates: {
        privacy: updatedPrivacy,
        name: updatedName,
      },
    });
  });

  it("should handle unexpected errors", async () => {
    (getUserLists as Mock).mockRejectedValue(new Error("Unexpected error"));

    const updatedPrivacy = "private";
    const updatedName = "Updated List Name";
    const response = await request(app)
      .put(`/v1/list/update/${mockListId}`)
      .set("Authorization", `Bearer ${mockUserId}`)
      .query({ updateType: "privacy" })
      .send({ privacy: updatedPrivacy, name: updatedName });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unexpected error");
    expect(getUserLists).toHaveBeenCalledWith(mockUserId);
  });
});
