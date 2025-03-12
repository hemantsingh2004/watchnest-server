import { it, describe, expect, vi, Mock } from "vitest";
import mongoose from "mongoose";
import { findUser, searchUser } from "../../../src/models/user/user.model";
import userModel from "../../../src/models/user/user.schema";

vi.mock("../../../src/models/user/user.schema.ts", () => ({
  default: {
    findById: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

describe("findUser", () => {
  it("should return error if database error or user not found", async () => {
    const objectId = new mongoose.Types.ObjectId();

    (userModel.findById as Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    try {
      await findUser(objectId);
    } catch (error) {
      expect(error.message).toBe("Database error");
    }

    (userModel.findById as Mock).mockResolvedValueOnce(null);
    try {
      await findUser(objectId);
    } catch (error) {
      expect(error.message).toBe("User not found");
    }
  });

  it("should return user if found", async () => {
    const objectId = new mongoose.Types.ObjectId();
    const mockUser = { _id: objectId, name: "Hemant" };
    (userModel.findById as Mock).mockResolvedValueOnce(mockUser);

    const result = await findUser(objectId);
    expect(result).toEqual(mockUser);
    expect(userModel.findById).toHaveBeenCalledWith(objectId);
  });
});

describe("searchUser", () => {
  it("should return error if database error", async () => {
    (userModel.find as Mock).mockRejectedValueOnce(new Error("Database error"));

    try {
      await searchUser("Hemant", "name");
    } catch (error) {
      expect(error.message).toBe("Database error");
    }

    try {
      await searchUser("Hemant", "username");
    } catch (error) {
      expect(error.message).toBe("Database error");
    }
  });

  it("should return a list of users if found by name", async () => {
    const mockUsers = [
      { _id: new mongoose.Types.ObjectId(), name: "Hemant" },
      { _id: new mongoose.Types.ObjectId(), name: "John" },
    ];

    (userModel.find as Mock).mockResolvedValueOnce(mockUsers);

    const result = await searchUser("Hemant", "name");
    expect(result).toEqual(mockUsers);
    expect(userModel.find).toHaveBeenCalledWith({
      name: { $regex: "Hemant", $options: "i" },
      profileType: "public",
    });
  });

  it("should return a user if found by username", async () => {
    const mockUser = { _id: new mongoose.Types.ObjectId(), username: "Hemant" };

    (userModel.find as Mock).mockResolvedValueOnce(mockUser);

    const result = await searchUser("Hemant", "username");
    expect(result).toEqual(mockUser);
    expect(userModel.find).toHaveBeenCalledWith({
      username: "Hemant",
    });
  });

  it("should throw an error if type is invalid", async () => {
    try {
      await searchUser("Hemant", "invalidType" as any);
    } catch (error) {
      expect(error.message).toBe("Invalid type. Must be 'name' or 'username'.");
    }
  });
});
