import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/libs/prisma";

export async function POST(req: NextRequest) {
	const { email, password } = await req.json();
	const hashedPassword = await bcrypt.hash(password, 10);

	try {
		const user = await prisma.user.create({
			data: { email, password: hashedPassword }
		});
		return NextResponse.json(
			{ message: "User created", user },
			{ status: 201 }
		);
	} catch (error) {
		return NextResponse.json(
			{ error: "User creation failed" },
			{ status: 400 }
		);
	}
}
