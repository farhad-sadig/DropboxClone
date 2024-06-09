// src/types/next.d.ts

import { NextRequest } from "next/server";
import { User } from "@prisma/client";

declare module "next/server" {
	interface NextRequest {
		user?: User;
	}
}
