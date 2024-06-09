import {  NextResponse } from "next/server";
import prisma from "@/libs/prisma";

export async function validateRequest(userId: string, folderId: string) {
	const validation = await validateUserAndFolder(userId, folderId);
	if (validation.error) {
		return {
			error: validation.error,
			statusCode: 404,
			user: null,
			folder: null
		};
	}
	return { statusCode: 200, ...validation };
}

export function unauthorizedResponse() {
	return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function internalServerErrorResponse(error: any) {
	console.error(error);
	return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

async function validateUser(userId: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId }
	});
	if (!user) {
		return { error: "User not found", user: null };
	}
	return { error: null, user };
}

async function validateFolder(userId: string, folderId: string) {
	const folder = await prisma.folder.findUnique({
		where: { id: folderId }
	});
	if (!folder) {
		return { error: "Folder not found", folder: null };
	}
	if (folder.userId !== userId) {
		return { error: "Folder does not belong to the user", folder: null };
	}
	return { error: null, folder };
}

export async function validateUserAndFolder(userId: string, folderId: string) {
	const userValidation = await validateUser(userId);
	if (userValidation.error) {
		return { error: userValidation.error, user: null, folder: null };
	}
	const user = userValidation.user!;

	const folderValidation = await validateFolder(user.id, folderId);
	if (folderValidation.error) {
		return { error: folderValidation.error, user, folder: null };
	}

	return { error: null, user, folder: folderValidation.folder };
}

export async function resetDb() {
	await prisma.$transaction([
		prisma.user.deleteMany(),
		prisma.folder.deleteMany(),
		prisma.file.deleteMany()
	]);
}
