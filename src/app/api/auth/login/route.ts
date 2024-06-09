import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/libs/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
	const { email, password } = await req.json();

	try {
		const user = await prisma.user.findUnique({ where: { email } });
		if (user && (await bcrypt.compare(password, user.password))) {
			const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
				expiresIn: "1h"
			});
			return NextResponse.json({ message: "Login successful", token });
		} else {
			return NextResponse.json(
				{ error: "Invalid credentials" },
				{ status: 401 }
			);
		}
	} catch (error) {
		return NextResponse.json({ error: "Login failed" }, { status: 400 });
	}
}
