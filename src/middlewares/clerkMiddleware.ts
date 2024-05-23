import { withAuth } from "@clerk/nextjs/api";

export default function clerkMiddleware(handler: any) {
	return withAuth(async (req, res) => {
		if (req.auth) {
			req.user = req.auth.user;
			return handler(req, res);
		} else {
			res.status(401).json({ error: "Unauthorized" });
		}
	});
}
