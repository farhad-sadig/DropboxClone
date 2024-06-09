import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import prisma from "@/libs/prisma";

const JWT_SECRET = process.env.JWT_SECRET!;

const authMiddleware =
	(handler: (req: NextRequest, res: NextResponse) => Promise<NextResponse>) =>
	async (req: NextRequest, res: NextResponse) => {
		const token = req.headers.get("authorization")?.split(" ")[1];

		if (!token) {
			return NextResponse.json(
				{ message: "No token provided" },
				{ status: 401 }
			);
		}

		try {
			const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & {
				userId: string;
			};
			const user = await prisma.user.findUnique({
				where: { id: decoded.userId }
			});

			if (!user) {
				return NextResponse.json(
					{ message: "User not found" },
					{ status: 401 }
				);
			}

			req.user = user;
			return handler(req, res);
		} catch (error) {
			if (error instanceof jwt.JsonWebTokenError) {
				return NextResponse.json({ message: "Invalid token" }, { status: 401 });
			}
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}
	};

export default authMiddleware;
