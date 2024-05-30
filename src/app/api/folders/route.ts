import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextApiRequest, res: NextApiResponse) {
	const { userId } = auth();

	if (!userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const { name, parentFolder } = req.body;

	try {
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
				userId,
				name,
				parentFolderId: parentFolder || null
			}
		});

		res.status(201).json(newFolder);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
}
