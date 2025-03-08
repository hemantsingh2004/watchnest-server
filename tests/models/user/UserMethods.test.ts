import { it, describe, expect, vi, Mock } from "vitest";
import mongoose from "mongoose";
import {
  findUser,
  searchUser,
  deleteUser,
  updateUser,
  updatePassword,
} from "../../../src/models/user/user.model";
import userModel from "../../../src/models/user/user.schema";
import {
  comparePassword,
  hashPassword,
} from "../../../src/helper/bcrypt.helper.ts";

vi.mock("../../../src/models/user/user.schema.ts", () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    findByIdAndDelete: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    updateOne: vi.fn(),
  },
}));

vi.mock("../../../src/helper/bcrypt.helper.ts", () => ({
  comparePassword: vi.fn(),
  hashPassword: vi.fn(),
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

describe("deleteUser", () => {
  it("should delete the user when the password is correct", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockPassword = "correct-password";
    const mockUser = { password: "hashed-password" };
    const mockDeletedUser = { _id: mockUserId };

    (userModel.findById as Mock).mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce(mockUser),
    });

    (comparePassword as Mock).mockResolvedValueOnce(true);
    (userModel.findByIdAndDelete as Mock).mockResolvedValueOnce(
      mockDeletedUser
    );

    const result = await deleteUser(mockUserId, mockPassword);
    expect(result).toEqual(mockDeletedUser);
    expect(userModel.findById).toHaveBeenCalledWith(mockUserId);
    expect(comparePassword).toHaveBeenCalledWith(
      mockPassword,
      mockUser.password
    );
    expect(userModel.findByIdAndDelete).toHaveBeenCalledWith(mockUserId);
  });

  it("should throw an error if the user is not found", async () => {
    const mockUserId = new mongoose.Types.ObjectId();

    (userModel.findById as Mock).mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce(null),
    });

    await expect(deleteUser(mockUserId, "any-password")).rejects.toThrow(
      "User not found"
    );
  });

  it("should throw an error if the password is incorrect", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockPassword = "wrong-password";
    const mockUser = { password: "hashed-password" };

    (userModel.findById as Mock).mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce(mockUser),
    });
    (comparePassword as Mock).mockResolvedValueOnce(false);

    await expect(deleteUser(mockUserId, mockPassword)).rejects.toThrow(
      "Password is incorrect"
    );
  });

  it("should throw an error if user deletion fails", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockPassword = "correct-password";
    const mockUser = { password: "hashed-password" };

    (userModel.findById as Mock).mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce(mockUser),
    });
    (comparePassword as Mock).mockResolvedValueOnce(true);
    (userModel.findByIdAndDelete as Mock).mockResolvedValueOnce(null);

    await expect(deleteUser(mockUserId, mockPassword)).rejects.toThrow(
      "Unable to delete user"
    );
  });
});

describe("updateUser", () => {
  it("should update user details successfully", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockUpdates = { name: "New Name", email: "new@example.com" };
    const mockUpdatedUser = { _id: mockUserId, ...mockUpdates };

    (userModel.findByIdAndUpdate as Mock).mockResolvedValueOnce(
      mockUpdatedUser
    );

    const result = await updateUser({
      userId: mockUserId,
      updates: mockUpdates,
    });
    expect(result).toEqual(mockUpdatedUser);
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith({
      _id: mockUserId,
      $set: mockUpdates,
      new: true,
    });
  });

  it("should throw an error if updating user details fails", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockUpdates = { name: "New Name" };

    (userModel.findByIdAndUpdate as Mock).mockResolvedValueOnce(null);

    await expect(
      updateUser({ userId: mockUserId, updates: mockUpdates })
    ).rejects.toThrow("Unable to update list details");
  });

  it("should throw an error if database operation fails", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockUpdates = { name: "New Name" };

    (userModel.findByIdAndUpdate as Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    await expect(
      updateUser({ userId: mockUserId, updates: mockUpdates })
    ).rejects.toThrow("Database error");
  });
});

describe("updatePassword", () => {
  it("should update the password when old password is correct", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockOldPassword = "old-password";
    const mockNewPassword = "new-password";
    const mockHashedNewPassword = "hashed-new-password";
    const mockUser = { password: "hashed-old-password" };
    const mockUpdateResult = { modifiedCount: 1 };

    (userModel.findById as Mock).mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce(mockUser),
    });
    (comparePassword as Mock).mockResolvedValueOnce(true);
    (hashPassword as Mock).mockResolvedValueOnce(mockHashedNewPassword);
    (userModel.updateOne as Mock).mockResolvedValueOnce(mockUpdateResult);

    const result = await updatePassword(
      mockUserId,
      mockOldPassword,
      mockNewPassword
    );
    expect(result).toEqual(mockUpdateResult);
    expect(userModel.findById).toHaveBeenCalledWith(mockUserId);
    expect(comparePassword).toHaveBeenCalledWith(
      mockOldPassword,
      mockUser.password
    );
    expect(hashPassword).toHaveBeenCalledWith(mockNewPassword);
    expect(userModel.updateOne).toHaveBeenCalledWith(
      { _id: mockUserId },
      { $set: { password: mockHashedNewPassword } }
    );
  });

  it("should throw an error if the old password is incorrect", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockOldPassword = "wrong-password";
    const mockNewPassword = "new-password";
    const mockUser = { password: "hashed-old-password" };

    (userModel.findById as Mock).mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce(mockUser),
    });
    (comparePassword as Mock).mockResolvedValueOnce(false);

    await expect(
      updatePassword(mockUserId, mockOldPassword, mockNewPassword)
    ).rejects.toThrow("Old password is incorrect");
  });

  it("should throw an error if user is not found", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockOldPassword = "old-password";
    const mockNewPassword = "new-password";

    (userModel.findById as Mock).mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce(null),
    });

    await expect(
      updatePassword(mockUserId, mockOldPassword, mockNewPassword)
    ).rejects.toThrow("Unable to update password");
  });

  it("should throw an error if password update fails", async () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockOldPassword = "old-password";
    const mockNewPassword = "new-password";
    const mockUser = { password: "hashed-old-password" };
    const mockHashedNewPassword = "hashed-new-password";

    (userModel.findById as Mock).mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce(mockUser),
    });
    (comparePassword as Mock).mockResolvedValueOnce(true);
    (hashPassword as Mock).mockResolvedValueOnce(mockHashedNewPassword);
    (userModel.updateOne as Mock).mockResolvedValueOnce(null);

    await expect(
      updatePassword(mockUserId, mockOldPassword, mockNewPassword)
    ).rejects.toThrow("Unable to update password");
  });
});
