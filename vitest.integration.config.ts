import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";


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
