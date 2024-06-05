import { NextApiResponse } from "next";
import prisma from "@/libs/prisma";

export async function validateRequest(
	clerkId: string,
	folderId: string,
	res: NextApiResponse
) {
	const validation = await validateUserAndFolder(clerkId, folderId);
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

export function unauthorizedResponse(res: NextApiResponse) {
	res.status(401).json({ error: "Unauthorized" });
}

export function internalServerErrorResponse(error: any, res: NextApiResponse) {
	console.error(error);
	res.status(500).json({ error: "Internal server error" });
}

async function validateUser(clerkId: string) {
	const user = await prisma.user.findUnique({
		where: { clerkId }
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

export async function validateUserAndFolder(clerkId: string, folderId: string) {
	const userValidation = await validateUser(clerkId);
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
