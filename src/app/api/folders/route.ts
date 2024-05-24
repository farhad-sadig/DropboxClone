import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/dbConnect";
import Folder, { IFolder } from "@/models/Folder";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
	const user = await currentUser();

	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	await dbConnect();

	const { name, parentFolderId }: Partial<IFolder> = await request.json();

	let parentFolderObjectId = null;
	if (parentFolderId && mongoose.Types.ObjectId.isValid(parentFolderId)) {
		parentFolderObjectId = new mongoose.Types.ObjectId(parentFolderId);
	}

	const newFolder = new Folder({
		userId: user.id,
		name,
		parentFolderId: parentFolderObjectId
	});

	await newFolder.save();
	return NextResponse.json(newFolder, { status: 201 });
}

export async function GET() {
	const user = await currentUser();

	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	await dbConnect();

	const folders = await Folder.find({
		userId: user.id,
		parentFolderId: null
	}).exec();
	return NextResponse.json(folders, { status: 200 });
}
