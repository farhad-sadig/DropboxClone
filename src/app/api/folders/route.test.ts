import { describe, test, expect, beforeEach, vi, Mock } from "vitest";
import { createMocks } from "node-mocks-http";
import { POST } from "@/app/api/folders/route";
import prisma from "@/libs/__mocks__/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

vi.mock("@clerk/nextjs/server");
vi.mock("@/libs/prisma");

import { auth } from "@clerk/nextjs/server"; // Import the mocked auth function

describe("POST /api/folders", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(auth as Mock).mockReturnValue({ userId: "clerk-123" });
		(prisma.user.findUnique as Mock).mockResolvedValue({
			id: "user-123",
			clerkId: "clerk-123",
			email: "test@example.com",
			createdAt: new Date()
		});
	});

	test("should return 401 if the user is not authenticated", async () => {
		(auth as Mock).mockReturnValue({ userId: null });

		const { req, res } = createMocks({
			method: "POST",
			body: { name: "Test Folder", parentFolder: null }
		});

		await POST(
			req as unknown as NextApiRequest,
			res as unknown as NextApiResponse
		);

		expect(res.statusCode).toBe(401);
		expect(res._getJSONData()).toEqual({ error: "Unauthorized" });
	});

	test("should return 404 if the user does not exist", async () => {
		(auth as Mock).mockReturnValue({ userId: "non-existent-clerkId" });
		(prisma.user.findUnique as Mock).mockResolvedValue(null);

		const { req, res } = createMocks({
			method: "POST",
			body: { name: "Test Folder", parentFolder: null }
		});

		await POST(
			req as unknown as NextApiRequest,
			res as unknown as NextApiResponse
		);

		expect(res.statusCode).toBe(404);
		expect(res._getJSONData()).toEqual({ error: "User not found" });
	});

	test("should return 404 if the provided parent folder does not exist", async () => {
		(prisma.folder.findUnique as Mock).mockResolvedValue(null);

		const { req, res } = createMocks({
			method: "POST",
			body: { name: "Test Folder", parentFolder: "non-existent-folder" }
		});

		await POST(
			req as unknown as NextApiRequest,
			res as unknown as NextApiResponse
		);

		expect(res.statusCode).toBe(404);
		expect(res._getJSONData()).toEqual({ error: "Parent folder not found" });
	});

	test("should create a new folder if valid data is provided", async () => {
		(prisma.folder.findUnique as Mock).mockResolvedValue({
			id: "parent-folder",
			userId: "user-123",
			name: "Parent Folder",
			parentFolderId: null,
			createdAt: new Date(),
			subFolders: [],
			files: []
		});

		(prisma.folder.create as Mock).mockResolvedValue({
			id: "new-folder",
			name: "Test Folder",
			userId: "user-123",
			parentFolderId: "parent-folder",
			createdAt: new Date(),
			subFolders: [],
			files: []
		});

		const { req, res } = createMocks({
			method: "POST",
			body: { name: "Test Folder", parentFolder: "parent-folder" }
		});

		await POST(
			req as unknown as NextApiRequest,
			res as unknown as NextApiResponse
		);

		expect(res.statusCode).toBe(201);
		expect(res._getJSONData()).toEqual({
			id: "new-folder",
			name: "Test Folder",
			userId: "user-123",
			parentFolderId: "parent-folder",
			createdAt: expect.any(String)
		});
	});

	test("should create a new root-level folder if no parent folder is provided", async () => {
		const newFolder = {
			id: "root-folder",
			name: "Root Folder",
			userId: "user-123",
			parentFolderId: null,
			createdAt: new Date()
		};

		(prisma.folder.create as Mock).mockResolvedValue(newFolder);

		const { req, res } = createMocks({
			method: "POST",
			body: { name: "Root Folder", parentFolder: null }
		});

		await POST(
			req as unknown as NextApiRequest,
			res as unknown as NextApiResponse
		);

		expect(res.statusCode).toBe(201);
		expect(res._getJSONData()).toEqual({
			id: "root-folder",
			name: "Root Folder",
			userId: "user-123",
			parentFolderId: null,
			createdAt: expect.any(String)
		});
	});

	test("should return 500 if there is a server error", async () => {
		(prisma.folder.create as Mock).mockRejectedValue(
			new Error("Internal server error")
		);

		const { req, res } = createMocks({
			method: "POST",
			body: { name: "Test Folder", parentFolder: null }
		});

		await POST(
			req as unknown as NextApiRequest,
			res as unknown as NextApiResponse
		);

		expect(res.statusCode).toBe(500);
		expect(res._getJSONData()).toEqual({ error: "Internal server error" });
	});

	test("should return 400 if name is missing", async () => {
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

	test("should handle database connection issues gracefully", async () => {
		(prisma.user.findUnique as Mock).mockRejectedValue(
			new Error("Database connection error")
		);

		const { req, res } = createMocks({
			method: "POST",
			body: { name: "Test Folder", parentFolder: null }
		});

		await POST(
			req as unknown as NextApiRequest,
			res as unknown as NextApiResponse
		);

		expect(res.statusCode).toBe(500);
		expect(res._getJSONData()).toEqual({ error: "Internal server error" });
	});
});
