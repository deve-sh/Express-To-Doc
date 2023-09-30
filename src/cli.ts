#!/usr/bin/env node

import path from "node:path";
import { execSync } from "child_process";
import expressListRoutes from "express-list-routes";
import minimist from "minimist";
import chalk from "chalk";
import { prompt } from "enquirer";

import type { ExpressApp } from "./types/App";
import type { Route } from "./types/Routes";

// Utils
import normalizeRoutePath from "./lib/normalize-route-path";
import { warn } from "./lib/log";

type CLIFlags = {
	doc?: "Postman";
	flat?: boolean;
	fileName?: string;
	collectionName?: string;
} & {
	preBuildStep?: string;
	appPath?: string;
	moduleName?: string;
};

const flags = minimist(process.argv.slice(2), {
	boolean: ["flat"],
}) as unknown as CLIFlags;

// converters
import convertToPostmanCollection from "./lib/to-postman";

async function execute() {
	try {
		if (!("appPath" in flags))
			flags.appPath = (
				await prompt({
					type: "input",
					name: "appPath",
					message: "Path to your application:",
				})
			)["appPath"];

		if (!("preBuildStep" in flags)) {
			flags.preBuildStep = (
				await prompt({
					type: "input",
					name: "preBuildStep",
					message:
						"Any pre-build steps to your app? If you're using a compiler like TypeScript:",
				})
			)["preBuildStep"];
		}

		if (!("moduleName" in flags))
			flags.moduleName = (
				await prompt({
					type: "input",
					name: "moduleName",
					message:
						"Name of your module export? Enter 'default' for default export apps compiled in ESM or TypeScript",
				})
			)["moduleName"];

		if (flags.preBuildStep) {
			warn(
				chalk.yellow(
					"Running pre-build script. Please wait before proceeding."
				)
			);
			execSync(flags.preBuildStep, { stdio: "inherit" });
		}

		// Optional TODO: Add an export statement yourself if there isn't one in the specified file.
		flags.appPath = path.resolve(process.cwd(), flags.appPath as string);
		const exported = require(flags.appPath);

		const app = flags.moduleName
			? (exported[flags.moduleName] as ExpressApp)
			: (exported as ExpressApp);

		const routes = expressListRoutes(app).map((route: Route) => ({
			...route,
			path: normalizeRoutePath(route.path),
		}));

		if (!routes.length) {
			warn(
				chalk.yellow("There are no routes in your Express application.")
			);
			process.exit(0);
		}

		if (!("doc" in flags))
			flags.doc = (
				await prompt({
					type: "multiselect",
					name: "doc",
					message: "Type of documentation you want to export?",
					// @ts-expect-error Incorrect types in enquirer
					choices: [
						{
							name: "Postman",
							value: "postman",
							hint: "Generates a basic Postman Collection file for you to import and get started with",
						},
					],
					initial: ["Postman"],
					maxChoices: 1,
				})
			)["doc"][0];
		// If there is no default option
		flags.doc = flags.doc || "Postman";

		if (flags.doc === "Postman") {
			const { defaultOptions } = await import("./lib/to-postman");

			if (!("fileName" in flags))
				flags.fileName = (
					await prompt({
						type: "input",
						name: "fileName",
						message: "Filename to export Postman collection to",
						initial: defaultOptions.fileName,
					})
				)["fileName"];

			if (!("flat" in flags))
				flags.flat = (
					await prompt({
						type: "confirm",
						name: "flat",
						message: "Flat (Don't nest routers into each other)",
						initial: defaultOptions.flat,
					})
				)["flat"];

			if (!("collectionName" in flags))
				flags.collectionName = (
					await prompt({
						type: "input",
						name: "collectionName",
						message: "Name of Postman Collection",
						initial: defaultOptions.collectionName,
					})
				)["collectionName"];

			convertToPostmanCollection(routes, {
				flat: flags.flat,
				fileName: flags.fileName,
				collectionName: flags.collectionName,
			});
		}

		process.exit(0);
	} catch (errorMessage) {
		console.error(errorMessage);
		process.exit(1);
	}
}

execute();
