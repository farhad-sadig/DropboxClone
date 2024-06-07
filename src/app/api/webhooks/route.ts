import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/libs/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

	if (!WEBHOOK_SECRET) {
		throw new Error(
			"Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
		);
	}

	// Get the headers
	const headerPayload = headers();
	const svix_id = headerPayload.get("svix-id");
	const svix_timestamp = headerPayload.get("svix-timestamp");
	const svix_signature = headerPayload.get("svix-signature");

	// If there are no headers, error out
	if (!svix_id || !svix_timestamp || !svix_signature) {
		return NextResponse.json(
			{ error: "Error occurred -- no svix headers" },
			{ status: 400 }
		);
	}

	// Get the body
	const payload = await req.json();
	const body = JSON.stringify(payload);

	// Create a new Svix instance with your secret.
	const wh = new Webhook(WEBHOOK_SECRET);

	let evt: WebhookEvent;

	// Verify the payload with the headers
	try {
		evt = wh.verify(body, {
			"svix-id": svix_id,
			"svix-timestamp": svix_timestamp,
			"svix-signature": svix_signature
		}) as WebhookEvent;
	} catch (err) {
		console.error("Error verifying webhook:", err);
		return NextResponse.json({ error: "Error occurred" }, { status: 400 });
	}

	// Handle the event
	const eventType = evt.type;

	if (eventType === "user.updated" || eventType === "user.created") {
		const { id: clerkId, email_addresses } = evt.data;
		const email = email_addresses[0]?.email_address;

		if (!email) {
			return NextResponse.json({ error: "Email is required" }, { status: 400 });
		}

		try {
			const user = await prisma.user.create({
				data: {
					clerkId,
					email
				}
			});
			return NextResponse.json(user, { status: 201 });
		} catch (error) {
			console.error("Error creating user:", error);
			return NextResponse.json(
				{ error: "Failed to create user" },
				{ status: 500 }
			);
		}
	}

	return NextResponse.json({ error: "Unhandled event type" }, { status: 400 });
}
