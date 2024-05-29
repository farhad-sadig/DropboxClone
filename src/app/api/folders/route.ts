import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/dbConnect";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req: NextApiRequest, res: NextApiResponse) {
	const { userId } = getAuth(req);

	if (!userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	if (req.method === "POST") {
		const { name, parentFolder } = req.body;

		try {
			const newFolder = await prisma.folder.create({
				data: {
					userId,
					name,
					parentFolderId: parentFolder || null
				}
			});

			if (parentFolder) {
				const parent = await prisma.folder.findUnique({
					where: { id: parentFolder }
				});

				if (!parent) {
					return res.status(404).json({ error: "Parent folder not found" });
				}

				await prisma.folder.update({
					where: { id: parentFolder },
					data: {
						subFolders: {
							connect: { id: newFolder.id }
						}
					}
				});
			}

			res.status(201).json(newFolder);
		} catch (error) {
			res.status(500).json({ error: "Internal server error" });
		}
	} else {
		res.status(405).json({ error: "Method not allowed" });
	}
}
