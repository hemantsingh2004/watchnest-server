import { it, describe, expect, vi, Mock } from "vitest";
import { createUser } from "../../src/models/user/user.model.ts";
import userModel, { IUser } from "../../src/models/user/user.schema.ts";
import { hashPassword } from "../../src/helper/bcrypt.helper.ts";

//These Test are incomplete and have problems

vi.mock("../../src/models/user/user.schema.ts", () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));
vi.mock("../../src/helper/bcrypt.helper.ts");

const userObj = {
  username: "existingUser",
  password: "password123",
  name: "Hemant Singh",
  email: "hemant@one.come",
  profileType: "private",
} as IUser;

describe("createUser", () => {
  it("should reject when username already exists", async () => {
    (userModel.findOne as Mock).mockResolvedValueOnce({ _id: "existingId" });
    try {
      await createUser(userObj);
    } catch (error) {
      expect(error.message).toBe("username already exists");
    }
    expect(userModel.findOne).toHaveBeenCalledWith({
      username: "existingUser",
    });
  });

  it("should create a new user successfully", async () => {
    (userModel.findOne as Mock).mockResolvedValueOnce(null);
    (hashPassword as Mock).mockResolvedValueOnce("hashedPassword123");
    (userModel.create as Mock).mockResolvedValueOnce({
      _id: "newUserId",
      username: "newUser",
    });
    const result = await createUser(userObj);

    expect(result).toEqual({ _id: "newUserId", username: "newUser" });
    expect(userModel.findOne).toHaveBeenCalledWith({ username: "newUser" });
    expect(hashPassword).toHaveBeenCalledWith("password123");
    expect(userModel.create).toHaveBeenCalledWith({
      ...userObj,
      password: "hashedPassword123",
    });
  });

  it("should reject if createUser fails to create a user", async () => {
    (userModel.findOne as Mock).mockResolvedValueOnce(null);
    (hashPassword as Mock).mockResolvedValueOnce("hashedPassword123");
    (userModel.create as Mock).mockResolvedValueOnce(null);

    try {
      await createUser(userObj);
    } catch (error) {
      expect(error.message).toBe("Unable to create user");
    }

    expect(userModel.findOne).toHaveBeenCalledWith({ username: "newUser" });
    expect(hashPassword).toHaveBeenCalledWith("password123");
    expect(userModel.create).toHaveBeenCalledWith({
      ...userObj,
      password: "hashedPassword123",
    });
  });

  it("should reject on error during execution", async () => {
    (userModel.findOne as Mock).mockRejectedValueOnce(
      new Error("Database error")
    );

    try {
      await createUser(userObj);
    } catch (error) {
      expect(error.message).toBe("Database error");
    }

    expect(userModel.findOne).toHaveBeenCalledWith({ username: "newUser" });
  });
});
