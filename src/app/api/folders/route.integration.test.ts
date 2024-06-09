import { describe, test, expect, beforeEach, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { POST, GET, PUT, DELETE } from "./route";
import { mockRequest, mockResponse } from "@/utils/test-utils";
import jwt, { JwtPayload } from "jsonwebtoken";
import prisma from "@/libs/__mocks__/prisma";
import { validateRequest } from "@/libs/helpers";

// Mock necessary modules
vi.mock("@/libs/prisma");
vi.mock("@/libs/helpers");

const JWT_SECRET = process.env.JWT_SECRET || "test_secret";

const mockUser = {
	id: "user-123",
	email: "test@example.com",
	password: "hashedpassword",
	createdAt: new Date()
};

const mockFolder = {
	id: "existing-folder",
	name: "Existing Folder",
	userId: "user-123",
	parentFolderId: null,
	createdAt: new Date().toISOString()
};

describe("Folder API Handlers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("POST /api/folders", () => {
		test("should return 400 if the request body is null", async () => {
			const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET);
			const req = mockRequest("http://localhost/api/folders", "POST", null, {
				authorization: `Bearer ${token}`
			});
			const res = mockResponse();
			const mockPayload: JwtPayload = { userId: "user-123" };
			vi.spyOn(jwt, "verify").mockImplementation(() => mockPayload);
			prisma.user.findUnique.mockResolvedValue(mockUser);

			const result = await POST(req, res);

			expect(result.status).toBe(400);
			const json = await result.json();
			expect(json.error).toBe("Folder name is required");
		});

		test("should return 400 if folder name is missing", async () => {
			const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET);
			const req = mockRequest(
				"http://localhost/api/folders",
				"POST",
				{ parentFolder: null },
				{
					authorization: `Bearer ${token}`
				}
			);
			const res = mockResponse();
			const mockPayload: JwtPayload = { userId: "user-123" };
			vi.spyOn(jwt, "verify").mockImplementation(() => mockPayload);
			prisma.user.findUnique.mockResolvedValue(mockUser);

			const result = await POST(req, res);

			expect(result.status).toBe(400);
			const json = await result.json();
			expect(json.error).toBe("Folder name is required");
		});

		test("should create a new folder if valid data is provided", async () => {
			const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET);
			const req = mockRequest(
				"http://localhost/api/folders",
				"POST",
				{ name: "Test Folder", parentFolder: null },
				{
					authorization: `Bearer ${token}`
				}
			);
			const res = mockResponse();
			const mockPayload: JwtPayload = { userId: "user-123" };
			vi.spyOn(jwt, "verify").mockImplementation(() => mockPayload);
			prisma.user.findUnique.mockResolvedValue(mockUser);

			// Mock the validateRequest function to always return a successful validation
			vi.mocked(validateRequest).mockResolvedValue({
				error: null,
				statusCode: 200,
				user: mockUser,
				folder: null
			});

			const newFolder = {
				id: "new-folder",
				name: "Test Folder",
				userId: "user-123",
				parentFolderId: null,
				createdAt: new Date().toISOString()
			};

			prisma.folder.create.mockResolvedValue(newFolder);

			const result = await POST(req, res);

			expect(result.status).toBe(201);
			const json = await result.json();
			expect(json.name).toBe("Test Folder");
		});
	});

	describe("GET /api/folders", () => {
		test("should return 401 if the user is not authenticated", async () => {
			const req = mockRequest("http://localhost/api/folders", "GET");
			const res = mockResponse();

			const result = await GET(req, res);

			expect(result.status).toBe(401);
			const json = await result.json();
			expect(json.message).toBe("No token provided");
		});

		test("should return 401 if the token is invalid", async () => {
			const req = mockRequest("http://localhost/api/folders", "GET", null, {
				authorization: "Bearer invalidtoken"
			});
			const res = mockResponse();

			vi.spyOn(jwt, "verify").mockImplementation(() => {
				throw new jwt.JsonWebTokenError("Invalid token");
			});

			const result = await GET(req, res);

			expect(result.status).toBe(401);
			const json = await result.json();
			expect(json.message).toBe("Invalid token");
		});

		test("should return 404 if the folder is not found", async () => {
			const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET);
			const req = mockRequest(
				"http://localhost/api/folders?folderId=nonexistent-folder",
				"GET",
				null,
				{
					authorization: `Bearer ${token}`
				}
			);

			prisma.user.findUnique.mockResolvedValue(mockUser);
			prisma.folder.findUnique.mockResolvedValue(null);

			const res = mockResponse();
			const mockPayload: JwtPayload = { userId: "user-123" };
			vi.spyOn(jwt, "verify").mockImplementation(() => mockPayload);

			const result = await GET(req, res);

			expect(result.status).toBe(404);
			const json = await result.json();
			expect(json.error).toBe("Folder not found");
		});

		test("should return the folder details if the folder is found", async () => {
			const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET);
			const req = mockRequest(
				"http://localhost/api/folders?folderId=existing-folder",
				"GET",
				null,
				{
					authorization: `Bearer ${token}`
				}
			);

			prisma.user.findUnique.mockResolvedValue(mockUser);
			prisma.folder.findUnique.mockResolvedValue(mockFolder);

			const res = mockResponse();

			const result = await GET(req, res);

			expect(result.status).toBe(200);
			const json = await result.json();
			expect(json.name).toBe("Existing Folder");
		});
	});

	describe("PUT /api/folders", () => {
		test("should return 401 if the user is not authenticated", async () => {
			const req = mockRequest("http://localhost/api/folders", "PUT");
			const res = mockResponse();

			const result = await PUT(req, res);

			expect(result.status).toBe(401);
			const json = await result.json();
			expect(json.message).toBe("No token provided");
		});

		test("should return 401 if the token is invalid", async () => {
			const req = mockRequest("http://localhost/api/folders", "PUT", null, {
				authorization: "Bearer invalidtoken"
			});
			const res = mockResponse();

			vi.spyOn(jwt, "verify").mockImplementation(() => {
				throw new jwt.JsonWebTokenError("Invalid token");
			});

			const result = await PUT(req, res);

			expect(result.status).toBe(401);
			const json = await result.json();
			expect(json.message).toBe("Invalid token");
		});

		test("should return 404 if the folder is not found", async () => {
			const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET);
			const req = mockRequest(
				"http://localhost/api/folders",
				"PUT",
				{
					folderId: "nonexistent-folder",
					name: "Updated Folder",
					parentFolder: null
				},
				{
					authorization: `Bearer ${token}`
				}
			);
			const res = mockResponse();

			prisma.user.findUnique.mockResolvedValue(mockUser);
			prisma.folder.findUnique.mockResolvedValue(null);

			const result = await PUT(req, res);

			expect(result.status).toBe(404);
			const json = await result.json();
			expect(json.error).toBe("Folder not found");
		});

		test("should update the folder details if valid data is provided", async () => {
			const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET);
			const req = mockRequest(
				"http://localhost/api/folders",
				"PUT",
				{
					folderId: "existing-folder",
					name: "Updated Folder",
					parentFolder: null
				},
				{
					authorization: `Bearer ${token}`
				}
			);
			const res = mockResponse();

			prisma.user.findUnique.mockResolvedValue(mockUser);
			prisma.folder.findUnique.mockResolvedValue(mockFolder);

			const updatedFolder = {
				...mockFolder,
				name: "Updated Folder"
			};

			prisma.folder.update.mockResolvedValue(updatedFolder);

			const result = await PUT(req, res);

			expect(result.status).toBe(200);
			const json = await result.json();
			expect(json.name).toBe("Updated Folder");
		});
	});

	describe("DELETE /api/folders", () => {
		test("should return 401 if the user is not authenticated", async () => {
			const req = mockRequest("http://localhost/api/folders", "DELETE");
			const res = mockResponse();

			const result = await DELETE(req, res);

			expect(result.status).toBe(401);
			const json = await result.json();
			expect(json.message).toBe("No token provided");
		});

		test("should return 401 if the token is invalid", async () => {
			const req = mockRequest("http://localhost/api/folders", "DELETE", null, {
				authorization: "Bearer invalidtoken"
			});
			const res = mockResponse();

			vi.spyOn(jwt, "verify").mockImplementation(() => {
				throw new jwt.JsonWebTokenError("Invalid token");
			});

			const result = await DELETE(req, res);

			expect(result.status).toBe(401);
			const json = await result.json();
			expect(json.message).toBe("Invalid token");
		});

		test("should return 404 if the folder is not found", async () => {
			const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET);
			const req = mockRequest(
				"http://localhost/api/folders",
				"DELETE",
				{ folderId: "nonexistent-folder" },
				{
					authorization: `Bearer ${token}`
				}
			);
			const res = mockResponse();

			prisma.user.findUnique.mockResolvedValue(mockUser);
			prisma.folder.findUnique.mockResolvedValue(null);

			const result = await DELETE(req, res);

			expect(result.status).toBe(404);
			const json = await result.json();
			expect(json.error).toBe("Folder not found");
		});

		test("should delete the folder if valid data is provided", async () => {
			const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET);
			const req = mockRequest(
				"http://localhost/api/folders",
				"DELETE",
				{ folderId: "existing-folder" },
				{
					authorization: `Bearer ${token}`
				}
			);
			const res = mockResponse();

			prisma.user.findUnique.mockResolvedValue(mockUser);
			prisma.folder.findUnique.mockResolvedValue(mockFolder);

			prisma.folder.delete.mockResolvedValue(mockFolder);

			const result = await DELETE(req, res);

			expect(result.status).toBe(200);
			const json = await result.json();
			expect(json.message).toBe("Folder deleted successfully");
		});
	});
});
