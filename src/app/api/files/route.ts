import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/libs/prisma";
import authMiddleware from "@/middleware";
import { uploadFile, deleteFile } from "@/utils/s3";
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

	const { name, folderId, file } = req.body;

	if (!name || !file) {
		return res
			.status(400)
			.json({ error: "File name and file content are required" });
	}

	try {
		const validation = await validateRequest(clerkId, folderId);
		if (validation.error) {
			return res
				.status(validation.statusCode)
				.json({ error: validation.error });
		}

		// Convert file to Buffer
		const fileBuffer = Buffer.from(file, "base64"); // Assuming the file is sent as a base64 encoded string

		// Upload the file to S3
		const bucketName = process.env.AWS_S3_BUCKET_NAME!;
		const fileKey = `files/${clerkId}/${Date.now()}_${name}`;
		const s3Response = await uploadFile(fileBuffer, bucketName, fileKey);

		// Create the file record in the database
		const newFile = await prisma.file.create({
			data: {
				userId: validation.user!.id,
				name,
				folderId: folderId || null,
				url: s3Response.Location
			}
		});

		res.status(201).json({
			id: newFile.id,
			name: newFile.name,
			userId: newFile.userId,
			folderId: newFile.folderId,
			url: newFile.url,
			createdAt: newFile.createdAt
		});
	} catch (error) {
		internalServerErrorResponse(error, res);
	}
}

// Similarly, update PUT and DELETE handlers to use S3 as needed
