import request from "supertest";
import { describe, it, expect, vi, Mock } from "vitest";
import app from "../../app.ts";
import {
  findUser,
  searchUser,
  deleteUser,
  updateUser,
  updatePassword,
} from "../../src/models/user/user.model";
import {
  addTag,
  getAllTags,
  removeTag,
} from "../../src/models/user/userTags.model.ts";
import mongoose from "mongoose";

// Mock user functions
vi.mock("../../src/models/user/user.model", () => ({
  findUser: vi.fn(),
  searchUser: vi.fn(),
  deleteUser: vi.fn(),
  updateUser: vi.fn(),
  updatePassword: vi.fn(),
}));

vi.mock("../../src/models/user/userTags.model.ts");

vi.mock(
  "../../src/middlewares/authorization/userAuthorization.middleware.ts",
  () => ({
    __esModule: true,
    default: (req, res, next) => {
      req.userId = new mongoose.Types.ObjectId();
      next();
    },
  })
);

describe("GET /v1/user/search/:query", () => {
  it("should return matching users when a valid query is provided", async () => {
    const mockQuery = "john";
    const mockUsers = [{ _id: "1", username: "john_doe", name: "John Doe" }];

    (searchUser as Mock).mockResolvedValueOnce(mockUsers);

    const res = await request(app)
      .get(`/v1/user/search/${mockQuery}?type=username`)
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockUsers);
    expect(searchUser).toHaveBeenCalledWith(mockQuery, "username");
  });

  it("should return 400 if type parameter is invalid", async () => {
    const res = await request(app)
      .get(`/v1/user/search/john?type=invalid`)
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Validation failed");
  });

  it("should return 400 if no users are found", async () => {
    (searchUser as Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .get(`/v1/user/search/john?type=username`)
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("username not found");
  });

  it("should return 500 if an error occurs in searchUser", async () => {
    (searchUser as Mock).mockRejectedValueOnce(new Error("Database error"));

    const res = await request(app)
      .get(`/v1/user/search/john?type=username`)
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Database error");
  });
});

describe("DELETE /v1/user/", () => {
  it("should delete the user when valid credentials are provided", async () => {
    (deleteUser as Mock).mockResolvedValueOnce({ success: true });

    const res = await request(app)
      .delete(`/v1/user/`)
      .send({ password: "validpassword" })
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return 400 if password is missing", async () => {
    const res = await request(app)
      .delete(`/v1/user/`)
      .send({})
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Password is required");
  });

  it("should return 400 if user deletion fails", async () => {
    (deleteUser as Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .delete(`/v1/user/`)
      .send({ password: "validpassword" })
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Unable to delete user");
  });

  it("should return 500 if an error occurs in deleteUser", async () => {
    (deleteUser as Mock).mockRejectedValueOnce(new Error("Database error"));

    const res = await request(app)
      .delete(`/v1/user/`)
      .send({ password: "validpassword" })
      .set("Authorization", "Bearer fake-token");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Database error");
  });
});

describe("PUT /v1/user/update", () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();

  it("should update user details successfully", async () => {
    const mockUpdateData = { name: "Updated Name", updateField: "name" };
    const mockUpdatedUser = { _id: mockUserId, ...mockUpdateData };

    (updateUser as Mock).mockResolvedValue(mockUpdatedUser);

    const res = await request(app)
      .put("/v1/user/update")
      .set("Authorization", "Bearer valid-token")
      .send(mockUpdateData);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockUpdatedUser);
  });

  it("should return 400 if update fails", async () => {
    (updateUser as Mock).mockResolvedValue(null);

    const res = await request(app)
      .put("/v1/user/update")
      .set("Authorization", "Bearer valid-token")
      .send({ name: "Fail Test", updateField: "name" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Unable to update user");
  });
});

describe("PUT /v1/user/updatePassword", () => {
  it("should update password successfully", async () => {
    (updatePassword as Mock).mockResolvedValue({ modifiedCount: 1 });

    const res = await request(app)
      .put("/v1/user/updatePassword")
      .set("Authorization", "Bearer valid-token")
      .send({ oldPassword: "oldPass123", newPassword: "newPass456" });

    expect(res.status).toBe(200);
    expect(res.body.modifiedCount).toBe(1);
  });

  it("should return 400 if old password is incorrect", async () => {
    (updatePassword as Mock).mockRejectedValue(
      new Error("Old password is incorrect")
    );

    const res = await request(app)
      .put("/v1/user/updatePassword")
      .set("Authorization", "Bearer valid-token")
      .send({ oldPassword: "wrongPass", newPassword: "newPass456" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Old password is incorrect");
  });
});

describe("PUT /v1/user/tag", () => {
  const mockUserId = "65fc9ad8e1b28b001cb23a5b";

  it("should add a tag successfully", async () => {
    (addTag as Mock).mockResolvedValue({ _id: mockUserId });

    const res = await request(app)
      .put("/v1/user/tag?queryType=add")
      .set("Authorization", "Bearer valid-token")
      .send({ tag: "new-tag" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Tag added successfully");
  });

  it("should remove a tag successfully", async () => {
    (removeTag as Mock).mockResolvedValue({ _id: mockUserId });

    const res = await request(app)
      .put("/v1/user/tag?queryType=remove")
      .set("Authorization", "Bearer valid-token")
      .send({ tag: "old-tag" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Tag removed successfully");
  });

  it("should return 400 if unable to add tag", async () => {
    (addTag as Mock).mockResolvedValue(null);

    const res = await request(app)
      .put("/v1/user/tag?queryType=add")
      .set("Authorization", "Bearer valid-token")
      .send({ tag: "fail-tag" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Unable to add tag");
  });

  it("should return 400 if unable to remove tag", async () => {
    (removeTag as Mock).mockResolvedValue(null);

    const res = await request(app)
      .put("/v1/user/tag?queryType=remove")
      .set("Authorization", "Bearer valid-token")
      .send({ tag: "fail-tag" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Unable to remove tag");
  });
});

describe("GET /v1/user/tags", () => {
  const mockTags = { tags: ["tag1", "tag2", "tag3"] };

  it("should return a list of tags", async () => {
    (getAllTags as Mock).mockResolvedValue(mockTags);
    const res = await request(app)
      .get("/v1/user/tags")
      .set("Authorization", "Bearer valid-token");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockTags);
  });

  it("should return 400 if unable to retrieve tags", async () => {
    (getAllTags as Mock).mockResolvedValue(null);

    const res = await request(app)
      .get("/v1/user/tags")
      .set("Authorization", "Bearer valid-token");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Unable to get tags");
  });
});
