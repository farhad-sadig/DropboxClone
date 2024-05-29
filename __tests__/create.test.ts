import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import Folder from "@/models/Folder";
import { getAuth } from "@clerk/nextjs/server";
import { POST } from "@/app/api/folders/create";

jest.mock("@/utils/dbConnect");
jest.mock("@/models/Folder");
jest.mock("@clerk/nextjs/server");

describe("POST /api/create", () => {
	let req: Partial<NextApiRequest>;
	let res: Partial<NextApiResponse>;
	let status: jest.Mock;
	let json: jest.Mock;

	beforeEach(() => {
		req = {
			method: "POST",
			body: {}
		};
		status = jest.fn().mockReturnThis();
		json = jest.fn();
		res = {
			status,
			json
		};
	});

	it("should return 401 if user is not authenticated", async () => {
		(getAuth as jest.Mock).mockReturnValue({ userId: null });

		await POST(req as NextApiRequest, res as NextApiResponse);

		expect(status).toHaveBeenCalledWith(401);
		expect(json).toHaveBeenCalledWith("Unauthorized");
	});

	it("should return 201 and create a new folder", async () => {
		const userId = "testUserId";
		(getAuth as jest.Mock).mockReturnValue({ userId });
		(dbConnect as jest.Mock).mockResolvedValue({});
		req.body = {
			name: "New Folder"
		};
		const saveMock = jest.fn().mockResolvedValue({});
		const newFolderMock = jest.fn().mockReturnValue({
			save: saveMock
		});
		(Folder as unknown as jest.Mock).mockImplementation(() => {
			return newFolderMock();
		});

		await POST(req as NextApiRequest, res as NextApiResponse);

		expect(status).toHaveBeenCalledWith(201);
		expect(json).toHaveBeenCalled();
	});

	it("should return 404 if parent folder is not found", async () => {
		const userId = "testUserId";
		(getAuth as jest.Mock).mockReturnValue({ userId });
		(dbConnect as jest.Mock).mockResolvedValue({});
		req.body = {
			name: "New Folder",
			parentFolder: "nonExistingParentId"
		};
		(Folder.findById as jest.Mock).mockResolvedValue(null);

		await POST(req as NextApiRequest, res as NextApiResponse);

		expect(status).toHaveBeenCalledWith(404);
		expect(json).toHaveBeenCalledWith({ error: "Parent folder not found" });
	});

	it("should return 405 if method is not POST", async () => {
		req.method = "GET";

		await POST(req as NextApiRequest, res as NextApiResponse);

		expect(status).toHaveBeenCalledWith(405);
		expect(json).toHaveBeenCalledWith({ error: "Method not allowed" });
	});
});
