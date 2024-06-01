import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { auth } from "@clerk/nextjs/server";
import { createMocks } from "node-mocks-http";
import { POST } from "@/app/api/folders/route";
import prisma from "@/__tests__/libs/__mocks__/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

vi.mock("@/utils/dbConnect");
vi.mock("@clerk/nextjs/server");

describe("POST /api/folders", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 401 if the user is not authenticated", async () => {
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

	it("should return 404 if the parent folder does not exist", async () => {
		(auth as Mock).mockReturnValue({ userId: "user-123" });
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

	it("should create a new folder if valid data is provided", async () => {
		(auth as Mock).mockReturnValue({ userId: "user-123" });
		(prisma.folder.findUnique as Mock).mockResolvedValue({
			id: "parent-folder"
		});
		(prisma.folder.create as Mock).mockResolvedValue({
			name: "Test Folder",
			userId: "user-123",
			parentFolderId: "parent-folder"
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
			name: "Test Folder",
			userId: "user-123",
			parentFolderId: "parent-folder"
		});
	});

	it("should create a new root-level folder if no parent folder is provided", async () => {
		(auth as Mock).mockReturnValue({ userId: "user-123" });
		(prisma.folder.create as Mock).mockResolvedValue({
			name: "Root Folder",
			userId: "user-123",
			parentFolderId: null
		});

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
			name: "Root Folder",
			userId: "user-123",
			parentFolderId: null
		});
	});

	it("should return 500 if there is a server error", async () => {
		(auth as Mock).mockReturnValue({ userId: "user-123" });
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

	// test("should return 405 if the method is not POST", async () => {
	// 	const { req, res } = createMocks({
	// 		method: "GET"
	// 	});

	// 	await POST(
	// 		req as unknown as NextApiRequest,
	// 		res as unknown as NextApiResponse
	// 	);

	// 	expect(res.statusCode).toBe(405);
	// 	expect(res._getJSONData()).toEqual({ error: "Method not allowed" });
	// });
});
