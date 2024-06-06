import { POST } from "@/app/api/files/route";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/libs/__mocks__/prisma";
import { auth } from "@clerk/nextjs/server";
import { uploadFile } from "@/utils/s3";
import {
	validateRequest,
	unauthorizedResponse,
	internalServerErrorResponse
} from "@/libs/helpers";

import { vi, describe, it, expect, beforeEach, Mock } from "vitest";

// Mock dependencies
vi.mock("@clerk/nextjs/server");
vi.mock("@/utils/s3");
vi.mock("@/libs/helpers");
vi.mock("@/libs/prisma");

describe("POST /api/files", () => {
	let req: Partial<NextApiRequest>;
	let res: Partial<NextApiResponse>;
	let json: Mock;

	beforeEach(() => {
		req = {
			method: "POST",
			body: {
				name: "testfile.txt",
				folderId: "folder123",
				file: "base64string"
			}
		};

		json = vi.fn();
		res = {
			status: vi.fn().mockReturnValue({ json })
		};

		(auth as Mock).mockReturnValue({ userId: "clerk123" });
		(validateRequest as Mock).mockResolvedValue({ user: { id: "user123" } });
		(uploadFile as Mock).mockResolvedValue({ Location: "s3://bucket/file" });
		prisma.file.create = vi.fn().mockResolvedValue({
			id: "file123",
			name: "testfile.txt",
			userId: "user123",
			folderId: "folder123",
			url: "s3://bucket/file",
			createdAt: new Date()
		});
	});

	it("should return 401 if the user is not authenticated", async () => {
		(auth as Mock).mockReturnValue(null);

		await POST(req as NextApiRequest, res as NextApiResponse);

		expect(unauthorizedResponse).toHaveBeenCalledWith(res);
	});

	it("should return 400 if name or file is missing", async () => {
		req.body = { name: "", file: "" };

		await POST(req as NextApiRequest, res as NextApiResponse);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(json).toHaveBeenCalledWith({
			error: "File name and file content are required"
		});
	});

	it("should handle validation errors", async () => {
		(validateRequest as Mock).mockResolvedValue({
			error: "Validation error",
			statusCode: 400
		});

		await POST(req as NextApiRequest, res as NextApiResponse);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(json).toHaveBeenCalledWith({ error: "Validation error" });
	});

	it("should upload file and create record in the database", async () => {
		await POST(req as NextApiRequest, res as NextApiResponse);

		expect(uploadFile).toHaveBeenCalled();
		expect(prisma.file.create).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(201);
		expect(json).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "file123",
				name: "testfile.txt",
				userId: "user123",
				folderId: "folder123",
				url: "s3://bucket/file"
			})
		);
	});

	it("should handle server errors", async () => {
		(prisma.file.create as Mock).mockRejectedValue(new Error("Database error"));

		await POST(req as NextApiRequest, res as NextApiResponse);

		expect(internalServerErrorResponse).toHaveBeenCalledWith(
			new Error("Database error"),
			res
		);
	});
});
