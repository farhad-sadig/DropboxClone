import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: "node",
		include: ["src/app/api/**/*.integration.test.ts"]
	},
	resolve: {
		alias: [{ find: "@", replacement: resolve(__dirname, "./src") }]
	}
});
