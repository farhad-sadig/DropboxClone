import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import authMiddleware from "@/middleware/authMiddleware";
import { validateRequest, internalServerErrorResponse } from "@/libs/helpers";

const postHandler = async (req: NextRequest) => {
	
	
	
	const user = req.user!;

	const { name, parentFolder } = await req.json();

	if (!name) {
		return NextResponse.json(
			{ error: "Folder name is required" },
			{ status: 400 }
		);
	}

	try {
		const validation = await validateRequest(user.id, parentFolder);
		if (validation.error) {
			return NextResponse.json(
				{ error: validation.error },
				{ status: validation.statusCode }
			);
		}

		const newFolder = await prisma.folder.create({
			data: {
				userId: validation.user!.id,
				name,
				parentFolderId: parentFolder || null
			}
		});

		return NextResponse.json(
			{
				id: newFolder.id,
				name: newFolder.name,
				userId: newFolder.userId,
				parentFolderId: newFolder.parentFolderId,
				createdAt: newFolder.createdAt
			},
			{ status: 201 }
		);
	} catch (error) {
		return internalServerErrorResponse(error);
	}
};

const getHandler = async (req: NextRequest) => {
	const user = req.user!;

	const folderId = req.nextUrl.searchParams.get("folderId") as string;

	try {
		const validation = await validateRequest(user.id, folderId);
		if (validation.error) {
			return NextResponse.json(
				{ error: validation.error },
				{ status: validation.statusCode }
			);
		}

		return NextResponse.json(validation.folder, { status: 200 });
	} catch (error) {
		return internalServerErrorResponse(error);
	}
};

const putHandler = async (req: NextRequest) => {
	const user = req.user!;

	const { folderId, name, parentFolder } = await req.json();

	try {
		const validation = await validateRequest(user.id, folderId);
		if (validation.error) {
			return NextResponse.json(
				{ error: validation.error },
				{ status: validation.statusCode }
			);
		}

		const updatedFolder = await prisma.folder.update({
			where: { id: folderId },
			data: {
				name,
				parentFolderId: parentFolder || null
			}
		});

		return NextResponse.json(updatedFolder, { status: 200 });
	} catch (error) {
		return internalServerErrorResponse(error);
	}
};

const deleteHandler = async (req: NextRequest) => {
	const user = req.user!;

	const { folderId } = await req.json();

	try {
		const validation = await validateRequest(user.id, folderId);
		if (validation.error) {
			return NextResponse.json(
				{ error: validation.error },
				{ status: validation.statusCode }
			);
		}

		await prisma.folder.delete({
			where: { id: folderId }
		});

		return NextResponse.json(
			{ message: "Folder deleted successfully" },
			{ status: 200 }
		);
	} catch (error) {
		return internalServerErrorResponse(error);
	}
};

export const POST = authMiddleware(postHandler);
export const GET = authMiddleware(getHandler);
export const PUT = authMiddleware(putHandler);
export const DELETE = authMiddleware(deleteHandler);
