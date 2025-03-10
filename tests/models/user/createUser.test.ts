import { it, describe, expect, vi, Mock } from "vitest";
import { createUser } from "../../../src/models/user/user.model.ts";
import userModel, { IUser } from "../../../src/models/user/user.schema.ts";
import { hashPassword } from "../../../src/helper/bcrypt.helper.ts";

vi.mock("../../../src/models/user/user.schema.ts", () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));
vi.mock("../../../src/helper/bcrypt.helper.ts");

const userCreationObj = {
  username: "hemantSingh",
  password: "password123",
  name: "Hemant Singh",
  email: "hemant@one.com",
  profileType: "private",
} as IUser;

describe("createUser", () => {
  const mockFindOne = userModel.findOne as Mock;
  const mockHashPassword = hashPassword as Mock;
  const mockCreate = userModel.create as Mock;
  it("should reject when username already exists", async () => {
    mockFindOne.mockResolvedValueOnce({ _id: "existingId" });
    try {
      await createUser(userCreationObj);
    } catch (error) {
      expect(error.message).toBe("username already exists");
    }
    expect(userModel.findOne).toHaveBeenCalledWith({
      username: "hemantSingh",
    });
  });

  it("should create a new user successfully", async () => {
    mockFindOne.mockResolvedValueOnce(null);
    mockHashPassword.mockResolvedValueOnce("hashedPassword123");
    mockCreate.mockResolvedValueOnce({
      ...userCreationObj,
      _id: "someNewId",
      password: "hashPassword123",
    });
    const result = await createUser(userCreationObj);

    expect(result).toEqual({
      ...userCreationObj,
      _id: "someNewId",
      password: "hashPassword123",
    });
    expect(userModel.findOne).toHaveBeenCalledWith({ username: "hemantSingh" });
    expect(hashPassword).toHaveBeenCalledWith("password123");
    expect(userModel.create).toHaveBeenCalledWith({
      ...userCreationObj,
      password: "hashedPassword123",
    });
  });

  it("should reject if createUser fails to create a user", async () => {
    mockFindOne.mockResolvedValueOnce(null);
    mockHashPassword.mockResolvedValueOnce("hashedPassword123");
    mockCreate.mockResolvedValueOnce(null);

    try {
      await createUser(userCreationObj);
    } catch (error) {
      expect(error.message).toBe("Unable to create user");
    }

    expect(userModel.findOne).toHaveBeenCalledWith({ username: "hemantSingh" });
    expect(hashPassword).toHaveBeenCalledWith("password123");
    expect(userModel.create).toHaveBeenCalledWith({
      ...userCreationObj,
      password: "hashedPassword123",
    });
  });

  it("should reject on error during execution", async () => {
    mockFindOne.mockRejectedValueOnce(new Error("Database error"));

    try {
      await createUser(userCreationObj);
    } catch (error) {
      expect(error.message).toBe("Database error");
    }

    expect(userModel.findOne).toHaveBeenCalledWith({ username: "hemantSingh" });
  });
});
