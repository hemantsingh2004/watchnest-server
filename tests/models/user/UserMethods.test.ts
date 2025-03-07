import { it, describe, expect, vi, Mock } from "vitest";
import mongoose from "mongoose";
import {
  findUser,
  searchByName,
  searchByUserName,
  updateProfileType,
} from "../../../src/models/user/user.model";
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

describe("searchByName", () => {
  it("should return error if database error", async () => {
    (userModel.findOne as Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    try {
      await searchByName("Hemant");
    } catch (error) {
      expect(error.message).toBe("Database error");
    }
  });

  it("should return a list of users if found", async () => {
    const mockUsers = [
      { _id: new mongoose.Types.ObjectId(), name: "Hemant" },
      { _id: new mongoose.Types.ObjectId(), name: "John" },
    ];
    (userModel.find as Mock).mockResolvedValueOnce(mockUsers);

    const result = await searchByName("Hemant");
    expect(result).toEqual(mockUsers);
    expect(userModel.find).toHaveBeenCalledWith({
      name: { $regex: "Hemant", $options: "i" },
      profileType: "public",
    });
  });
});

describe("searchByUsername", () => {
  it("should return error if database error", async () => {
    (userModel.find as Mock).mockRejectedValueOnce(new Error("Database error"));

    try {
      await searchByUserName("Hemant");
    } catch (error) {
      expect(error.message).toBe("Database error");
    }
  });

  it("should return a user if found", async () => {
    const mockUser = { _id: new mongoose.Types.ObjectId(), username: "Hemant" };
    (userModel.find as Mock).mockResolvedValueOnce(mockUser);

    const result = await searchByUserName("Hemant");
    expect(result).toEqual(mockUser);
    expect(userModel.find).toHaveBeenCalledWith({
      username: "Hemant",
    });
  });
});

describe("updateProfileType", () => {
  it("should return error if database error", async () => {
    const objectId = new mongoose.Types.ObjectId();
    (userModel.findOneAndUpdate as Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    try {
      await updateProfileType(objectId, "private");
    } catch (error) {
      expect(error.message).toBe("Database error");
    }
  });

  it("should update profile type and return new user document", async () => {
    const objectId = new mongoose.Types.ObjectId();
    const mockUpdatedUser = {
      _id: objectId,
      profileType: "private",
      name: "Hemant",
    };
    (userModel.findOneAndUpdate as Mock).mockResolvedValueOnce(mockUpdatedUser);

    const result = await updateProfileType(objectId, "private");
    expect(result).toEqual(mockUpdatedUser);
    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: objectId },
      { $set: { profileType: "private" } },
      { new: true }
    );
  });
});
