import { it, describe, expect, vi, Mock } from "vitest";
import userAuthorization from "../../src/middlewares/authorization/userAuthorization.middleware.ts";
import { verifyAccessJWT } from "../../src/helper/jwt.helper.ts";
import { getJWT } from "../../src/helper/redis.helper.ts";
import { Request, Response, NextFunction } from "express";

interface CustomRequest extends Request {
  userId?: string;
}

// Mocking the dependencies
vi.mock("../../src/helper/jwt.helper.ts");
vi.mock("../../src/helper/redis.helper.ts");

describe("userAuthorization Middleware", () => {
  const mockRequest = (headers: Record<string, string>) => {
    return {
      header: vi.fn().mockImplementation((key: string) => headers[key]),
    } as unknown as Request;
  };

  const mockResponse = () => {
    const res = {} as Response;
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = vi.fn() as NextFunction;

  it("should extract token from the 'Authorization' header", async () => {
    const req = mockRequest({ Authorization: "Bearer some-jwt-token" });
    const res = mockResponse();

    await userAuthorization(req, res, mockNext);

    expect(req.header).toHaveBeenCalledWith("Authorization");
    expect(req.header).toHaveReturnedWith("Bearer some-jwt-token");
  });

  it("should call the error handler middleware if token is missing", async () => {
    const req = mockRequest({});
    const res = mockResponse();

    await userAuthorization(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 403,
        message: "Access denied, token missing.",
      })
    );
  });

  it("should return an error if the token is invalid", async () => {
    const req = mockRequest({ Authorization: "Bearer invalid-token" });
    const res = mockResponse();
    (verifyAccessJWT as Mock).mockResolvedValue(false);

    await userAuthorization(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token." });
  });

  it("should return an error if the user associated with the token does not exist in the database", async () => {
    const req = mockRequest({ Authorization: "Bearer some-jwt-token" });
    const res = mockResponse();
    (verifyAccessJWT as Mock).mockResolvedValue(true);
    (getJWT as Mock).mockResolvedValue(null);

    await userAuthorization(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid token. User does not exist",
    });
  });

  it("should call the next handler if the token is valid and user exists", async () => {
    const req = mockRequest({
      Authorization: "Bearer some-jwt-token",
    }) as CustomRequest;
    const res = mockResponse();
    const mockUserId = "user-id";
    (verifyAccessJWT as Mock).mockResolvedValue(true);
    (getJWT as Mock).mockResolvedValue(mockUserId);

    await userAuthorization(req, res, mockNext);

    expect(req.userId).toBe(mockUserId);
    expect(mockNext).toHaveBeenCalled();
  });

  it("should call the error handler middleware if an error occurs during the verification process", async () => {
    const req = mockRequest({ Authorization: "Bearer some-jwt-token" });
    const res = mockResponse();
    (verifyAccessJWT as Mock).mockRejectedValue(new Error("Some error"));

    await userAuthorization(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Some error" })
    );
  });
});
