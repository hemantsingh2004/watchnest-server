import { it, describe, expect, vi, Mock } from "vitest";
import request from "supertest";
import app from "../../app.ts";
import mongoose from "mongoose";
import {
  createUser,
  loginUser,
  findUser,
} from "../../src/models/user/user.model.ts";
import { IUser } from "../../src/models/user/user.schema.ts";
import {
  verifyRefreshJWT,
  createAccessJWT,
} from "../../src/helper/jwt.helper.ts";

vi.mock("../../src/models/user/user.model.ts");
vi.mock("../../src/helper/jwt.helper.ts");
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

describe("POST /v1/auth/register", () => {
  const mockCreateUser = createUser as Mock;

  const newUser = {
    name: "Hemant Singh",
    email: "hemant@one.com",
    password: "password123",
    username: "hemantSingh",
    profileType: "private",
  } as IUser;

  it("should successfully create a user and return status 200", async () => {
    const result = { id: "123", ...newUser };

    mockCreateUser.mockResolvedValue(result);

    const response = await request(app)
      .post("/v1/auth/register")
      .send(newUser)
      .expect(200);

    expect(response.body.message).toBe("User created successfully");
    expect(response.body.result).toEqual(result);
  });

  it("should return status 400 if user creation fails", async () => {
    mockCreateUser.mockResolvedValue(null);

    const response = await request(app)
      .post("/v1/auth/register")
      .send(newUser)
      .expect(400);

    expect(response.body.message).toBe("User creation failed");
  });

  it("should pass error to next middleware if an error occurs", async () => {
    const error = new Error("Something went wrong");
    mockCreateUser.mockRejectedValue(error);

    const response = await request(app)
      .post("/v1/auth/register")
      .send(newUser)
      .expect(500);

    expect(response.body.message).toBe("Something went wrong");
  });
});

describe("POST /v1/auth/login", () => {
  const mockLoginUser = loginUser as Mock;

  it("should successfully log in a user and return status 200", async () => {
    const userCredentials = {
      email: "hemant@one.com",
      password: "password123",
    };
    mockLoginUser.mockResolvedValue({
      message: "Login successful",
      accessToken: "jwt_accessToken_example",
      refreshToken: "jwt_refreshToken_example",
    });

    const response = await request(app)
      .post("/v1/auth/login")
      .send(userCredentials)
      .expect(200);

    expect(response.body.message).toBe("Login successful");
    expect(response.body.accessToken).toBe("jwt_accessToken_example");
    expect(response.body.refreshToken).toBe("jwt_refreshToken_example");
  });

  it("should return status 400 if login fails", async () => {
    const userCredentials = {
      email: "hemant@one.com",
      password: "wrongpassword",
    };

    mockLoginUser.mockResolvedValue(null);

    const response = await request(app)
      .post("/v1/auth/login")
      .send(userCredentials)
      .expect(400);

    expect(response.body.message).toBe("Login failed");
  });

  it("should pass error to next middleware if an error occurs", async () => {
    const userCredentials = {
      email: "hemant@one.com",
      password: "password123",
    };

    const error = new Error("Something went wrong during login");

    mockLoginUser.mockRejectedValue(error);

    const response = await request(app)
      .post("/v1/auth/login")
      .send(userCredentials)
      .expect(500);

    expect(response.body.message).toBe("Something went wrong during login");
    expect(response.body.from).toBe("errorHandler");
  });
});

describe("POST /v1/auth/refresh", () => {
  const mockVerifyRefreshJWT = verifyRefreshJWT as Mock;
  const mockFindUser = findUser as Mock;
  it("should return status 403 if refresh token is missing", async () => {
    const response = await request(app)
      .post("/v1/auth/refresh")
      .send({})
      .expect(403);
    expect(response.body.from).toBe("errorHandler");
    expect(response.body.message).toBe('"refreshToken" is required');
  });

  it("should return status 400 if refresh token is invalid", async () => {
    mockVerifyRefreshJWT.mockRejectedValueOnce(new Error("Invalid token."));

    const response = await request(app)
      .post("/v1/auth/refresh")
      .send({ refreshToken: "InvalidToken" });

    expect(response.body.message).toBe("Invalid token.");
    expect(response.body.from).toBe("errorHandler");
  });

  it("should return status 400 if user is not found", async () => {
    const validToken = "valid_refresh_token";
    const userId = "some-valid-user-id";

    mockVerifyRefreshJWT.mockResolvedValue(true);

    mockFindUser.mockResolvedValue(null);

    const response = await request(app)
      .post("/v1/auth/refresh")
      .send({ refreshToken: validToken })
      .set("Authorization", `Bearer ${userId}`)
      .expect(400);

    expect(response.body.message).toBe("User not found");
  });

  it("should return status 400 if refresh token does not match", async () => {
    const validToken = "valid_refresh_token";
    const userId = "some-valid-user-id";

    mockVerifyRefreshJWT.mockResolvedValue(true);

    mockFindUser.mockResolvedValue({
      _id: userId,
      refreshToken: "different_refresh_token",
    });

    const response = await request(app)
      .post("/v1/auth/refresh")
      .send({ refreshToken: validToken })
      .set("Authorization", `Bearer ${userId}`)
      .expect(400);

    expect(response.body.message).toBe("Invalid token. Login required");
  });

  it("should return status 200 and a new access token if refresh is successful", async () => {
    const validToken = "valid_refresh_token";
    const userId = "some-valid-user-id";
    const newAccessToken = "new_access_token_example";

    mockVerifyRefreshJWT.mockResolvedValue(true);

    mockFindUser.mockResolvedValue({
      _id: userId,
      refreshToken: validToken,
    });

    (createAccessJWT as Mock).mockResolvedValue(newAccessToken);

    const response = await request(app)
      .post("/v1/auth/refresh")
      .send({ refreshToken: validToken })
      .set("Authorization", `Bearer ${userId}`)
      .expect(200);

    expect(response.body.message).toBe("Token refreshed successfully");
    expect(response.body.accessToken).toBe(newAccessToken);
  });

  it("should return status 400 if unable to create access token", async () => {
    const validToken = "valid_refresh_token";
    const userId = "some-valid-user-id";

    mockVerifyRefreshJWT.mockResolvedValue(true);

    mockFindUser.mockResolvedValue({
      _id: userId,
      refreshToken: validToken,
    });

    (createAccessJWT as Mock).mockResolvedValue(null);

    const response = await request(app)
      .post("/v1/auth/refresh")
      .send({ refreshToken: validToken })
      .set("Authorization", `Bearer ${userId}`)
      .expect(400);

    expect(response.body.message).toBe("Unable to create token");
  });

  it("should pass the error to the error handler if any unexpected error occurs", async () => {
    const validToken = "valid_refresh_token";
    const userId = "some-valid-user-id";

    mockVerifyRefreshJWT.mockResolvedValue(true);

    mockFindUser.mockRejectedValue(new Error("Unexpected error"));

    const response = await request(app)
      .post("/v1/auth/refresh")
      .send({ refreshToken: validToken })
      .set("Authorization", `Bearer ${userId}`)
      .expect(500);

    expect(response.body.message).toBe("Unexpected error");
    expect(response.body.from).toBe("errorHandler");
  });
});
