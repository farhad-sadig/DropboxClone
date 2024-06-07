import { describe, test, expect, beforeEach, vi, Mock } from "vitest";
import { createMocks } from "node-mocks-http";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@clerk/nextjs/server";
import {
	validateRequest,
	unauthorizedResponse,
	internalServerErrorResponse
} from "@/libs/helpers";
import { POST, GET, PUT, DELETE } from "@/app/api/folders/route";
import prisma from "@/libs/__mocks__/prisma";

vi.mock("@clerk/nextjs/server");
vi.mock("@/libs/prisma");
vi.mock("@/libs/helpers");

describe("Folder API Handlers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	enum RequestMethod {
		POST = "POST",
		GET = "GET",
		PUT = "PUT",
		DELETE = "DELETE"
	}
	const handlers: Record<
		RequestMethod,
		(req: NextApiRequest, res: NextApiResponse) => Promise<void>
	> = {
		[RequestMethod.POST]: POST,
		[RequestMethod.GET]: GET,
		[RequestMethod.PUT]: PUT,
		[RequestMethod.DELETE]: DELETE
	};

	// Common tests for all methods
	for (const methodKey in handlers) {
		if (Object.prototype.hasOwnProperty.call(handlers, methodKey)) {
			const method = methodKey as RequestMethod;
			const handler = handlers[method];

			describe(`${method} /api/folders - common scenarios`, () => {
				test(`should return 401 if the user is not authenticated (${method})`, async () => {
					(auth as Mock).mockReturnValue({ userId: null });

					const { req, res } = createMocks({
						method,
						body: { folderId: "folder-123" }
					});

					await handler(
						req as unknown as NextApiRequest,
						res as unknown as NextApiResponse
					);

					expect(unauthorizedResponse).toHaveBeenCalledWith(res);
				});

				test(`should return 500 if there is a server error (${method})`, async () => {
					(auth as Mock).mockReturnValue({ userId: "clerk-123" });

					const { req, res } = createMocks({
						method,
						body: { name: "Test Folder", folderId: "folder-123" }
					});

					const error = new Error("Internal server error");

					(validateRequest as Mock).mockRejectedValue(error);

					await handler(
						req as unknown as NextApiRequest,
						res as unknown as NextApiResponse
					);

					expect(internalServerErrorResponse).toHaveBeenCalledWith(error, res);
				});
			});
		}
	}

	// Tests for validateRequest scenarios
	describe("validateRequest - specific scenarios", () => {
		test("should return 404 if user is not found", async () => {
			(auth as Mock).mockReturnValue({ userId: "clerk-123" });

			(validateRequest as Mock).mockResolvedValue({
				error: "User not found",
				statusCode: 404,
				user: null,
				folder: null
			});

			const { req, res } = createMocks({
				method: "GET",
				query: { folderId: "folder-123" }
			});

			await GET(
				req as unknown as NextApiRequest,
				res as unknown as NextApiResponse
			);

			expect(res.statusCode).toBe(404);
			expect(res._getJSONData()).toEqual({ error: "User not found" });
		});

		test("should return 404 if folder is not found", async () => {
			(auth as Mock).mockReturnValue({ userId: "clerk-123" });

			(validateRequest as Mock).mockResolvedValue({
				error: "Folder not found",
				statusCode: 404,
				user: { id: "user-123" },
				folder: null
			});

			const { req, res } = createMocks({
				method: "GET",
				query: { folderId: "folder-123" }
			});

			await GET(
				req as unknown as NextApiRequest,
				res as unknown as NextApiResponse
			);

			expect(res.statusCode).toBe(404);
			expect(res._getJSONData()).toEqual({ error: "Folder not found" });
		});
		test("should return 404 if folder does not belong to the user", async () => {
			(auth as Mock).mockReturnValue({ userId: "clerk-123" });

			(validateRequest as Mock).mockResolvedValue({
				error: "Folder does not belong to the user",
				statusCode: 404,
				user: { id: "user-123" },
				folder: null
			});

			const { req, res } = createMocks({
				method: "GET",
				query: { folderId: "folder-123" }
			});

			await GET(
				req as unknown as NextApiRequest,
				res as unknown as NextApiResponse
			);

			expect(res.statusCode).toBe(404);
			expect(res._getJSONData()).toEqual({
				error: "Folder does not belong to the user"
			});
		});
	});

	describe("POST /api/folders - specific scenarios", () => {
		test("should return 400 if folder name is missing", async () => {
			(auth as Mock).mockReturnValue({ userId: "clerk-123" });

			const { req, res } = createMocks({
				method: "POST",
				body: { parentFolder: null }
			});

			await POST(
				req as unknown as NextApiRequest,
				res as unknown as NextApiResponse
			);

			expect(res.statusCode).toBe(400);
			expect(res._getJSONData()).toEqual({ error: "Folder name is required" });
		});

		test("should create a new folder if valid data is provided", async () => {
			(auth as Mock).mockReturnValue({ userId: "clerk-123" });

			const validationMock = {
				user: { id: "user-123" },
				folder: null,
				error: null
			};

			(validateRequest as Mock).mockResolvedValue(validationMock);

			const { req, res } = createMocks({
				method: "POST",
				body: { name: "Test Folder", parentFolder: null }
			});

			const newFolder = {
				id: "new-folder",
				name: "Test Folder",
				userId: "user-123",
				parentFolderId: null,
				createdAt: new Date().toISOString()
			};

			(prisma.folder.create as Mock).mockResolvedValue(newFolder);

			await POST(
				req as unknown as NextApiRequest,
				res as unknown as NextApiResponse
			);

			expect(res.statusCode).toBe(201);
			expect(res._getJSONData()).toEqual({
				...newFolder,
				createdAt: expect.any(String)
			});
		});
	});

	describe("GET /api/folders - specific scenarios", () => {
		test("should return folder details if valid data is provided", async () => {
			(auth as Mock).mockReturnValue({ userId: "clerk-123" });

			const validationMock = {
				user: { id: "user-123" },
				folder: {
					id: "folder-123",
					name: "Test Folder",
					userId: "user-123",
					parentFolderId: null,
					createdAt: new Date().toISOString()
				},
				error: null
			};

			(validateRequest as Mock).mockResolvedValue(validationMock);

			const { req, res } = createMocks({
				method: "GET",
				query: { folderId: "folder-123" }
			});

			await GET(
				req as unknown as NextApiRequest,
				res as unknown as NextApiResponse
			);

			expect(res.statusCode).toBe(200);
			expect(res._getJSONData()).toEqual({
				...validationMock.folder,
				createdAt: expect.any(String)
			});
		});
	});

	describe("PUT /api/folders - specific scenarios", () => {
		test("should update folder details if valid data is provided", async () => {
			(auth as Mock).mockReturnValue({ userId: "clerk-123" });

			const validationMock = {
				user: { id: "user-123" },
				folder: {
					id: "folder-123",
					name: "Test Folder",
					userId: "user-123",
					parentFolderId: null,
					createdAt: new Date().toISOString()
				},
				error: null
			};

			(validateRequest as Mock).mockResolvedValue(validationMock);

			const { req, res } = createMocks({
				method: "PUT",
				body: {
					folderId: "folder-123",
					name: "Updated Folder",
					parentFolder: null
				}
			});

			const updatedFolder = {
				...validationMock.folder,
				name: "Updated Folder"
			};

			(prisma.folder.update as Mock).mockResolvedValue(updatedFolder);

			await PUT(
				req as unknown as NextApiRequest,
				res as unknown as NextApiResponse
			);

			expect(res.statusCode).toBe(200);
			expect(res._getJSONData()).toEqual({
				...updatedFolder,
				createdAt: expect.any(String)
			});
		});
	});

	describe("DELETE /api/folders - specific scenarios", () => {
		test("should delete the folder if valid data is provided", async () => {
			(auth as Mock).mockReturnValue({ userId: "clerk-123" });

			const validationMock = {
				user: { id: "user-123" },
				folder: {
					id: "folder-123",
					name: "Test Folder",
					userId: "user-123",
					parentFolderId: null,
					createdAt: new Date().toISOString()
				},
				error: null
			};

			(validateRequest as Mock).mockResolvedValue(validationMock);

			const { req, res } = createMocks({
				method: "DELETE",
				body: { folderId: "folder-123" }
			});

			(prisma.folder.delete as Mock).mockResolvedValue(validationMock.folder);

			await DELETE(
				req as unknown as NextApiRequest,
				res as unknown as NextApiResponse
			);

			expect(res.statusCode).toBe(200);
			expect(res._getJSONData()).toEqual({
				message: "Folder deleted successfully"
			});
		});
	});
});
