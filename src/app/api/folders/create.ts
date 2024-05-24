import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import Folder from "@/models/Folder";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req: NextApiRequest, res: NextApiResponse) {
	const { userId } = getAuth(req);

	if (!userId) {
		return new Response("Unauthorized", { status: 401 });
	}
	await dbConnect();

	if (req.method === "POST") {
		const { name, parentFolder } = req.body;

		const newFolder = new Folder({
			userId,
			name,
			parentFolder: parentFolder || null,
			subFolders: []
		});

		if (parentFolder) {
			const parent = await Folder.findById(parentFolder);
			if (!parent) {
				return res.status(404).json({ error: "Parent folder not found" });
			}
			parent.subFolders.push(newFolder._id as mongoose.Types.ObjectId);
			await parent.save();
		}

		await newFolder.save();
		res.status(201).json(newFolder);
	} else {
		res.status(405).json({ error: "Method not allowed" });
	}
}
