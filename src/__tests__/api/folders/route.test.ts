import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/folders/route";
import prisma from "@/__tests__/libs/__mocks__/prisma";
import { auth } from "@clerk/nextjs/server";
import { createMocks } from "node-mocks-http";

vi.mock("@/utils/dbConnect");
vi.mock("@clerk/nextjs/server");

describe("POST /api/folders", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 401 if the user is not authenticated", async () => {
		(auth as vi.Mock).mockReturnValue({ userId: null });

		const { req, res } = createMocks({
			method: "POST",
			body: { name: "Test Folder", parentFolder: null }
		});

		await POST(req, res);

		expect(res.statusCode).toBe(401);
		expect(res._getJSONData()).toEqual({ error: "Unauthorized" });
	});

	it("should return 404 if the parent folder does not exist", async () => {
		(auth as vi.Mock).mockReturnValue({ userId: "user-123" });
		(prisma.folder.findUnique as vi.Mock).mockResolvedValue(null);

		const { req, res } = createMocks({
			method: "POST",
			body: { name: "Test Folder", parentFolder: "non-existent-folder" }
		});

		await POST(req, res);

		expect(res.statusCode).toBe(404);
		expect(res._getJSONData()).toEqual({ error: "Parent folder not found" });
	});

	it("should create a new folder if valid data is provided", async () => {
		(auth as vi.Mock).mockReturnValue({ userId: "user-123" });
		(prisma.folder.findUnique as vi.Mock).mockResolvedValue({
			id: "parent-folder"
		});
		(prisma.folder.create as vi.Mock).mockResolvedValue({
			id: "new-folder",
			name: "Test Folder",
			userId: "user-123",
			parentFolderId: "parent-folder"
		});

		const { req, res } = createMocks({
			method: "POST",
			body: { name: "Test Folder", parentFolder: "parent-folder" }
		});

		await POST(req, res);

		expect(res.statusCode).toBe(201);
		expect(res._getJSONData()).toEqual({
			id: "new-folder",
			name: "Test Folder",
			userId: "user-123",
			parentFolderId: "parent-folder"
		});
	});

	it("should return 500 if there is a server error", async () => {
		(auth as vi.Mock).mockReturnValue({ userId: "user-123" });
		(prisma.folder.create as vi.Mock).mockRejectedValue(
			new Error("Internal server error")
		);

		const { req, res } = createMocks({
			method: "POST",
			body: { name: "Test Folder", parentFolder: null }
		});

		await POST(req, res);

		expect(res.statusCode).toBe(500);
		expect(res._getJSONData()).toEqual({ error: "Internal server error" });
	});

	it("should return 405 if the method is not POST", async () => {
		const { req, res } = createMocks({
			method: "GET"
		});

		await POST(req, res);

		expect(res.statusCode).toBe(405);
		expect(res._getJSONData()).toEqual({ error: "Method not allowed" });
	});
});
