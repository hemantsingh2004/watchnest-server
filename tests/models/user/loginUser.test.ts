import { it, describe, expect, vi, Mock } from "vitest";
import { loginUser, ILoginUser } from "../../../src/models/user/user.model";
import UserModel from "../../../src/models/user/user.schema";
import { comparePassword } from "../../../src/helper/bcrypt.helper";
import {
  createRefreshJWT,
  createAccessJWT,
} from "../../../src/helper/jwt.helper";
import { setJWT } from "../../../src/helper/redis.helper";

vi.mock("../../../src/models/user/user.schema.ts", () => ({
  default: {
    findOne: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(), // Mocking the `select` method to allow chaining
    }),
  },
}));
vi.mock("../../../src/helper/bcrypt.helper.ts");
vi.mock("../../../src/helper/jwt.helper.ts");
vi.mock("../../../src/helper/redis.helper.ts");

const userLoginObj: ILoginUser = {
  email: "hemant@one.com",
  passwordProvided: "password123",
};

describe("loginUser", () => {
  it("should use query as email when username is not provided", async () => {
    const querySpy = vi.fn();
    (UserModel.findOne as Mock).mockImplementationOnce((query: any) => {
      querySpy(query);
      return {
        select: vi.fn().mockReturnThis(),
      };
    });

    try {
      await loginUser(userLoginObj);
    } catch (error) {}

    expect(querySpy).toHaveBeenCalledWith({ email: "hemant@one.com" });
  });

  it("should give error if user not found", async () => {
    (UserModel.findOne().select as Mock).mockResolvedValueOnce(null);
    try {
      await loginUser(userLoginObj);
    } catch (error) {
      expect(error.message).toBe("User not found");
    }
    expect(UserModel.findOne).toHaveBeenCalledWith({ email: "hemant@one.com" });
  });

  it("should give error if database malfunctions", async () => {
    (UserModel.findOne().select as Mock).mockRejectedValueOnce(
      new Error("Database error")
    );
    try {
      await loginUser(userLoginObj);
    } catch (error) {
      expect(error.message).toBe("Database error");
    }
  });

  it("should give invalid password if wrong password", async () => {
    (UserModel.findOne().select as Mock).mockResolvedValueOnce({
      _id: "userId",
      password: "hashedPassword123",
    });
    (comparePassword as Mock).mockResolvedValueOnce(false);

    try {
      await loginUser(userLoginObj);
    } catch (error) {
      expect(error.message).toBe("Invalid password");
    }
    expect(comparePassword).toHaveBeenCalledWith(
      "password123",
      "hashedPassword123"
    );
  });

  it("should give error if tokens not created", async () => {
    (UserModel.findOne().select as Mock).mockResolvedValueOnce({
      _id: "userId",
      password: "hashedPassword123",
    });
    (comparePassword as Mock).mockResolvedValueOnce(true);
    (createRefreshJWT as Mock).mockResolvedValueOnce(null); // Simulate token creation failure

    try {
      await loginUser(userLoginObj);
    } catch (error) {
      expect(error.message).toBe("Unable to create token");
    }
  });

  it("should be successful if login is successful", async () => {
    const refreshToken = "refreshToken123";
    const accessToken = "accessToken123";
    const mockUser = {
      _id: "userId",
      password: "hashedPassword123",
      updateOne: vi.fn(),
    };
    (UserModel.findOne().select as Mock).mockResolvedValueOnce(mockUser);
    (comparePassword as Mock).mockResolvedValueOnce(true);
    (createRefreshJWT as Mock).mockResolvedValueOnce(refreshToken);
    (createAccessJWT as Mock).mockResolvedValueOnce(accessToken);
    (setJWT as Mock).mockResolvedValueOnce(true);
    (mockUser.updateOne as Mock).mockResolvedValueOnce({});

    const result = await loginUser(userLoginObj);

    expect(result).toEqual({
      message: "Login successful",
      accessToken,
      refreshToken,
    });
    expect(UserModel.findOne).toHaveBeenCalledWith({ email: "hemant@one.com" });
    expect(comparePassword).toHaveBeenCalledWith(
      "password123",
      "hashedPassword123"
    );
    expect(createRefreshJWT).toHaveBeenCalledWith({ _id: "userId" });
    expect(createAccessJWT).toHaveBeenCalledWith({ _id: "userId" });
    expect(setJWT).toHaveBeenCalledWith(accessToken, "userId");
    expect(mockUser.updateOne).toHaveBeenCalledWith({ $set: { refreshToken } });
  });
});
