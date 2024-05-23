import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import File from "@/models/File";
import s3 from "@/utils/s3";
import upload from "@/middlewares/uploadMiddleware";
import clerkMiddleware from "@/middlewares/clerkMiddleware";
import nextConnect from "next-connect";

const handler = nextConnect();
handler.use(upload.single("file"));

export const POST = clerkMiddleware(
	async (req: NextApiRequest, res: NextApiResponse) => {
		await dbConnect();

		const { user } = req.body;
		const { file } = req;

		const uploadParams = {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: file.originalname,
			Body: file.buffer
		};

		try {
			const data = await s3.upload(uploadParams).promise();

			const newFile = new File({
				userId: user.id,
				filename: file.originalname,
				url: data.Location,
				size: file.size
			});

			await newFile.save();
			return NextResponse.json(newFile, { status: 201 });
		} catch (err) {
			return NextResponse.json(
				{ error: "Error uploading file" },
				{ status: 500 }
			);
		}
	}
);
