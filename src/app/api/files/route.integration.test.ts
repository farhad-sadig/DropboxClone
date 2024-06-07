import { createMocks } from "node-mocks-http";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/files/route";
import prisma from "@/libs/prisma";
import AWS from "aws-sdk";
import { resetDb } from "@/libs/helpers";
import clerkWebhookHandler from "../clerkWebhook";

// Load environment variables from .env.test
require("dotenv").config({ path: ".env.test" });

// Configure AWS SDK (automatically uses credentials from env variables or IAM roles)
AWS.config.update({
	region: process.env.AWS_REGION
});

describe("Integration Tests for POST /api/files", () => {
	beforeEach(async () => {
		await resetDb();
	});

	afterEach(async () => {
		await resetDb();
	});

	const registerUser = async () => {
		const { req, res } = createMocks({
			method: "POST",
			body: {
				type: "user.created",
				data: {
					id: "user123",
					email_addresses: [{ email_address: "testuser@example.com" }]
				}
			}
		});

		await clerkWebhookHandler(req, res);
		expect(res._getStatusCode()).toBe(201);
	};

	it("should create a new file", async () => {
		// Register a user via the Clerk webhook
		await registerUser();

		// Fetch the registered user
		const testUser = await prisma.user.findUnique({
			where: { id: "user123" }
		});
		expect(testUser).toBeDefined();

		// Mock a request and response
		const { req, res } = createMocks({
			method: "POST",
			body: {
				name: "testfile.txt",
				folderId: null,
				file: "base64string" // Base64 encoded content
			}
		});

		// Simulate user authentication
		req.headers = {
			authorization: `Bearer ${testUser.id}`
		};

		await POST(req, res);

		expect(res._getStatusCode()).toBe(201);
		const response = JSON.parse(res._getData());
		expect(response).toHaveProperty("id");
		expect(response).toHaveProperty("name", "testfile.txt");
		expect(response).toHaveProperty("url");

		// Verify the file exists in S3
		const s3 = new AWS.S3();
		const headObjectResponse = await s3
			.headObject({
				Bucket: process.env.AWS_S3_BUCKET_NAME!,
				Key: `files/${testUser.id}/${response.name}`
			})
			.promise();
		expect(headObjectResponse).toBeDefined();
	});

	it("should return 400 if name or file is missing", async () => {
		// Register a user via the Clerk webhook
		await registerUser();

		// Fetch the registered user
		const testUser = await prisma.user.findUnique({
			where: { id: "user123" }
		});
		expect(testUser).toBeDefined();

		const { req, res } = createMocks({
			method: "POST",
			body: {
				name: "",
				folderId: "folder123",
				file: ""
			}
		});

		req.headers = {
			authorization: `Bearer ${testUser.id}`
		};

		await POST(req, res);

		expect(res._getStatusCode()).toBe(400);
		const response = JSON.parse(res._getData());
		expect(response).toHaveProperty(
			"error",
			"File name and file content are required"
		);
	});

	it("should handle validation errors", async () => {
		// Register a user via the Clerk webhook
		await registerUser();

		// Fetch the registered user
		const testUser = await prisma.user.findUnique({
			where: { id: "user123" }
		});
		expect(testUser).toBeDefined();

		const { req, res } = createMocks({
			method: "POST",
			body: {
				name: "testfile.txt",
				folderId: "invalid-folder-id",
				file: "base64string"
			}
		});

		req.headers = {
			authorization: `Bearer ${testUser.id}`
		};

		await POST(req, res);

		expect(res._getStatusCode()).toBe(400);
		const response = JSON.parse(res._getData());
		expect(response).toHaveProperty("error");
	});

	it("should handle server errors", async () => {
		// Register a user via the Clerk webhook
		await registerUser();

		// Fetch the registered user
		const testUser = await prisma.user.findUnique({
			where: { id: "user123" }
		});
		expect(testUser).toBeDefined();

		const { req, res } = createMocks({
			method: "POST",
			body: {
				name: "testfile.txt",
				folderId: "folder123",
				file: "base64string"
			}
		});

		req.headers = {
			authorization: `Bearer ${testUser.id}`
		};

		// Simulate a server error by causing Prisma to throw an error
		prisma.file.create = async () => {
			throw new Error("Database error");
		};

		await POST(req, res);

		expect(res._getStatusCode()).toBe(500);
		const response = JSON.parse(res._getData());
		expect(response).toHaveProperty("error");
	});
});
