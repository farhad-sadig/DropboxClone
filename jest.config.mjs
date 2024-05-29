import { pathsToModuleNameMapper } from "ts-jest";
import tsConfig from "./tsconfig.json" assert { type: "json" };

/** @type {import('ts-jest').JestConfigWithTsJest} */
const jestConfig = {
	preset: "ts-jest",
	testEnvironment: "node",
	moduleNameMapper: pathsToModuleNameMapper(tsConfig.compilerOptions.paths, {
		prefix: "<rootDir>/"
	}),
	testPathIgnorePatterns: ["/node_modules/", "/.next/"]
};

export default jestConfig;
