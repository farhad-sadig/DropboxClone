import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/libs/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextApiRequest, res: NextApiResponse) {
	const { userId: clerkId } = auth();

	if (!clerkId) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const { name, parentFolder } = req.body;

	if (!name) {
		return res.status(400).json({ error: "Folder name is required" });
	}
	try {
		// Ensure the user exists
		const user = await prisma.user.findUnique({
			where: { clerkId }
		});

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Check if the parent folder exists, if specified
		if (parentFolder) {
			const parent = await prisma.folder.findUnique({
				where: { id: parentFolder }
			});

			if (!parent) {
				return res.status(404).json({ error: "Parent folder not found" });
			}
		}

		// Create new folder
		const newFolder = await prisma.folder.create({
			data: {
				userId: user.id,
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
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
}
