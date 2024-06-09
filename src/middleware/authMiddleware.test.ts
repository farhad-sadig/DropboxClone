import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "@prisma/client";

import authMiddleware from "./authMiddleware";
import prisma from "@/libs/__mocks__/prisma";

vi.mock("@/libs/prisma");

describe("authMiddleware", () => {
	let handler: (req: NextRequest, res: NextResponse) => Promise<NextResponse>;
	let req: NextRequest;
	let res: NextResponse;

	beforeEach(() => {
		handler = vi.fn(async (req, res) => res);
		req = new NextRequest(new Request("http://localhost"));
		res = new NextResponse();
	});

	it("should return 401 if no token is provided", async () => {
		const result = await authMiddleware(handler)(req, res);
		expect(result.status).toBe(401);
		const json = await result.json();
		expect(json.message).toBe("Unauthorized");
	});

	it("should return 401 if token is invalid", async () => {
		req.headers.set("authorization", "Bearer invalidtoken");
		vi.spyOn(jwt, "verify").mockImplementation(() => {
			throw new Error("Invalid token");
		});

		const result = await authMiddleware(handler)(req, res);
		expect(result.status).toBe(401);
		const json = await result.json();
		expect(json.message).toBe("Invalid token");
	});

	it("should call handler if token is valid", async () => {
		const mockUser: User = {
			id: "1",
			email: "test@example.com",
			password: "hashedpassword",
			createdAt: new Date()
		};
		const mockPayload: JwtPayload = { userId: "1" };
		vi.spyOn(jwt, "verify").mockImplementation(() => mockPayload);
		prisma.user.findUnique.mockResolvedValue(mockUser);

		req.headers.set("authorization", "Bearer validtoken");
		await authMiddleware(handler)(req, res);

		expect(handler).toHaveBeenCalled();
	});
});
