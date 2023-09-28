import fs from "node:fs";
import path from "node:path";

import { type RouteList } from "../types/Routes";
import { normalizeOptions } from "./normalize-options";

export type PostmanCollection = {
	info: {
		name: string;
		schema: string;
	};
	item: {
		name: string;
		request: {
			method: string;
			header: [];
			body: { mode: string };
			url: { raw: string; path: string[]; host: string[] };
		};
	}[];
	event: {
		listen: string;
		script: {
			type: string;
			exec: [string];
		};
	}[];
	variable: { key: string; value: string; type: "string" }[];
};
export type ConversionOptions = {
	flat: boolean;
	fileName: string;
};

export const defaultOptions: ConversionOptions = {
	flat: true,
	fileName: "./export.postman_collection.json",
};

const convertToPostmanCollection = (
	routes: RouteList,
	options: Partial<ConversionOptions>
) => {
	options = normalizeOptions(options, defaultOptions);
	options.fileName = path.resolve(process.cwd(), options.fileName as string);

	const collectionBaseTemplate: PostmanCollection = {
		info: {
			name: "Postman Collection",
			schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
		},
		item: [],
		event: [
			{
				listen: "prerequest",
				script: {
					type: "text/javascript",
					exec: [""],
				},
			},
			{
				listen: "test",
				script: {
					type: "text/javascript",
					exec: [""],
				},
			},
		],
		variable: [
			{
				key: "BASE_URL",
				value: "<Your backend's base url specific to your environment>",
				type: "string",
			},
		],
	};

	if (options.flat) {
		for (const route of routes) {
			const routePathFragments = route.path
				.split("/")
				.map((str) => str.trim())
				.filter(Boolean);

			const routeName = routePathFragments.join("/") || "/";
			collectionBaseTemplate.item.push({
				name: routeName,
				request: {
					method: route.method,
					header: [],
					body: { mode: "" },
					url: {
						raw: `{{BASE_URL}}${route.path}`,
						host: [`{{BASE_URL}}`],
						path: routePathFragments,
					},
				},
			});
		}
	} else {
		// TODO:

		// Group close routes together
		// And nest successive paths inside folders
		const flatRoutes = [...routes];
		const nestedRoutes = [];
		for (let route of flatRoutes) {
		}
	}

	fs.writeFileSync(
		options.fileName,
		JSON.stringify(collectionBaseTemplate, null, 4)
	);
};

export default convertToPostmanCollection;
