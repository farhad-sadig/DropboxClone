import {
	describe,
	it,
	expect,
	beforeAll,
	afterAll,
	beforeEach,
	afterEach
} from "vitest";
import { createServer } from "http";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/webhooks/route";
import prisma from "@/libs/prisma";
import { resetDb } from "@/libs/helpers";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

describe("Integration Tests for Clerk Webhook", () => {
	let server: any;

	beforeAll(() => {
		server = createServer((req, res) => {
			if (req.url === "/api/clerk-webhook" && req.method === "POST") {
				const bodyChunks: Uint8Array[] = [];
				req.on("data", (chunk) => bodyChunks.push(chunk));
				req.on("end", async () => {
					const body = Buffer.concat(bodyChunks).toString();
					const headers: Record<string, string> = {};
					req.rawHeaders.forEach((value, index, array) => {
						if (index % 2 === 0) {
							headers[array[index].toLowerCase()] = array[index + 1];
						}
					});

					const nextRequest = new NextRequest(
						"http://localhost:3000/api/clerk-webhook",
						{
							method: "POST",
							headers,
							body
						}
					);

					const nextResponse = await POST(nextRequest);
					res.statusCode = nextResponse.status;
					nextResponse.headers.forEach((value, name) =>
						res.setHeader(name, value)
					);
					const text = await nextResponse.text();
					res.end(text);
				});
			} else {
				res.statusCode = 404;
				res.end();
			}
		});

		server.listen(3000, () => {
			console.log("Test server running on port 3000");
		});
	});

	afterAll(() => {
		server.close();
	});

	beforeEach(async () => {
		await resetDb();
	});

	afterEach(async () => {
		await resetDb();
	});

	it("should create a new user via Clerk webhook", async () => {
		const body = {
			type: "user.created",
			data: {
				id: "user_29w83sxmDNGwOuEthce5gg56FcC",
				email_addresses: [{ email_address: "example@example.org" }],
				created_at: 1654012591514
			}
		};

		const payload = JSON.stringify(body);

		const response = await fetch("http://localhost:3000/api/clerk-webhook", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"svix-id": "test-id",
				"svix-timestamp": Date.now().toString(),
				"svix-signature": "test-signature",
				"x-webhook-secret": WEBHOOK_SECRET!
			},
			body: payload
		});

		expect(response.status).toBe(201);

		const user = await prisma.user.findUnique({
			where: { clerkId: "user_29w83sxmDNGwOuEthce5gg56FcC" }
		});
		expect(user).toBeDefined();
		expect(user?.email).toBe("example@example.org");
	});

	it("should update an existing user via Clerk webhook", async () => {
		// First, create the user
		await prisma.user.create({
			data: {
				clerkId: "user_29w83sxmDNGwOuEthce5gg56FcC",
				email: "old@example.org",
				createdAt: new Date(1654012591514)
			}
		});

		const body = {
			type: "user.updated",
			data: {
				id: "user_29w83sxmDNGwOuEthce5gg56FcC",
				email_addresses: [{ email_address: "updated@example.org" }],
				created_at: 1654012591514,
				updated_at: 1654012824306
			}
		};

		const payload = JSON.stringify(body);

		const response = await fetch("http://localhost:3000/api/clerk-webhook", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"svix-id": "test-id",
				"svix-timestamp": Date.now().toString(),
				"svix-signature": "test-signature",
				"x-webhook-secret": WEBHOOK_SECRET!
			},
			body: payload
		});

		expect(response.status).toBe(201);

		const user = await prisma.user.findUnique({
			where: { clerkId: "user_29w83sxmDNGwOuEthce5gg56FcC" }
		});
		expect(user).toBeDefined();
		expect(user?.email).toBe("updated@example.org");
	});
});
