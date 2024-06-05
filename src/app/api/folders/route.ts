import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/libs/prisma";
import { auth } from "@clerk/nextjs/server";
import {
	validateRequest,
	unauthorizedResponse,
	internalServerErrorResponse
} from "@/libs/helpers";

export async function POST(req: NextApiRequest, res: NextApiResponse) {
	const { userId: clerkId } = auth();

	if (!clerkId) {
		return unauthorizedResponse(res);
	}

	const { name, parentFolder } = req.body;

	if (!name) {
		return res.status(400).json({ error: "Folder name is required" });
	}

	try {
		const validation = await validateRequest(clerkId, parentFolder as string);
		if (validation.error) {
			return res
				.status(validation.statusCode)
				.json({ error: validation.error });
		}

		const newFolder = await prisma.folder.create({
			data: {
				userId: validation.user!.id,
				name,
				parentFolderId: parentFolder || null
			}
		});

		res.status(201).json({
			id: newFolder.id,
			name: newFolder.name,
			userId: newFolder.userId,
			parentFolderId: newFolder.parentFolderId,
			createdAt: newFolder.createdAt
		});
	} catch (error) {
		internalServerErrorResponse(error, res);
	}
}

export async function GET(req: NextApiRequest, res: NextApiResponse) {
	const { userId: clerkId } = auth();

	if (!clerkId) {
		return unauthorizedResponse(res);
	}

	const { folderId } = req.query;

	try {
		const validation = await validateRequest(clerkId, folderId as string);
		if (validation.error) {
			return res
				.status(validation.statusCode)
				.json({ error: validation.error });
		}

		res.status(200).json(validation.folder);
	} catch (error) {
		internalServerErrorResponse(error, res);
	}
}

export async function PUT(req: NextApiRequest, res: NextApiResponse) {
	const { userId: clerkId } = auth();

	if (!clerkId) {
		return unauthorizedResponse(res);
	}

	const { folderId, name, parentFolder } = req.body;

	try {
		const validation = await validateRequest(clerkId, folderId as string);
		if (validation.error) {
			return res
				.status(validation.statusCode)
				.json({ error: validation.error });
		}

		const updatedFolder = await prisma.folder.update({
			where: { id: folderId },
			data: {
				name,
				parentFolderId: parentFolder || null
			}
		});

		res.status(200).json(updatedFolder);
	} catch (error) {
		internalServerErrorResponse(error, res);
	}
}

export async function DELETE(req: NextApiRequest, res: NextApiResponse) {
	const { userId: clerkId } = auth();

	if (!clerkId) {
		return unauthorizedResponse(res);
	}

	const { folderId } = req.body;

	try {
		const validation = await validateRequest(clerkId, folderId as string);
		if (validation.error) {
			return res
				.status(validation.statusCode)
				.json({ error: validation.error });
		}

		await prisma.folder.delete({
			where: { id: folderId }
		});

		res.status(200).json({ message: "Folder deleted successfully" });
	} catch (error) {
		internalServerErrorResponse(error, res);
	}
}
